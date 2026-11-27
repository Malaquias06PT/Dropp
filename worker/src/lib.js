// Pure helpers for the order-sync worker. Kept free of network calls so they can be unit-tested.
// CJ field names and limits follow https://developers.cjdropshipping.com/en/api/api2/api/shopping.html
// (createOrderV2), checked on 2026-11-27.

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

const cut = (value, max) => String(value || "").slice(0, max);

function countryName(code) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

/**
 * Turns a Stripe Checkout Session (from the webhook event, no extra API call needed) into a CJ
 * createOrderV2 request body.
 * `linkMap` maps a Stripe Payment Link id (plink_...) to { vid, units }: the CJ variant id and how
 * many items that link sells (2 for the 2-pack). Each Payment Link sells exactly one line at quantity 1.
 */
export function buildCjOrder(session, linkMap, { logisticName, fromCountryCode }) {
  const shipping = session.collected_information?.shipping_details || session.shipping_details || null;
  const customer = session.customer_details || {};
  const address = shipping?.address;
  if (!address?.country) throw new Error("Session has no shipping address. Enable shipping address collection on the Payment Link.");

  const mapped = linkMap[session.payment_link];
  if (!mapped?.vid || mapped.vid === "TODO") {
    throw new Error(`No CJ variant mapped for Payment Link ${session.payment_link || "(none)"}`);
  }
  if (!logisticName || logisticName === "TODO") throw new Error("CJ_LOGISTIC_NAME is not configured.");
  if (!fromCountryCode) throw new Error("CJ_FROM_COUNTRY is not configured.");

  return {
    // CJ allows max 50 chars; the PaymentIntent id (pi_...) is short, unique and searchable in Stripe.
    orderNumber: cut(session.payment_intent || session.id, 50),
    shippingCountryCode: address.country,
    shippingCountry: cut(countryName(address.country), 50),
    shippingProvince: cut(address.state || address.city, 50),
    shippingCity: cut(address.city, 50),
    shippingAddress: cut(address.line1, 500),
    shippingAddress2: cut(address.line2, 500),
    shippingZip: cut(address.postal_code, 20),
    shippingCustomerName: cut(shipping.name || customer.name, 50),
    shippingPhone: cut(customer.phone, 20),
    email: cut(customer.email, 50),
    remark: cut(`stripe:${session.id}${session.client_reference_id ? " site:" + session.client_reference_id : ""}`, 500),
    logisticName,
    fromCountryCode,
    payType: 3, // 3 = create order only; you review and pay it in the CJ dashboard
    products: [{ vid: mapped.vid, quantity: mapped.units || 1 }],
  };
}
