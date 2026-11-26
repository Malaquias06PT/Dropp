// Pure helpers for the order-sync worker. Kept free of network calls so they can be unit-tested.

const encoder = new TextEncoder();

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies a Stripe webhook signature (header "Stripe-Signature": "t=...,v1=...").
 * Returns true only if one v1 signature matches and the timestamp is within `toleranceSec`.
 */
export async function verifyStripeSignature(payload, header, secret, { toleranceSec = 300, now = Date.now() } = {}) {
  if (!header || !secret) return false;
  const parts = Object.create(null);
  const signatures = [];
  for (const item of header.split(",")) {
    const [k, v] = item.split("=");
    if (k === "v1") signatures.push(v);
    else parts[k] = v;
  }
  const timestamp = Number(parts.t);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(now / 1000 - timestamp) > toleranceSec) return false;

  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`)));
  return signatures.some((sig) => timingSafeEqual(sig, expected));
}

/**
 * Turns a Stripe Checkout Session (with expanded line_items) into a CJ order request body.
 * `priceMap` maps a Stripe price id to { vid, units } — the CJ variant id and how many
 * physical items one unit of that price represents (e.g. the 2-pack price → units: 2).
 */
export function buildCjOrder(session, priceMap, { logisticName, fromCountryCode = "" } = {}) {
  const shipping = session.collected_information?.shipping_details || session.shipping_details || null;
  const customer = session.customer_details || {};
  const address = shipping?.address || customer.address;
  if (!address) throw new Error("Session has no shipping address. Enable address collection on the Payment Link.");

  const products = [];
  const unknown = [];
  for (const item of session.line_items?.data || []) {
    const priceId = item.price?.id;
    const mapped = priceMap[priceId];
    if (!mapped) { unknown.push(priceId); continue; }
    products.push({ vid: mapped.vid, quantity: item.quantity * (mapped.units || 1) });
  }
  if (unknown.length) throw new Error(`No CJ variant mapped for Stripe price(s): ${unknown.join(", ")}`);
  if (!products.length) throw new Error("Session has no line items.");

  const order = {
    orderNumber: session.id,
    shippingCountryCode: address.country,
    shippingProvince: address.state || address.city || "",
    shippingCity: address.city || "",
    shippingAddress: address.line1 || "",
    shippingAddress2: address.line2 || "",
    shippingZip: address.postal_code || "",
    shippingCustomerName: shipping?.name || customer.name || "",
    shippingPhone: customer.phone || "",
    email: customer.email || "",
    remark: session.client_reference_id ? `site:${session.client_reference_id}` : "",
    logisticName,
    products,
  };
  if (fromCountryCode) order.fromCountryCode = fromCountryCode;
  return order;
}
