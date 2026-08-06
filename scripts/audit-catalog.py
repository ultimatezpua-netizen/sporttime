#!/usr/bin/env python3
"""Audit imported SPORTTIME catalog records and every product image URL."""

from __future__ import annotations

import concurrent.futures
import json
import re
import sys
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
REPORT_DIR = ROOT / "reports"
CATALOG_PATH = DATA_DIR / "catalog.json"
REPORT_PATH = REPORT_DIR / "catalog-audit.md"
JSON_REPORT_PATH = REPORT_DIR / "catalog-audit.json"
MAX_WORKERS = 24
READ_BYTES = 1024

IMAGE_SIGNATURES = (
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"\xff\xd8\xff", "jpeg"),
    (b"GIF87a", "gif"),
    (b"GIF89a", "gif"),
    (b"RIFF", "riff"),
    (b"BM", "bmp"),
    (b"II*\x00", "tiff"),
    (b"MM\x00*", "tiff"),
)
REDIRECT_STATUSES = {301, 302, 303, 307, 308}
VARIANT_TERMS = (
    "40 mm", "41 mm", "42 mm", "43 mm", "44 mm", "45 mm", "46 mm",
    "47 mm", "49 mm", "51 mm", "solar", "sapphire", "amoled", "mip",
    "music", "standard", "titanium", "верс", "варіант", "розмір",
    "размер", "version", "size",
)


class TrackingRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, new_url):
        redirects = int(req.headers.get("X-Audit-Redirects", "0")) + 1
        request = super().redirect_request(req, fp, code, msg, headers, new_url)
        if request is not None:
            request.add_header("X-Audit-Redirects", str(redirects))
        return request


OPENER = urllib.request.build_opener(TrackingRedirectHandler())


def clean(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def image_signature(body: bytes) -> str | None:
    for signature, name in IMAGE_SIGNATURES:
        if body.startswith(signature):
            if name == "riff" and body[8:12] == b"WEBP":
                return "webp"
            return name
    if body.lstrip().startswith(b"<svg") or b"<svg" in body[:512].lower():
        return "svg"
    return None


def is_html(body: bytes, content_type: str) -> bool:
    lowered_type = content_type.lower()
    lowered_body = body.lstrip().lower()
    return (
        "text/html" in lowered_type
        or lowered_body.startswith(b"<!doctype html")
        or lowered_body.startswith(b"<html")
        or b"<html" in lowered_body[:512]
    )


def check_url(url: str) -> dict[str, Any]:
    result: dict[str, Any] = {
        "url": url,
        "status": None,
        "finalUrl": None,
        "redirected": False,
        "contentType": "",
        "contentLength": None,
        "signature": None,
        "ok": False,
        "reason": "",
    }
    if not url:
        result["reason"] = "empty_url"
        return result

    request = urllib.request.Request(
        url,
        headers={
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Range": f"bytes=0-{READ_BYTES - 1}",
            "User-Agent": "SPORTTIME-UA catalog image audit",
        },
    )
    try:
        with OPENER.open(request, timeout=30) as response:
            body = response.read(READ_BYTES)
            content_type = response.headers.get("Content-Type", "")
            final_url = response.geturl()
            result.update(
                {
                    "status": response.status,
                    "finalUrl": final_url,
                    "redirected": final_url != url,
                    "contentType": content_type,
                    "contentLength": response.headers.get("Content-Length"),
                    "signature": image_signature(body),
                }
            )
            if response.status < 200 or response.status >= 300:
                result["reason"] = f"http_{response.status}"
            elif is_html(body, content_type):
                result["reason"] = "html_response"
            elif not content_type.lower().startswith("image/"):
                result["reason"] = "non_image_content_type"
            elif not result["signature"]:
                result["reason"] = "unknown_image_signature"
            else:
                result["ok"] = True
                result["reason"] = "ok"
    except urllib.error.HTTPError as error:
        result.update({"status": error.code, "reason": f"http_{error.code}"})
        try:
            error.close()
        except Exception:
            pass
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        result["reason"] = f"network_error:{type(error).__name__}"
        result["error"] = str(error)[:240]
    except Exception as error:  # noqa: BLE001
        result["reason"] = f"unexpected_error:{type(error).__name__}"
        result["error"] = str(error)[:240]
    return result


def has_variant_data(product: dict[str, Any]) -> bool:
    if product.get("sizes"):
        return True
    fields = " ".join(
        [
            clean(product.get("name")),
            clean(product.get("description")),
            " ".join(clean(item.get("value")) for item in product.get("params", [])),
        ]
    ).lower()
    return any(term in fields for term in VARIANT_TERMS)


def describe_product(product: dict[str, Any]) -> str:
    return f"{product.get('id', '')} — {product.get('name', '').strip()}"


def main() -> int:
    products: list[dict[str, Any]] = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    image_jobs: list[tuple[str, str, int, str]] = []
    for product in products:
        images = product.get("images") if isinstance(product.get("images"), list) else []
        for index, url in enumerate(images):
            if isinstance(url, str):
                image_jobs.append((str(product.get("id", "")), str(product.get("sku", "")), index, url))

    image_results: dict[tuple[str, int], dict[str, Any]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(check_url, url): (product_id, sku, index, url)
            for product_id, sku, index, url in image_jobs
        }
        for future in concurrent.futures.as_completed(futures):
            product_id, sku, index, url = futures[future]
            result = future.result()
            result.update({"productId": product_id, "sku": sku, "index": index})
            image_results[(product_id, index)] = result

    product_rows: list[dict[str, Any]] = []
    for product in products:
        images = product.get("images") if isinstance(product.get("images"), list) else []
        image = clean(product.get("image"))
        first_image = clean(images[0]) if images else ""
        checks = [image_results[(str(product.get("id", "")), index)] for index in range(len(images))]
        product_rows.append(
            {
                "id": str(product.get("id", "")),
                "sku": str(product.get("sku", "")),
                "name": str(product.get("name", "")),
                "description": bool(clean(product.get("description"))),
                "specifications": bool(product.get("specs") or product.get("params")),
                "colors": bool(product.get("colors")),
                "variants": has_variant_data(product),
                "image": image,
                "firstImage": first_image,
                "imageMatchesFirst": image == first_image,
                "imageCount": len(images),
                "imageChecks": checks,
            }
        )

    def product_list(predicate):
        return [row for row in product_rows if predicate(row)]

    image_counts = Counter(row["imageCount"] for row in product_rows)
    url_checks = [check for row in product_rows for check in row["imageChecks"]]
    valid_checks = [check for check in url_checks if check["ok"]]
    failed_checks = [check for check in url_checks if not check["ok"]]
    redirects = [check for check in url_checks if check["redirected"]]
    mismatches = product_list(lambda row: not row["imageMatchesFirst"])

    report: dict[str, Any] = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "catalogSource": "data/catalog.json",
        "productCount": len(products),
        "imageUrlCount": len(url_checks),
        "productsWithPhoto": sum(bool(row["image"]) for row in product_rows),
        "productsWithoutPhoto": sum(not bool(row["image"]) for row in product_rows),
        "galleryDistribution": {str(key): value for key, value in sorted(image_counts.items())},
        "productsWithDescription": sum(row["description"] for row in product_rows),
        "productsWithoutDescription": sum(not row["description"] for row in product_rows),
        "productsWithSpecifications": sum(row["specifications"] for row in product_rows),
        "productsWithoutSpecifications": sum(not row["specifications"] for row in product_rows),
        "productsWithColors": sum(row["colors"] for row in product_rows),
        "productsWithoutColors": sum(not row["colors"] for row in product_rows),
        "productsWithVariants": sum(row["variants"] for row in product_rows),
        "productsWithoutVariants": sum(not row["variants"] for row in product_rows),
        "imageMatchesFirstCount": len(products) - len(mismatches),
        "imageMismatchCount": len(mismatches),
        "imageUrlsOk": len(valid_checks),
        "imageUrlsFailed": len(failed_checks),
        "imageUrlsRedirected": len(redirects),
        "imageUrlStatusCounts": dict(sorted(Counter(str(check["status"]) for check in url_checks).items())),
        "imageContentTypeCounts": dict(sorted(Counter(check["contentType"] for check in url_checks).items())),
        "imageFailures": failed_checks,
        "imageMismatches": mismatches,
        "products": product_rows,
    }

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    JSON_REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Аудит полноты каталога SPORTTIME",
        "",
        f"Дата аудита: `{report['generatedAt']}`",
        "Источник проверки: `data/catalog.json`, импортированный из официального XML/YML.",
        "",
        "## Сводка",
        "",
        f"- Всего товаров: **{report['productCount']}**",
        f"- С главным фото: **{report['productsWithPhoto']}**",
        f"- Без фото: **{report['productsWithoutPhoto']}**",
        f"- URL изображений проверено: **{report['imageUrlCount']}**",
        f"- URL реально отдают изображение: **{report['imageUrlsOk']}**",
        f"- URL с ошибкой: **{report['imageUrlsFailed']}**",
        f"- URL с редиректом: **{report['imageUrlsRedirected']}**",
        "",
        "## Галерея",
        "",
        "| Изображений у товара | Количество товаров |",
        "| ---: | ---: |",
    ]
    exact_gallery_distribution = {
        "1": sum(amount for count, amount in image_counts.items() if count == 1),
        "2": sum(amount for count, amount in image_counts.items() if count == 2),
        "3+": sum(amount for count, amount in image_counts.items() if count >= 3),
    }
    for label in ("1", "2", "3+"):
        lines.append(f"| {label} | {exact_gallery_distribution[label]} |")
    lines += [
        "",
        "## Полнота данных",
        "",
        f"- С описанием: **{report['productsWithDescription']}**",
        f"- Без описания: **{report['productsWithoutDescription']}**",
        f"- С характеристиками: **{report['productsWithSpecifications']}**",
        f"- Без характеристик: **{report['productsWithoutSpecifications']}**",
        f"- С цветами: **{report['productsWithColors']}**",
        f"- Без цветов: **{report['productsWithoutColors']}**",
        f"- С вариантными данными: **{report['productsWithVariants']}**",
        f"- Без вариантных данных: **{report['productsWithoutVariants']}**",
        "",
        "## Согласованность главного изображения",
        "",
        f"- `product.image === product.images[0]`: **{report['imageMatchesFirstCount']}**",
        f"- Несовпадений: **{report['imageMismatchCount']}**",
        "",
        "## HTTP-проверка URL изображений",
        "",
        "Проверялись конечный HTTP-статус, конечный URL после редиректов, Content-Type и сигнатура первых байт ответа.",
        "",
        f"- Статусы: `{report['imageUrlStatusCounts']}`",
        f"- Content-Type: `{report['imageContentTypeCounts']}`",
        "",
    ]

    def append_products(title: str, rows: list[dict[str, Any]], limit: int | None = None):
        lines.extend([f"### {title}", ""])
        selected = rows if limit is None else rows[:limit]
        if not selected:
            lines.append("Нет.")
        else:
            lines.extend(f"- {describe_product(row)}" for row in selected)
            if limit is not None and len(rows) > limit:
                lines.append(f"- … ещё {len(rows) - limit}")
        lines.append("")

    append_products("Товары без фото", product_list(lambda row: not row["image"]))
    append_products("Товары без описания", product_list(lambda row: not row["description"]))
    append_products("Товары без характеристик", product_list(lambda row: not row["specifications"]))
    append_products("Товары без цветов", product_list(lambda row: not row["colors"]))
    append_products("Товары без вариантных данных", product_list(lambda row: not row["variants"]))
    append_products("Товары, где `image != images[0]`", mismatches)
    append_products("Проблемные URL изображений", failed_checks)

    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Audited {len(products)} products and {len(url_checks)} image URLs")
    print(f"Markdown report: {REPORT_PATH}")
    print(f"JSON report: {JSON_REPORT_PATH}")
    print(
        f"Images OK: {len(valid_checks)}; failed: {len(failed_checks)}; "
        f"redirected: {len(redirects)}; mismatches: {len(mismatches)}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, json.JSONDecodeError) as error:
        print(f"Catalog audit failed: {error}", file=sys.stderr)
        raise SystemExit(1)