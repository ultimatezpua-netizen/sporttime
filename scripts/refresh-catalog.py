#!/usr/bin/env python3
"""Refresh the catalog and notify opted-in users about real catalog changes."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "catalog.json"
STATE_PATH = ROOT / ".catalog-notification-state.json"


def run_step(*command: str) -> None:
    print(f"\n$ {' '.join(command)}")
    subprocess.run(command, cwd=ROOT, check=True)


def load_products(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, dict):
        raw = [
            {**state, "id": product_id}
            for product_id, state in raw.items()
            if isinstance(state, dict)
        ]
    if not isinstance(raw, list):
        return {}
    return {
        str(product.get("id")): product
        for product in raw
        if isinstance(product, dict) and product.get("id")
    }


def product_state(product: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": str(product.get("name") or "Garmin"),
        "sku": str(product.get("sku") or ""),
        "price": int(product.get("price") or 0),
        "oldPrice": int(product.get("oldPrice") or 0),
        "discount": int(product.get("discount") or 0),
    }


def build_events(previous: dict[str, dict[str, Any]], current: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []

    for product_id, product in current.items():
        current_state = product_state(product)
        previous_state = previous.get(product_id)
        if previous_state is None:
            events.append({"kind": "new", "productId": product_id, **current_state})
            continue

        discount_started_or_changed = (
            current_state["discount"] > 0
            and current_state["discount"] != int(previous_state.get("discount") or 0)
        )
        discounted_price_changed = (
            current_state["discount"] > 0
            and current_state["price"] != int(previous_state.get("price") or 0)
        )
        if discount_started_or_changed or discounted_price_changed:
            events.append({"kind": "discount", "productId": product_id, **current_state})

    return events


def notification_payload(events: list[dict[str, Any]]) -> dict[str, Any]:
    new_count = sum(event["kind"] == "new" for event in events)
    discount_count = sum(event["kind"] == "discount" for event in events)
    names = [event["name"] for event in events[:3]]
    suffix = "" if len(events) <= 3 else f" та ще {len(events) - 3}"

    if new_count and discount_count:
        title = "Новинки та акції SPORTTIME"
    elif new_count:
        title = "Новинки Garmin у SPORTTIME"
    else:
        title = "Нові акції SPORTTIME"

    parts: list[str] = []
    if new_count:
        parts.append(f"нових товарів: {new_count}")
    if discount_count:
        parts.append(f"акцій: {discount_count}")
    body = f"{', '.join(parts)}. " + ", ".join(names) + suffix
    product_id = events[0]["productId"] if len(events) == 1 else None

    return {
        "title": title[:100],
        "body": body[:500],
        **({"productId": product_id} if product_id else {}),
    }


def notification_url() -> str:
    explicit_url = os.environ.get("SPORTTIME_NOTIFICATIONS_URL", "").strip()
    if explicit_url:
        return explicit_url.rstrip("/")

    api_url = (
        os.environ.get("SPORTTIME_API_URL", "").strip()
        or os.environ.get("EXPO_PUBLIC_API_URL", "").strip()
    )
    if api_url:
        return f"{api_url.rstrip('/')}/api/notifications/marketing"

    domain = os.environ.get("REPLIT_DEV_DOMAIN", "").strip()
    if domain:
        return f"https://{domain}/api/notifications/marketing"
    return ""


def send_notification(payload: dict[str, Any]) -> None:
    url = notification_url()
    token = os.environ.get("SPORTTIME_INTERNAL_API_TOKEN", "").strip()
    if not url or not token:
        raise RuntimeError(
            "Automatic push is pending: set SPORTTIME_NOTIFICATIONS_URL (or "
            "SPORTTIME_API_URL) and SPORTTIME_INTERNAL_API_TOKEN."
        )

    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-sporttime-internal-token": token,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(f"notification endpoint returned HTTP {response.status}")
            print(f"Marketing push accepted: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"notification endpoint returned HTTP {error.code}: {detail}") from error


def main() -> None:
    previous = load_products(STATE_PATH)
    run_step("python3", "scripts/import-catalog.py")
    run_step("python3", "scripts/merge-specifications.py")
    run_step("python3", "scripts/merge-product-export.py")
    run_step("node", "scripts/build-products-ts.js")
    run_step("python3", "scripts/audit-catalog.py")

    current_products = load_products(CATALOG_PATH)
    if not previous:
        STATE_PATH.write_text(
            json.dumps(
                {product_id: product_state(product) for product_id, product in current_products.items()},
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        print("Catalog notification baseline initialized; no historical products were notified.")
        return

    events = build_events(previous, current_products)
    if not events:
        STATE_PATH.write_text(
            json.dumps(
                {product_id: product_state(product) for product_id, product in current_products.items()},
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        print("Catalog refreshed with no new products or discount changes.")
        return

    payload = notification_payload(events)
    try:
        send_notification(payload)
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        print(f"Pending catalog notification events: {len(events)}", file=sys.stderr)
        raise SystemExit(2)

    STATE_PATH.write_text(
        json.dumps(
            {product_id: product_state(product) for product_id, product in current_products.items()},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Catalog notification state updated after {len(events)} event(s).")


if __name__ == "__main__":
    main()