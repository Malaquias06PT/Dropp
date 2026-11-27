// Cloudflare Worker (free plan): receives Stripe "checkout.session.completed" webhooks
// and creates the matching order at CJ Dropshipping, so you don't have to copy addresses by hand.
//
// The CJ order is created but NOT paid (payType 3): you review and pay it in the CJ dashboard.
// Secrets (Cloudflare dashboard or `npx wrangler secret put NAME`): STRIPE_WEBHOOK_SECRET, CJ_API_KEY
// Variables (wrangler.toml): LINK_MAP, CJ_LOGISTIC_NAME, CJ_FROM_COUNTRY, CJ_API_BASE
import { verifyStripeSignature, buildCjOrder } from "./lib.js";

// CJ allows 1 request/second and returns the same token for 24h, so fetching one per order is fine.
async function cjAccessToken(env) {
  const res = await fetch(`${env.CJ_API_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: env.CJ_API_KEY }),
  });
  const json = await res.json();
  if (!json.result || !json.data?.accessToken) throw new Error(`CJ auth failed: ${json.message || res.status}`);
  return json.data.accessToken;
}

async function cjCreateOrder(order, env) {
  const token = await cjAccessToken(env);
  await new Promise((r) => setTimeout(r, 1100)); // respect CJ's 1 call/second limit
  const res = await fetch(`${env.CJ_API_BASE}/shopping/order/createOrderV2`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
    body: JSON.stringify(order),
  });
  const json = await res.json();
  if (!json.result) throw new Error(`CJ createOrder failed: ${json.message || res.status}`);
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
    const session = event.data?.object;
    if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
      return new Response("ignored");
    }
    // Delayed methods (e.g. Multibanco) fire "completed" before the money arrives — wait for async success.
    if (session.payment_status !== "paid") return new Response("awaiting payment");

    try {
      const order = buildCjOrder(session, JSON.parse(env.LINK_MAP || "{}"), {
        logisticName: env.CJ_LOGISTIC_NAME,
        fromCountryCode: env.CJ_FROM_COUNTRY,
      });
      const result = await cjCreateOrder(order, env);
      console.log("CJ order created", order.orderNumber, result?.orderId);
      return new Response("ok");
    } catch (err) {
      // A non-2xx makes Stripe retry for up to 3 days; the error is visible in Stripe > Webhooks and `wrangler tail`.
      console.error("order-sync failed", session.id, err.message);
      return new Response(err.message, { status: 500 });
    }
  },
};
