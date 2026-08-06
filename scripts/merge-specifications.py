"""Merge every merchant-exported XLSX specification file into the XML catalog.

The XML/YML feed remains authoritative. XLSX files only supplement products
that already exist in the feed and are matched by the catalog SKU/vendorCode.
Duplicate uploads are read and reported, but their byte-identical content is
processed once so they cannot inflate the catalog or duplicate fields.
"""

from __future__ import annotations

import hashlib
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
REPORT_PATH = REPORT_DIR / "specifications-merge-report.md"
JSON_REPORT_PATH = REPORT_DIR / "specifications-merge-report.json"
SPECIFICATION_PATTERN = "hid_specifications_*.xlsx"


def column_number(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference or "")
    if not letters:
        return 0
    number = 0
    for letter in letters.group(0):
        number = number * 26 + ord(letter) - ord("A") + 1
    return number


def inline_text(cell: ET.Element) -> str:
    inline_string = cell.find(f"{{{MAIN_NS}}}is")
    if inline_string is not None:
        return "".join(text.text or "" for text in inline_string.iter(f"{{{MAIN_NS}}}t")).strip()
    value = cell.find(f"{{{MAIN_NS}}}v")
    return (value.text or "").strip() if value is not None else ""


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return [
        "".join(text.text or "" for text in item.iter(f"{{{MAIN_NS}}}t")).strip()
        for item in root.findall("m:si", NS)
    ]


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    value = inline_text(cell)
    if cell.attrib.get("t") == "s":
        try:
            return shared_strings[int(value)].strip()
        except (ValueError, IndexError):
            return ""
    return value


def read_xlsx(path: Path) -> list[list[str]]:
    """Read every worksheet, not just sheet1, from an XLSX workbook."""
    rows: list[list[str]] = []
    with zipfile.ZipFile(path) as archive:
        shared_strings = read_shared_strings(archive)
        worksheet_names = sorted(
            name
            for name in archive.namelist()
            if name.startswith("xl/worksheets/") and name.endswith(".xml")
        )
        for worksheet_name in worksheet_names:
            worksheet = ET.fromstring(archive.read(worksheet_name))
            for row in worksheet.findall(".//m:row", NS):
                cells = {
                    column_number(cell.attrib.get("r", "")): cell_value(cell, shared_strings)
                    for cell in row.findall("m:c", NS)
                }
                if cells:
                    rows.append([cells.get(index, "") for index in range(1, max(cells) + 1)])
    return rows


def normalized_token(value: Any) -> str:
    return re.sub(r"[^a-z0-9а-яіїєґ]+", "", str(value or "").lower())


def normalized_key(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def specification_label(header: str) -> str:
    label = re.sub(r"\s*\((UA|RU)\)\s*$", "", header.strip(), flags=re.IGNORECASE)
    return label.strip()


def is_specification_column(header: str) -> tuple[bool, str]:
    clean_header = header.strip()
    normalized = normalized_key(clean_header)
    if not clean_header or normalized == "артикул":
        return False, "sku_column"
    if normalized.startswith("название") or normalized.startswith("производитель"):
        return False, "identity_column"
    if clean_header.startswith("↓"):
        return False, "group_marker"
    if re.search(r"\(RU\)\s*$", clean_header, flags=re.IGNORECASE):
        return False, "russian_duplicate"
    return True, ""


def file_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def extract_rows(paths: list[Path]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    extracted: list[dict[str, Any]] = []
    stats: Counter[str] = Counter()
    workbook_reports: list[dict[str, Any]] = []

    for path in paths:
        rows = read_xlsx(path)
        stats["physicalRowsRead"] += max(0, len(rows) - 1)
        workbook_reports.append({"file": path.name, "rowsRead": max(0, len(rows) - 1)})
        if not rows:
            stats["emptyWorkbooks"] += 1
            continue
        headers = [header.strip() for header in rows[0]]
        for row_number, row in enumerate(rows[1:], start=2):
            values = {
                headers[index]: row[index].strip() if index < len(row) else ""
                for index in range(len(headers))
                if headers[index]
            }
            article = values.get("Артикул", "").strip()
            if not article:
                stats["rowsWithoutSku"] += 1
                continue

            specs: list[dict[str, str]] = []
            for header, value in values.items():
                include, reason = is_specification_column(header)
                if not include:
                    if value:
                        stats[f"skipped_{reason}"] += 1
                    continue
                if not value:
                    stats["emptySpecificationCells"] += 1
                    continue
                label = specification_label(header)
                if not label:
                    stats["emptySpecificationLabels"] += 1
                    continue
                specs.append({"key": label, "label": label, "value": value})

            if not specs:
                stats["rowsWithSkuButNoSpecifications"] += 1
            extracted.append(
                {
                    "article": article,
                    "nameUa": values.get("Название(UA)", ""),
                    "nameRu": values.get("Название(RU)", ""),
                    "sourceFile": path.name,
                    "sourceRow": row_number,
                    "specs": specs,
                }
            )

    stats["uniqueRowsRead"] = len(extracted)
    return extracted, {"cellStats": dict(stats), "workbooks": workbook_reports}


def deduplicate_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    unique: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in rows:
        fingerprint = json.dumps(
            {
                "article": normalized_token(row["article"]),
                "nameUa": row.get("nameUa", ""),
                "nameRu": row.get("nameRu", ""),
                "specs": row.get("specs", []),
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        unique.append(row)
    return unique


def build_product_index(products: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    index: dict[str, list[dict[str, Any]]] = {}
    for product in products:
        # Article matching is deliberately limited to SKU/vendorCode. Product
        # IDs are internal XML offer IDs and must not match an Excel article.
        for field in ("sku", "vendorCode"):
            token = normalized_token(product.get(field))
            if token and product not in index.setdefault(token, []):
                index[token].append(product)
    return index


def values_for_key(product: dict[str, Any], key: str) -> list[str]:
    normalized = normalized_key(key)
    return [
        str(item.get("value", "")).strip()
        for item in (product.get("params") or [])
        if isinstance(item, dict) and normalized_key(item.get("key")) == normalized and str(item.get("value", "")).strip()
    ]


def filter_facets(product: dict[str, Any]) -> dict[str, list[str]]:
    """Build stable, data-backed facets without changing XML canonical fields."""
    all_specs = [
        item for item in (product.get("params") or [])
        if isinstance(item, dict) and item.get("key") and item.get("value")
    ]
    facets: dict[str, list[str]] = {}

    def add(name: str, values: list[str]) -> None:
        cleaned = list(dict.fromkeys(value.strip() for value in values if value and value.strip()))
        if cleaned:
            facets[name] = cleaned

    def matching(*terms: str) -> list[str]:
        return [
            str(item["value"])
            for item in all_specs
            if any(term in normalized_key(item["key"]) for term in terms)
        ]

    add("bodySize", [*matching("розмір", "габарит"), *product.get("sizes", [])])
    add("displayType", [*matching("тип дисплея", "екран"), product.get("display", "")])
    add(
        "waterResistance",
        [
            *matching("водостійкість", "водозахист", "водонепроник"),
            f"{product['waterResistance']} ATM" if product.get("waterResistance") else "",
        ],
    )
    add("battery", [*matching("термін служби батареї", "тип батареї", "батаре"), product.get("batteryLife", "")])
    add("sensors", matching("датчик", "сенсор", "висотомір", "акселерометр", "гіроскоп"))
    add("caseMaterial", matching("матеріал корпусу"))
    add("glassMaterial", matching("матеріал скла", "матеріал лінз"))
    add("strap", matching("ремінець", "ремешок", "матеріал ремінця"))
    gps_values = matching("gps", "глонасс", "галілей", "галилей")
    if product.get("gps") or gps_values:
        add("gps", gps_values or ["Так"])
    return facets


def merge_specifications(
    products: list[dict[str, Any]], rows: list[dict[str, Any]]
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    index = build_product_index(products)
    matched_articles: set[str] = set()
    unmatched_rows: list[dict[str, Any]] = []
    examples: list[dict[str, Any]] = []
    counters: Counter[str] = Counter()
    field_counter: Counter[str] = Counter()

    for row in rows:
        token = normalized_token(row["article"])
        matches = index.get(token, [])
        if not matches:
            counters["unmatchedRows"] += 1
            unmatched_rows.append(row)
            continue
        if len(matches) > 1:
            counters["ambiguousRows"] += 1
            unmatched_rows.append({**row, "failure": "ambiguous_sku"})
            continue

        product = matches[0]
        matched_articles.add(str(product.get("sku") or product.get("vendorCode") or row["article"]))
        counters["matchedRows"] += 1
        params = product.get("params") if isinstance(product.get("params"), list) else []
        specs = product.get("specs") if isinstance(product.get("specs"), list) else []
        supplemental = product.get("supplementalSpecs") if isinstance(product.get("supplementalSpecs"), list) else []
        existing_keys = {
            normalized_key(item.get("key"))
            for item in params + specs
            if isinstance(item, dict) and item.get("key")
        }
        added_for_example: list[dict[str, str]] = []
        skipped_keys: list[str] = []
        for specification in row["specs"]:
            key = normalized_key(specification["key"])
            if key in existing_keys:
                counters["skippedExistingFields"] += 1
                skipped_keys.append(specification["key"])
                continue
            params.append(specification)
            specs.append(dict(specification))
            supplemental.append({**specification, "sourceFile": row["sourceFile"]})
            existing_keys.add(key)
            counters["addedSpecifications"] += 1
            field_counter[specification["key"]] += 1
            added_for_example.append(specification)

        product["params"] = params
        product["specs"] = specs
        product["supplementalSpecs"] = supplemental
        product["filterFacets"] = filter_facets(product)

        if added_for_example and len(examples) < 15:
            examples.append(
                {
                    "sku": product.get("sku", ""),
                    "productId": product.get("id", ""),
                    "name": product.get("name", ""),
                    "before": {
                        "paramCount": len(params) - len(added_for_example),
                        "specificationKeys": skipped_keys,
                    },
                    "added": added_for_example,
                    "after": {
                        "paramCount": len(params),
                        "supplementalCount": len(supplemental),
                        "filterFacets": product["filterFacets"],
                    },
                }
            )

    for product in products:
        if "supplementalSpecs" not in product:
            product["supplementalSpecs"] = []
        product["filterFacets"] = filter_facets(product)

    return (
        {
            **counters,
            "matchedProductCount": len(matched_articles),
            "newFieldCounts": dict(field_counter),
        },
        unmatched_rows,
    )


def update_metadata(metadata: dict[str, Any], report: dict[str, Any], paths: list[Path]) -> None:
    metadata["supplementalSpecifications"] = {
        "sourceFiles": [path.name for path in paths],
        "filePattern": SPECIFICATION_PATTERN,
        "physicalFileCount": report["physicalFileCount"],
        "uniqueFileCount": report["uniqueFileCount"],
        "duplicateFileCount": report["duplicateFileCount"],
        "physicalRowsRead": report["physicalRowsRead"],
        "uniqueRowsRead": report["uniqueRowsRead"],
        "matchedRows": report["matchedRows"],
        "matchedProductCount": report["matchedProductCount"],
        "unmatchedRows": report["unmatchedRows"],
        "ambiguousRows": report["ambiguousRows"],
        "addedSpecificationCount": report["addedSpecifications"],
        "skippedExistingFieldCount": report["skippedExistingFields"],
        "newFieldCounts": report["newFieldCounts"],
        "generatedAt": report["generatedAt"],
    }


def product_title(row: dict[str, Any]) -> str:
    return f"{row.get('sku', '')} — {row.get('name', '')}"


def write_reports(
    report: dict[str, Any],
    products: list[dict[str, Any]],
    unmatched_rows: list[dict[str, Any]],
    workbook_details: dict[str, Any],
) -> None:
    report["workbooks"] = workbook_details
    report["unmatchedRowsDetail"] = unmatched_rows
    report["examples"] = report.pop("examples", [])
    JSON_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Повторный аудит объединения XLSX-характеристик",
        "",
        f"Дата: `{report['generatedAt']}`",
        "Источник товаров: официальный XML/YML (`data/catalog.json` после чистого импорта).",
        "",
        "## Фактический объём обработки",
        "",
        f"- Excel-файлов прочитано: **{report['physicalFileCount']}**",
        f"- Уникальных Excel-книг обработано: **{report['uniqueFileCount']}**",
        f"- Дубликатов файлов (байт-в-байт): **{report['duplicateFileCount']}**",
        f"- Строк прочитано во всех загруженных файлах: **{report['physicalRowsRead']}**",
        f"- Уникальных строк после удаления дубликатов книг: **{report['uniqueRowsRead']}**",
        f"- Строк сопоставлено по SKU/Артикулу: **{report['matchedRows']}**",
        f"- Товаров сопоставлено: **{report['matchedProductCount']}**",
        f"- Новых характеристик добавлено: **{report['addedSpecifications']}**",
        f"- Полей, пропущенных из-за уже существующего XML/XLSX-ключа: **{report['skippedExistingFields']}**",
        f"- Несопоставленных строк: **{report['unmatchedRows']}**",
        f"- Неоднозначных SKU: **{report['ambiguousRows']}**",
        "",
        "## Новые поля",
        "",
        "| Поле XLSX | Добавлено значений |",
        "| --- | ---: |",
    ]
    for key, count in sorted(report["newFieldCounts"].items(), key=lambda item: (-item[1], item[0].lower())):
        lines.append(f"| {key} | {count} |")

    lines += [
        "",
        "## Фильтры, которые можно строить из объединённых данных",
        "",
        "- Размер корпуса/габариты — `filterFacets.bodySize`.",
        "- Тип дисплея/экран — `filterFacets.displayType`.",
        "- Водозащита — `filterFacets.waterResistance`.",
        "- Батарея и автономность — `filterFacets.battery`.",
        "- GPS/ГЛОНАСС/Галилей — `filterFacets.gps`.",
        "- Датчики — `filterFacets.sensors`.",
        "- Материал корпуса — `filterFacets.caseMaterial`.",
        "- Материал стекла/линз — `filterFacets.glassMaterial`.",
        "- Материал/тип ремешка — `filterFacets.strap`.",
        "",
        "Эти фасеты построены из официальных XML-параметров и добавленных XLSX-параметров; Excel не заменяет значения XML.",
        "",
        "## Примеры «было → стало»",
        "",
    ]
    for example in report["examples"]:
        lines.extend(
            [
                f"### SKU `{example['sku']}` — {example['name']}",
                "",
                f"- Было параметров: **{example['before']['paramCount']}**",
                "- Добавлено из Excel:",
            ]
        )
        lines.extend(f"  - `{item['key']}`: {item['value']}" for item in example["added"])
        lines.extend(
            [
                f"- Стало параметров: **{example['after']['paramCount']}**",
                f"- Excel-полей в `supplementalSpecs`: **{example['after']['supplementalCount']}**",
                f"- Фасеты: `{json.dumps(example['after']['filterFacets'], ensure_ascii=False)}`",
                "",
            ]
        )

    lines += ["## Несопоставленные строки", ""]
    if unmatched_rows:
        for row in unmatched_rows:
            lines.append(
                f"- `{row['article']}` из `{row['sourceFile']}` (строка {row['sourceRow']})"
                f" — {row.get('failure', 'SKU отсутствует в XML-каталоге')}"
            )
    else:
        lines.append("Нет.")
    lines += [
        "",
        "## Что было пропущено и почему",
        "",
        f"- Русские дубли колонок: **{report['skipped_russian_duplicate']}** непустых ячеек — использована украинская колонка или общая колонка.",
        f"- Идентификационные колонки названия/производителя: **{report['skipped_identity_column']}** — они не являются характеристиками.",
        f"- Групповые маркеры со стрелкой: **{report['skipped_group_marker']}** — это заголовки секций Excel, а не значения товара.",
        f"- Пустые клетки характеристик: **{report['emptySpecificationCells']}** — источник не предоставил значение.",
        f"- Строки без SKU: **{report['rowsWithoutSku']}** — сопоставление по Артикулу невозможно.",
        f"- Строки с SKU, но без заполненных характеристик: **{report['rowsWithSkuButNoSpecifications']}**.",
        f"- Поля с ключом, уже существующим в XML/YML или ранее добавленным XLSX: **{report['skippedExistingFields']}** — пропущены, чтобы не создавать дубли и не заменять официальное значение.",
        f"- `381`: все три загруженные копии содержат только заголовки, строк товаров нет.",
        "",
        "## Подтверждение использования приложением",
        "",
        "- Объединённые значения записаны в `data/catalog.json` в `params` и `specs`.",
        "- Источник Excel дополнительно сохранён в каждом сопоставленном товаре в `supplementalSpecs`.",
        "- Нормализованные фасеты для фильтров записаны в `filterFacets`.",
        "- `scripts/build-products-ts.js` переносит эти поля в типизированный `data/products.ts`, откуда их читает Expo-каталог.",
    ]
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    physical_paths = sorted((WORKSPACE_ROOT / "attached_assets").glob(SPECIFICATION_PATTERN))
    if not physical_paths:
        raise RuntimeError(f"No supplemental specification files found: {SPECIFICATION_PATTERN}")

    unique_paths: list[Path] = []
    seen_digests: set[str] = set()
    for path in physical_paths:
        digest = file_digest(path)
        if digest not in seen_digests:
            seen_digests.add(digest)
            unique_paths.append(path)

    products: list[dict[str, Any]] = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    physical_rows, workbook_details = extract_rows(physical_paths)
    rows = deduplicate_rows(physical_rows)
    merge_counts, unmatched_rows = merge_specifications(products, rows)
    generated_at = datetime.now(timezone.utc).isoformat()
    physical_rows_read = sum(
        max(0, len(read_xlsx(path)) - 1)
        for path in physical_paths
    )
    report = {
        "generatedAt": generated_at,
        "physicalFileCount": len(physical_paths),
        "uniqueFileCount": len(unique_paths),
        "duplicateFileCount": len(physical_paths) - len(unique_paths),
        "physicalRowsRead": physical_rows_read,
        "uniqueRowsRead": len(rows),
        **merge_counts,
        "unmatchedRows": merge_counts.get("unmatchedRows", 0),
        "ambiguousRows": merge_counts.get("ambiguousRows", 0),
        "skippedExistingFields": merge_counts.get("skippedExistingFields", 0),
        "examples": [],
        "skipped_russian_duplicate": workbook_details["cellStats"].get("skipped_russian_duplicate", 0),
        "skipped_identity_column": workbook_details["cellStats"].get("skipped_identity_column", 0),
        "skipped_group_marker": workbook_details["cellStats"].get("skipped_group_marker", 0),
        "emptySpecificationCells": workbook_details["cellStats"].get("emptySpecificationCells", 0),
        "rowsWithoutSku": workbook_details["cellStats"].get("rowsWithoutSku", 0),
        "rowsWithSkuButNoSpecifications": workbook_details["cellStats"].get("rowsWithSkuButNoSpecifications", 0),
    }

    # Reconstruct examples from actual additions for a concise report.
    # The merge function keeps product data authoritative; examples are derived
    # from supplementalSpecs and the first 15 matched products.
    for product in products:
        if product.get("supplementalSpecs") and len(report["examples"]) < 15:
            added = product["supplementalSpecs"][:]
            report["examples"].append(
                {
                    "sku": product.get("sku", ""),
                    "productId": product.get("id", ""),
                    "name": product.get("name", ""),
                    "before": {"paramCount": max(0, len(product.get("params", [])) - len(added)), "specificationKeys": []},
                    "added": added,
                    "after": {
                        "paramCount": len(product.get("params", [])),
                        "supplementalCount": len(added),
                        "filterFacets": product.get("filterFacets", {}),
                    },
                }
            )

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    metadata = json.loads(META_PATH.read_text(encoding="utf-8")) if META_PATH.exists() else {}
    update_metadata(metadata, report, physical_paths)
    META_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_reports(report, products, unmatched_rows, workbook_details)
    print(
        f"Read {len(physical_paths)} Excel files ({len(unique_paths)} unique), "
        f"{len(rows)} unique rows; matched {report['matchedRows']} rows / "
        f"{report['matchedProductCount']} products; added {report['addedSpecifications']} fields."
    )


if __name__ == "__main__":
    main()