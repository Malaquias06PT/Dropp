#!/usr/bin/env python3
"""Create (or reuse) the Stripe products, prices and Payment Links for the shop,
then write the links into site/config.js and the price ids into worker/wrangler.toml.

Safe to run more than once: existing objects are found by metadata and reused.
Needs network access to api.stripe.com with an API key. The key is sent either from
STRIPE_API_KEY or, in a managed environment, injected by the network proxy.

Usage: python3 scripts/stripe-setup.py
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "site" / "config.js"
WRANGLER = ROOT / "worker" / "wrangler.toml"

COLORS = {  # id -> product name suffix
    "grey": "Stone grey",
    "cream": "Oat cream",
    "navy": "Midnight navy",
}


def read_config():
    text = CONFIG.read_text(encoding="utf-8")
    site_url = re.search(r'siteUrl:\s*"([^"]+)"', text).group(1)
    countries = re.findall(r'"([A-Z]{2})"', re.search(r"shipsTo:\s*\[([^\]]*)\]", text).group(1))
    offers = []
    for oid, qty, price in re.findall(r'id:\s*"(\w+)",\s*quantity:\s*(\d+),\s*price:\s*([\d.]+)', text):
        offers.append({"id": oid, "quantity": int(qty), "cents": round(float(price) * 100)})
    return text, site_url, countries, offers


def stripe(method, path, params=None, idem=None):
    cmd = ["curl", "-sS", "-m", "30", f"https://api.stripe.com/v1/{path}"]
    cmd += ["-G"] if method == "GET" else ["-X", method]
    key = os.environ.get("STRIPE_API_KEY")
    if key:
        cmd += ["-u", f"{key}:"]
    if idem:
        cmd += ["-H", f"Idempotency-Key: {idem}"]
    for k, v in (params or []):
        cmd += ["--data-urlencode", f"{k}={v}"]
    out = json.loads(subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    if "error" in out:
        sys.exit(f"Stripe error on {method} {path}: {out['error'].get('message')}")
    return out


def find(path, query):
    res = stripe("GET", f"{path}/search", [("query", query)])
    return res["data"][0] if res["data"] else None


def main():
    text, site_url, countries, offers = read_config()
    account = stripe("GET", "account")
    mode = "live" if stripe("GET", "balance").get("livemode") else "test"
    print(f"Stripe account {account['id']} ({account.get('country')}), {mode} mode")

    links = {o["id"]: {} for o in offers}
    price_map = {}
    for color, label in COLORS.items():
        product = find("products", f"metadata['dropp_color']:'{color}' AND active:'true'")
        if not product:
            product = stripe("POST", "products", [
                ("name", f"CloudHood – {label}"),
                ("description", "Wearable sherpa blanket hoodie. One size."),
                ("metadata[dropp_color]", color),
            ], idem=f"dropp-product-{color}-{mode}")
        print(f"  product {product['id']}  {product['name']}")

        for offer in offers:
            price = find("prices", f"metadata['dropp_key']:'{offer['id']}-{color}' AND active:'true'")
            if not price or price["unit_amount"] != offer["cents"]:
                price = stripe("POST", "prices", [
                    ("product", product["id"]),
                    ("currency", "eur"),
                    ("unit_amount", str(offer["cents"])),
                    ("nickname", f"{offer['quantity']}x"),
                    ("metadata[dropp_key]", f"{offer['id']}-{color}"),
                ], idem=f"dropp-price-{offer['id']}-{color}-{offer['cents']}-{mode}")
            price_map[price["id"]] = {"vid": "TODO", "units": offer["quantity"], "key": f"{offer['id']}-{color}"}

            existing = stripe("GET", "payment_links", [("active", "true"), ("limit", "100")])["data"]
            link = next((l for l in existing if l.get("metadata", {}).get("dropp_price") == price["id"]), None)
            if not link:
                params = [
                    ("line_items[0][price]", price["id"]),
                    ("line_items[0][quantity]", "1"),
                    ("phone_number_collection[enabled]", "true"),
                    ("after_completion[type]", "redirect"),
                    ("after_completion[redirect][url]", site_url.rstrip("/") + "/thanks.html"),
                    ("metadata[dropp_price]", price["id"]),
                    ("metadata[dropp_key]", f"{offer['id']}-{color}"),
                ]
                params += [(f"shipping_address_collection[allowed_countries][{i}]", c) for i, c in enumerate(countries)]
                link = stripe("POST", "payment_links", params, idem=f"dropp-link-{price['id']}")
            links[offer["id"]][color] = link["url"]
            print(f"    {offer['id']:6} {offer['cents']/100:.2f} EUR  {price['id']}  {link['url']}")

    # write links into config.js
    for offer in offers:
        block = ", ".join(f'{c}: "{links[offer["id"]][c]}"' for c in COLORS)
        pattern = re.compile(r'(id:\s*"' + offer["id"] + r'",[\s\S]*?stripeLinks:\s*)\{[^}]*\}')
        text = pattern.sub(lambda m: m.group(1) + "{ " + block + " }", text, count=1)
    CONFIG.write_text(text, encoding="utf-8")

    # write price ids into wrangler.toml, keeping any CJ vids already filled in
    wr = WRANGLER.read_text(encoding="utf-8")
    old = json.loads(re.search(r"PRICE_MAP = '''([\s\S]*?)'''", wr).group(1))
    old_by_key = {v.get("key"): v for v in old.values() if isinstance(v, dict)}
    for pid, entry in price_map.items():
        prev = old.get(pid) or old_by_key.get(entry["key"])
        if prev and prev.get("vid") not in (None, "TODO"):
            entry["vid"] = prev["vid"]
    body = json.dumps(price_map, indent=2)
    wr = re.sub(r"PRICE_MAP = '''[\s\S]*?'''", "PRICE_MAP = '''\n" + body + "\n'''", wr)
    WRANGLER.write_text(wr, encoding="utf-8")
    print("Updated site/config.js and worker/wrangler.toml")


if __name__ == "__main__":
    main()
