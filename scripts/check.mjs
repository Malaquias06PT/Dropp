// Sanity checks for the static shop. Run: node scripts/check.mjs
// Exits non-zero if translations are missing, config is malformed, or a page links to a missing file.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const errors = [];
const warnings = [];

function load(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(join(root, file), "utf8"), sandbox, { filename: file });
  return sandbox.window;
}

const { STORE_CONFIG: C } = load("config.js");
const { I18N } = load("assets/i18n.js");
const { LEGAL } = load("assets/legal-content.js");

// 1. every language has the same keys as English
const enKeys = Object.keys(I18N.en).sort();
for (const code of C.languages) {
  if (!I18N[code]) { errors.push(`i18n: language "${code}" listed in config but missing`); continue; }
  const keys = new Set(Object.keys(I18N[code]));
  for (const k of enKeys) if (!keys.has(k)) errors.push(`i18n: "${code}" is missing key "${k}"`);
  for (const k of keys) if (!I18N.en[k]) errors.push(`i18n: "${code}" has extra key "${k}"`);
}

// 2. keys used by config-driven UI exist
for (const c of C.colors) if (!I18N.en["color_" + c.id]) errors.push(`i18n: missing "color_${c.id}"`);
for (const o of C.offers) if (!I18N.en["offer_" + o.id]) errors.push(`i18n: missing "offer_${o.id}"`);

// 3. data-i18n keys used in HTML exist
const pages = readdirSync(root).filter((f) => f.endsWith(".html"));
for (const page of pages) {
  const html = readFileSync(join(root, page), "utf8");
  for (const [, key] of html.matchAll(/data-i18n="([^"]+)"/g)) {
    if (!I18N.en[key]) errors.push(`${page}: unknown i18n key "${key}"`);
  }
  for (const [, page2] of html.matchAll(/data-page="([^"]+)"/g)) {
    if (!LEGAL.en[page2]) errors.push(`${page}: unknown legal page "${page2}"`);
  }
  for (const [, href] of html.matchAll(/(?:href|src)="([^"#:]+?)"/g)) {
    if (href === "./" ) continue;
    if (!existsSync(join(root, href))) errors.push(`${page}: links to missing file "${href}"`);
  }
}

// 4. legal pages: every language has every page that English has
for (const code of Object.keys(LEGAL)) {
  for (const p of Object.keys(LEGAL.en)) if (!LEGAL[code][p]) errors.push(`legal: "${code}" missing page "${p}"`);
}

// 5. config sanity
for (const o of C.offers) {
  if (!(o.price > 0) || !(o.quantity > 0)) errors.push(`config: offer "${o.id}" needs positive price and quantity`);
  for (const c of C.colors) {
    const link = o.stripeLinks?.[c.id];
    if (!link) warnings.push(`config: no Stripe link for offer "${o.id}" colour "${c.id}" (checkout button disabled)`);
    else if (!/^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com)\//.test(link)) errors.push(`config: Stripe link for "${o.id}/${c.id}" does not look like a Stripe Payment Link`);
  }
}
for (const [k, v] of Object.entries(C.seller)) if (String(v).includes("TODO")) warnings.push(`config: seller.${k} still has a TODO`);

for (const w of warnings) console.log("warn  " + w);
for (const e of errors) console.log("ERROR " + e);
console.log(errors.length ? `\n${errors.length} error(s)` : `\nOK — ${pages.length} pages, ${C.languages.length} languages checked (${warnings.length} warning(s))`);
process.exit(errors.length ? 1 : 0);
