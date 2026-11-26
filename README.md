# Dropp — CloudHood

Free-to-run, single-product dropshipping shop for the European market.
The product is **CloudHood**, a wearable blanket hoodie, shipped from an EU warehouse.

| Part | Tool | Cost |
| --- | --- | --- |
| Website (static, 5 languages) | `site/` on GitHub Pages | €0 |
| Payments | Stripe Payment Links | €0/month, fee per sale only |
| Supplier / fulfilment | CJ Dropshipping (EU warehouse) | €0 account, you pay per order |
| Order automation | `worker/` on Cloudflare Workers | €0 (free plan) |
| Analytics | GoatCounter (no cookies) | €0 |

**Start here → [docs/SETUP.md](docs/SETUP.md)** (step-by-step guide, in Portuguese).

## Project layout

```
site/            the website (no build step — plain HTML/CSS/JS)
  config.js      ← the only file you edit: seller data, prices, Stripe links
  assets/        styles, app logic, translations, legal texts
worker/          Stripe → CJ order sync (Cloudflare Worker) + tests
scripts/check.mjs  checks translations, links and config
```

## Commands

```bash
node scripts/check.mjs                         # validate the site
python3 -m http.server 8000 --directory site   # preview at http://localhost:8000
cd worker && npm test                          # worker unit tests
```
