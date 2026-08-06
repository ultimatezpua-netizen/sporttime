"""Merge the full SportTime product export into the catalog.

The XML/YML feed remains the base catalog. This export is the primary source
for product media and supplemental merchant content. It is matched by the
export's Артикул and never creates products that are absent from XML.
"""

from __future__ import annotations

import json
import re
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS = {"m": MAIN_NS}
WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
REPORT_DIR = Path(__file__).resolve().parents[1] / "reports"
CATALOG_PATH = DATA_DIR / "catalog.json"
META_PATH = DATA_DIR / "catalog-meta.json"
REPORT_PATH = REPORT_DIR / "product-export-media-report.md"
JSON_REPORT_PATH = REPORT_DIR / "product-export-media-report.json"
EXPORT_NAME = "54cdd4d937bc41c9803bea1d75197599_1785442554142.xlsx"


def column_number(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference or "")
    if not letters:
        return 0
    number = 0
    for letter in letters.group(0):
        number = number * 26 + ord(letter) - ord("A") + 1
    return number


def cell_text(cell: ET.Element, shared_strings: list[str]) -> str:
    inline = cell.find(f"{{{MAIN_NS}}}is")
    if inline is not None:
        return "".join(text.text or "" for text in inline.iter(f"{{{MAIN_NS}}}t")).strip()
    value = cell.find(f"{{{MAIN_NS}}}v")
    raw = (value.text or "").strip() if value is not None else ""
    if cell.attrib.get("t") == "s":
        try:
            return shared_strings[int(raw)].strip()
        except (ValueError, IndexError):
            return ""
    return raw


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return [
        "".join(text.text or "" for text in item.iter(f"{{{MAIN_NS}}}t")).strip()
        for item in root.findall("m:si", NS)
    ]


def read_xlsx(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    rows: list[list[str]] = []
    with zipfile.ZipFile(path) as archive:
        shared_strings = read_shared_strings(archive)
        worksheets = sorted(
            name
            for name in archive.namelist()
            if name.startswith("xl/worksheets/") and name.endswith(".xml")
        )
        for worksheet_name in worksheets:
            root = ET.fromstring(archive.read(worksheet_name))
            for row in root.findall(".//m:row", NS):
                cells = {
                    column_number(cell.attrib.get("r", "")): cell_text(cell, shared_strings)
                    for cell in row.findall("m:c", NS)
                }
                if cells:
                    rows.append([cells.get(index, "") for index in range(1, max(cells) + 1)])
    if not rows:
        return [], []
    headers = [header.strip() for header in rows[0]]
    records = [
        {
            headers[index]: row[index].strip() if index < len(row) else ""
            for index in range(len(headers))
            if headers[index]
        }
        for row in rows[1:]
    ]
    return headers, records


def normalized_token(value: Any) -> str:
    return re.sub(r"[^a-z0-9а-яіїєґ]+", "", str(value or "").lower())


def parse_urls(value: str) -> list[str]:
    """Split semicolon/newline-separated URLs while preserving source order."""
    urls: list[str] = []
    for candidate in re.split(r"\s*;\s*|\r?\n+", value or ""):
        cleaned = candidate.strip()
        if cleaned and re.match(r"^https?://", cleaned, flags=re.IGNORECASE):
            if cleaned not in urls:
                urls.append(cleaned)
    return urls


def product_index(products: list[dict[str, Any]], field: str) -> dict[str, list[dict[str, Any]]]:
    index: dict[str, list[dict[str, Any]]] = {}
    for product in products:
        token = str(product.get(field) or "").strip().lower()
        if token:
            index.setdefault(token, []).append(product)
    return index


def normalized_product_index(products: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    index: dict[str, list[dict[str, Any]]] = {}
    for product in products:
        for field in ("sku", "vendorCode"):
            token = normalized_token(product.get(field))
            if token and product not in index.setdefault(token, []):
                index[token].append(product)
    return index


def choose_product(
    article: str,
    exact_sku: dict[str, list[dict[str, Any]]],
    exact_vendor: dict[str, list[dict[str, Any]]],
    normalized: dict[str, list[dict[str, Any]]],
) -> tuple[dict[str, Any] | None, str]:
    raw = article.strip().lower()
    exact_matches_by_id = {
        str(product.get("id", "")): product
        for product in exact_sku.get(raw, []) + exact_vendor.get(raw, [])
    }
    exact_matches = list(exact_matches_by_id.values())
    if len(exact_matches) == 1:
        return exact_matches[0], "exact"
    if len(exact_matches) > 1:
        return None, "ambiguous_exact"

    fallback_by_id = {
        str(product.get("id", "")): product
        for product in normalized.get(normalized_token(article), [])
    }
    fallback_matches = list(fallback_by_id.values())
    if len(fallback_matches) == 1:
        return fallback_matches[0], "normalized"
    if len(fallback_matches) > 1:
        return None, "ambiguous_normalized"
    return None, "unmatched"


def html_value(row: dict[str, str], ua: str, ru: str) -> tuple[str, str]:
    return row.get(ua, "").strip(), row.get(ru, "").strip()


def merge_row(product: dict[str, Any], row: dict[str, str]) -> dict[str, Any]:
    photo_urls = parse_urls(row.get("Фото", ""))
    gallery_urls = parse_urls(row.get("Галерея", ""))
    image_360 = parse_urls(row.get("Обзор 360", ""))
    existing_images = product.get("images") if isinstance(product.get("images"), list) else []

    # The export is the primary media source when it contains media. Photo
    # order is retained, then separate gallery URLs are appended if new.
    imported_images = list(photo_urls)
    for url in gallery_urls:
        if url not in imported_images:
            imported_images.append(url)
    if imported_images:
        product["images"] = imported_images
        product["image"] = imported_images[0]
        product["mediaSource"] = "product-export-xlsx"
    elif existing_images:
        product["images"] = existing_images
        product["image"] = existing_images[0]
        product["mediaSource"] = product.get("mediaSource", "xml-yml")

    description_ua, description_ru = html_value(
        row, "Описание товара (UA)", "Описание товара (RU)"
    )
    short_ua, short_ru = html_value(
        row, "Короткое описание (UA)", "Короткое описание (RU)"
    )
    if description_ua or description_ru:
        product["descriptionHtml"] = description_ua or description_ru
        product["descriptionHtmlRu"] = description_ru
        product["descriptionSource"] = "product-export-xlsx"
    if short_ua or short_ru:
        product["shortDescription"] = short_ua or short_ru
        product["shortDescriptionRu"] = short_ru

    product["seo"] = {
        "title": row.get("HTML title (UA)", "").strip(),
        "titleRu": row.get("HTML title (RU)", "").strip(),
        "keywords": row.get("META keywords (UA)", "").strip(),
        "keywordsRu": row.get("META keywords (RU)", "").strip(),
        "description": row.get("META description (UA)", "").strip(),
        "descriptionRu": row.get("META description (RU)", "").strip(),
        "h1": row.get("h1 заголовок (UA)", "").strip(),
        "h1Ru": row.get("h1 заголовок (RU)", "").strip(),
    }
    product["media360"] = image_360
    product["merchantData"] = {
        key: value.strip()
        for key, value in row.items()
        if value and value.strip()
    }

    if photo_urls or gallery_urls:
        product["mediaCounts"] = {
            "photoField": len(photo_urls),
            "galleryField": len(gallery_urls),
            "images": len(product.get("images", [])),
        }
    return product


def main() -> None:
    export_path = WORKSPACE_ROOT / "attached_assets" / EXPORT_NAME
    if not export_path.exists():
        raise FileNotFoundError(export_path)

    headers, rows = read_xlsx(export_path)
    products: list[dict[str, Any]] = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    exact_sku = product_index(products, "sku")
    exact_vendor = product_index(products, "vendorCode")
    normalized = normalized_product_index(products)

    counters: Counter[str] = Counter()
    unmatched: list[dict[str, str]] = []
    examples: list[dict[str, Any]] = []
    matched_product_ids: set[str] = set()
    media_gallery_counts: Counter[str] = Counter()
    seo_counts: Counter[str] = Counter()
    description_count = 0
    duplicate_product_rows = 0

    for row_number, row in enumerate(rows, start=2):
        article = row.get("Артикул", "").strip()
        product, method = choose_product(article, exact_sku, exact_vendor, normalized)
        if product is None:
            counters[method] += 1
            unmatched.append(
                {
                    "row": str(row_number),
                    "sku": article,
                    "name": row.get("Название (UA)", ""),
                    "reason": method,
                }
            )
            continue

        counters["matchedRows"] += 1
        product_id = str(product.get("id", ""))
        if product_id in matched_product_ids:
            duplicate_product_rows += 1
        matched_product_ids.add(product_id)
        before_images = list(product.get("images") or [])
        before_description = bool(product.get("descriptionHtml"))
        updated = merge_row(product, row)
        photo_count = len(parse_urls(row.get("Фото", "")))
        final_count = len(updated.get("images") or [])
        media_gallery_counts["1+" if final_count >= 1 else "0"] += 1
        if final_count >= 2:
            media_gallery_counts["2+"] += 1
        if final_count >= 3:
            media_gallery_counts["3+"] += 1
        if final_count >= 5:
            media_gallery_counts["5+"] += 1
        if photo_count >= 2:
            counters["photoField2Plus"] += 1
        if row.get("Фото", "").strip() or row.get("Галерея", "").strip():
            counters["productsWithExportMedia"] += 1
        if row.get("Обзор 360", "").strip():
            counters["productsWith360"] += 1
        if row.get("Описание товара (UA)", "").strip() or row.get("Описание товара (RU)", "").strip():
            description_count += 1
        for field, key in (
            ("HTML title (UA)", "title"),
            ("META keywords (UA)", "keywords"),
            ("META description (UA)", "description"),
            ("h1 заголовок (UA)", "h1"),
        ):
            if row.get(field, "").strip():
                seo_counts[key] += 1

        if len(examples) < 12 and (
            len(updated.get("images") or []) > len(before_images)
            or bool(updated.get("descriptionHtml")) != before_description
        ):
            examples.append(
                {
                    "sku": product.get("sku", ""),
                    "name": product.get("name", ""),
                    "beforeImageCount": len(before_images),
                    "afterImageCount": len(updated.get("images") or []),
                    "images": updated.get("images", []),
                    "htmlDescriptionImported": bool(updated.get("descriptionHtml")),
                    "seoTitle": updated.get("seo", {}).get("title", ""),
                }
            )

    for product in products:
        images = product.get("images") if isinstance(product.get("images"), list) else []
        product["image"] = images[0] if images else ""
        product["images"] = images
        if "descriptionHtml" not in product:
            product["descriptionHtml"] = ""
            product["descriptionHtmlRu"] = ""
        if "shortDescription" not in product:
            product["shortDescription"] = ""
            product["shortDescriptionRu"] = ""
        if "seo" not in product:
            product["seo"] = {
                "title": "",
                "titleRu": "",
                "keywords": "",
                "keywordsRu": "",
                "description": "",
                "descriptionRu": "",
                "h1": "",
                "h1Ru": "",
            }
        if "merchantData" not in product:
            product["merchantData"] = {}
        if "media360" not in product:
            product["media360"] = []

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceFile": EXPORT_NAME,
        "columnCount": len(headers),
        "rowCount": len(rows),
        "matchedRows": counters["matchedRows"],
        "matchedProductCount": len(matched_product_ids),
        "unmatchedRows": len(unmatched),
        "unmatchedByReason": dict(Counter(item["reason"] for item in unmatched)),
        "duplicateProductRows": duplicate_product_rows,
        "productsWithExportMedia": counters["productsWithExportMedia"],
        "photoField2Plus": counters["photoField2Plus"],
        "productsWith360": counters["productsWith360"],
        "htmlDescriptionsImported": description_count,
        "seoFieldsImported": dict(seo_counts),
        "galleryCounts": dict(media_gallery_counts),
        "examples": examples,
        "unmatchedDetails": unmatched,
        "allHeaders": headers,
    }

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    metadata = json.loads(META_PATH.read_text(encoding="utf-8")) if META_PATH.exists() else {}
    metadata["productExport"] = {
        "sourceFile": EXPORT_NAME,
        "columnCount": len(headers),
        "rowCount": len(rows),
        "matchedRows": report["matchedRows"],
        "matchedProductCount": report["matchedProductCount"],
        "galleryCounts": report["galleryCounts"],
        "htmlDescriptionsImported": description_count,
        "seoFieldsImported": dict(seo_counts),
        "generatedAt": report["generatedAt"],
    }
    META_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    JSON_REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Аудит товарного Excel-экспорта: медиа и контент",
        "",
        f"Дата: `{report['generatedAt']}`",
        f"Источник: `{EXPORT_NAME}`",
        "",
        "## Объём",
        "",
        f"- Колонок прочитано: **{len(headers)}**",
        f"- Строк товаров прочитано: **{len(rows)}**",
        f"- Строк сопоставлено: **{report['matchedRows']}**",
        f"- Товаров сопоставлено: **{report['matchedProductCount']}**",
        f"- Строк не сопоставлено: **{report['unmatchedRows']}**",
        f"- Повторных строк на один товар: **{duplicate_product_rows}**",
        "",
        "## Медиа",
        "",
        f"- Товаров с медиа из Excel: **{report['productsWithExportMedia']}**",
        f"- Строк, где поле `Фото` содержит 2+ URL: **{report['photoField2Plus']}**",
        f"- Галерея 2+ изображений: **{report['galleryCounts'].get('2+', 0)}**",
        f"- Галерея 3+ изображений: **{report['galleryCounts'].get('3+', 0)}**",
        f"- Галерея 5+ изображений: **{report['galleryCounts'].get('5+', 0)}**",
        f"- Заполнено `Обзор 360`: **{report['productsWith360']}**",
        "- Для каждого товара с фото `image` установлен равным `images[0]`.",
        "- URL из `Фото` импортируются в исходном порядке; URL из отдельного `Галерея` добавляются после них без дублей.",
        "",
        "## HTML и SEO",
        "",
        f"- HTML-описаний импортировано: **{report['htmlDescriptionsImported']}**",
        f"- HTML title (UA): **{seo_counts.get('title', 0)}**",
        f"- META keywords (UA): **{seo_counts.get('keywords', 0)}**",
        f"- META description (UA): **{seo_counts.get('description', 0)}**",
        f"- H1 (UA): **{seo_counts.get('h1', 0)}**",
        "- Полный непустой набор колонок сохранён в `merchantData` каждого сопоставленного товара.",
        "",
        "## Примеры",
        "",
    ]
    for example in examples:
        lines += [
            f"### SKU `{example['sku']}` — {example['name']}",
            f"- Изображений было: **{example['beforeImageCount']}**, стало: **{example['afterImageCount']}**",
            f"- HTML импортирован: **{'да' if example['htmlDescriptionImported'] else 'нет'}**",
            f"- SEO title: `{example['seoTitle']}`",
            "- Первые URL:",
        ]
        lines += [f"  - `{url}`" for url in example["images"][:5]]
        lines.append("")

    lines += ["## Несопоставленные строки", ""]
    if unmatched:
        lines.extend(
            f"- Строка {item['row']}, SKU `{item['sku']}` — {item['reason']} — {item['name']}"
            for item in unmatched
        )
    else:
        lines.append("Нет.")
    lines += [
        "",
        "## Сохранённые поля",
        "",
        "- `images` и `image` — медиа из товарного Excel, с fallback на XML только если Excel не содержит фото.",
        "- `descriptionHtml`, `descriptionHtmlRu` — исходное HTML-описание без удаления тегов.",
        "- `shortDescription`, `shortDescriptionRu` — короткое описание.",
        "- `seo` — HTML title, META keywords, META description и H1 на UA/RU.",
        "- `media360` — отдельный массив URL из `Обзор 360`, не смешивается с обычной галереей.",
        "- `merchantData` — все непустые поля исходной строки, включая цену, наличие, цвет, гарантию и характеристики.",
    ]
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(
        f"Read {len(rows)} rows / {len(headers)} columns; matched "
        f"{report['matchedRows']} rows and {report['matchedProductCount']} products; "
        f"HTML descriptions {description_count}; galleries 2+/3+/5+ = "
        f"{report['galleryCounts'].get('2+', 0)}/"
        f"{report['galleryCounts'].get('3+', 0)}/"
        f"{report['galleryCounts'].get('5+', 0)}."
    )


if __name__ == "__main__":
    main()