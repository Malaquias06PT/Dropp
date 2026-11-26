// Cloudflare Worker (free plan): receives Stripe "checkout.session.completed" webhooks
// and creates the matching order at CJ Dropshipping, so you don't have to copy addresses by hand.
//
// The CJ order is created but NOT paid automatically: you review and pay it in the CJ dashboard.
// Secrets (set with `npx wrangler secret put NAME`): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CJ_API_KEY
// Variables (wrangler.toml): PRICE_MAP, CJ_LOGISTIC_NAME, CJ_FROM_COUNTRY, CJ_API_BASE
import { verifyStripeSignature, buildCjOrder } from "./lib.js";

async function stripeGet(path, env) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${await res.text()}`);
  return res.json();
}

// NOTE: CJ endpoints and field names follow CJ API v2 as known at the time of writing.
// Check them against https://developers.cjdropshipping.com before going live (see docs/SETUP.md).
async function cjAccessToken(env) {
  const res = await fetch(`${env.CJ_API_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: env.CJ_API_KEY }),
  });
  const json = await res.json();
  if (!json.result || !json.data?.accessToken) throw new Error(`CJ auth failed: ${JSON.stringify(json)}`);
  return json.data.accessToken;
}

async function cjCreateOrder(order, env) {
  const token = await cjAccessToken(env);
  const res = await fetch(`${env.CJ_API_BASE}/shopping/order/createOrderV2`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
    body: JSON.stringify(order),
  });
  const json = await res.json();
  if (!json.result) throw new Error(`CJ createOrder failed: ${JSON.stringify(json)}`);
  return json.data;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") return new Response("order-sync ok");
    if (request.method !== "POST" || url.pathname !== "/stripe-webhook") return new Response("Not found", { status: 404 });

    const payload = await request.text();
    const valid = await verifyStripeSignature(payload, request.headers.get("Stripe-Signature"), env.STRIPE_WEBHOOK_SECRET);
    if (!valid) return new Response("Bad signature", { status: 400 });

    const event = JSON.parse(payload);
    if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
      return new Response("ignored");
    }
    // Delayed methods (e.g. Multibanco) fire "completed" before the money arrives — wait for async success.
    if (event.type === "checkout.session.completed" && event.data.object.payment_status !== "paid") {
      return new Response("awaiting payment");
    }

    try {
      const session = await stripeGet(`checkout/sessions/${event.data.object.id}?expand[]=line_items`, env);
      const order = buildCjOrder(session, JSON.parse(env.PRICE_MAP || "{}"), {
        logisticName: env.CJ_LOGISTIC_NAME,
        fromCountryCode: env.CJ_FROM_COUNTRY,
      });
      const result = await cjCreateOrder(order, env);
      console.log("CJ order created", session.id, JSON.stringify(result));
      return new Response("ok");
    } catch (err) {
      // A non-2xx makes Stripe retry for up to 3 days; the error is visible in Stripe > Webhooks and `wrangler tail`.
      console.error("order-sync failed", err.message);
      return new Response(err.message, { status: 500 });
    }
  },
};
