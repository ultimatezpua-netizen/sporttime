#!/usr/bin/env python3
"""Refresh SPORTTIME catalog data from the official YML/XML export."""

from __future__ import annotations

import html
import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

SOURCE_URL = (
    "https://sporttimeua.com/content/export/"
    "6d3280744fd6a9807e2a900104aba130.xml"
)
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"


def clean(value: str | None) -> str:
    if not value:
        return ""
    return html.unescape(" ".join(value.replace("\xa0", " ").split()))


def number(value: str | None) -> int:
    try:
        return int(round(float((value or "0").replace(",", "."))))
    except ValueError:
        return 0


def category_name(category_id: str, categories: dict[str, dict]) -> str:
    return categories.get(category_id, {}).get("name", "Garmin")


def category_path(category_id: str, categories: dict[str, dict]) -> list[str]:
    result: list[str] = []
    current = category_id
    seen: set[str] = set()
    while current and current not in seen:
        seen.add(current)
        category = categories.get(current)
        if not category:
            break
        result.append(category["name"])
        current = category.get("parentId", "")
    return list(reversed(result))


def infer_series(name: str, category: str) -> str:
    # Accessories frequently mention a watch model in their name. Only
    # Garmin's product-series categories should be classified as watch series.
    if not category.lower().startswith("garmin "):
        return "Garmin"
    source = f"{name} {category}".lower()
    series = (
        ("Forerunner", "forerunner"),
        ("Instinct", "instinct"),
        ("Fenix", "fenix"),
        ("Epix", "epix"),
        ("Enduro", "enduro"),
        ("Descent", "descent"),
        ("MARQ", "marq"),
        ("Quatix", "quatix"),
        ("Tactix", "tactix"),
        ("Venu", "venu"),
        ("Vivoactive", "vivoactive"),
        ("Vivofit", "vivofit"),
        ("Vivomove", "vivomove"),
        ("Vivosmart", "vivosmart"),
        ("Lily", "lily"),
        ("Bounce", "bounce"),
    )
    for label, needle in series:
        if needle in source:
            return label
    return "Garmin"


def infer_bool(text: str, *needles: str) -> bool:
    lowered = text.lower()
    return any(needle in lowered for needle in needles)


def infer_water_resistance(text: str) -> int:
    match = re.search(r"(\d+)\s*atm", text.lower())
    return int(match.group(1)) if match else 0


def main() -> None:
    print(f"Downloading catalog: {SOURCE_URL}")
    request = urllib.request.Request(
        SOURCE_URL,
        headers={"User-Agent": "SPORTTIME-UA catalog importer"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        xml_data = response.read()

    root = ET.fromstring(xml_data)
    shop = root.find("shop")
    if shop is None:
        raise RuntimeError("The XML feed does not contain a <shop> element")

    raw_categories = shop.findall("./categories/category")
    categories: dict[str, dict] = {}
    for category in raw_categories:
        category_id = category.attrib.get("id", "")
        categories[category_id] = {
            "id": category_id,
            "name": clean(category.text) or "Garmin",
            "parentId": category.attrib.get("parentId"),
        }

    output: list[dict] = []
    for offer in shop.findall("./offers/offer"):
        offer_id = offer.attrib.get("id", "")
        name = clean(offer.findtext("name"))
        description = clean(offer.findtext("description"))
        category_id = clean(offer.findtext("categoryId"))
        category = category_name(category_id, categories)
        params = [
            {
                "key": clean(param.attrib.get("name")),
                "label": clean(param.attrib.get("name")),
                "value": clean(param.text),
            }
            for param in offer.findall("param")
            if clean(param.text)
        ]
        raw_text = " ".join(
            [name, category, description, *(item["value"] for item in params)]
        )
        color_values = [
            item["value"]
            for item in params
            if item["key"].lower() in {"цвет", "колір", "color"}
        ]
        old_price = number(offer.findtext("oldprice"))
        price = number(offer.findtext("price"))
        images = [clean(p.text) for p in offer.findall("picture") if clean(p.text)]
        path = category_path(category_id, categories)
        discount = (
            round((old_price - price) / old_price * 100)
            if old_price > price > 0
            else 0
        )

        output.append(
            {
                "id": offer_id,
                "name": name,
                "series": infer_series(name, category),
                "sku": clean(offer.findtext("vendorCode")),
                "price": price,
                "oldPrice": old_price or None,
                "inStock": offer.attrib.get("available", "").lower() == "true",
                "image": images[0] if images else "",
                "images": images,
                "description": description,
                "url": clean(offer.findtext("url")),
                "categoryId": category_id,
                "category": category,
                "categoryPath": path,
                "vendor": clean(offer.findtext("vendor")),
                "vendorCode": clean(offer.findtext("vendorCode")),
                "params": params,
                "specs": params,
                "rating": 0,
                "reviewCount": 0,
                "colors": color_values,
                "colorHexes": [],
                "sizes": [],
                "display": (
                    "AMOLED"
                    if infer_bool(raw_text, "amoled")
                    else "MIP"
                    if infer_bool(raw_text, "mip")
                    else ""
                ),
                "solar": infer_bool(raw_text, "solar", "сонячн", "солнеч"),
                "material": "",
                "purpose": [],
                "waterResistance": infer_water_resistance(raw_text),
                "batteryLife": next(
                    (
                        item["value"]
                        for item in params
                        if "батар" in item["key"].lower()
                        or "battery" in item["key"].lower()
                    ),
                    "",
                ),
                "gps": infer_bool(raw_text, "gps"),
                "heartRate": infer_bool(raw_text, "пульс", "heart rate"),
                "pulseOx": infer_bool(raw_text, "pulse ox", "киснем"),
                "music": infer_bool(raw_text, "музик", "music"),
                "isNew": False,
                "discount": discount or None,
            }
        )

    if not output:
        raise RuntimeError("The XML feed returned no products")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "catalog.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (DATA_DIR / "categories.json").write_text(
        json.dumps(list(categories.values()), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (DATA_DIR / "catalog-meta.json").write_text(
        json.dumps(
            {
                "source": SOURCE_URL,
                "feedDate": root.attrib.get("date", ""),
                "importedAt": datetime.now(timezone.utc).isoformat(),
                "productCount": len(output),
                "categoryCount": len(categories),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        f"Imported {len(output)} products and {len(categories)} categories "
        f"from {root.attrib.get('date', 'unknown date')}"
    )


if __name__ == "__main__":
    try:
        main()
    except (ET.ParseError, OSError, urllib.error.URLError) as error:
        print(f"Catalog import failed: {error}", file=sys.stderr)
        raise SystemExit(1)