import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyStripeSignature, buildCjOrder } from "../src/lib.js";

const secret = "whsec_test";
const payload = JSON.stringify({ id: "evt_1" });
const sign = (t, body = payload, s = secret) => createHmac("sha256", s).update(`${t}.${body}`).digest("hex");

test("accepts a valid Stripe signature", async () => {
  const t = 1_700_000_000;
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sign(t)}`, secret, { now: t * 1000 }), true);
});

test("rejects a tampered body, wrong secret and old timestamp", async () => {
  const t = 1_700_000_000;
  assert.equal(await verifyStripeSignature(payload + " ", `t=${t},v1=${sign(t)}`, secret, { now: t * 1000 }), false);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sign(t, payload, "other")}`, secret, { now: t * 1000 }), false);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sign(t)}`, secret, { now: (t + 1000) * 1000 }), false);
  assert.equal(await verifyStripeSignature(payload, undefined, secret), false);
});

const session = {
  id: "cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3X4y5Z6a7B8c9D0",
  payment_intent: "pi_3QxYzAbCdEfGhIjK0123abcd",
  payment_link: "plink_duo_grey",
  payment_status: "paid",
  client_reference_id: "duo-grey",
  customer_details: { email: "a@b.pt", phone: "+351912345678", name: "Ana Silva" },
  collected_information: {
    shipping_details: {
      name: "Ana Silva",
      address: { line1: "Rua A 1", line2: "2 Esq", city: "Lisboa", state: "", postal_code: "1000-001", country: "PT" },
    },
  },
};
const linkMap = { plink_duo_grey: { vid: "VID-GREY", units: 2 } };
const opts = { logisticName: "CJPacket", fromCountryCode: "DE" };

test("builds a CJ createOrderV2 body that respects the documented fields and limits", () => {
  const order = buildCjOrder(session, linkMap, opts);
  assert.deepEqual(order.products, [{ vid: "VID-GREY", quantity: 2 }]);
  assert.equal(order.orderNumber, "pi_3QxYzAbCdEfGhIjK0123abcd");
  assert.ok(order.orderNumber.length <= 50);
  assert.equal(order.shippingCountryCode, "PT");
  assert.equal(order.shippingCountry, "Portugal");
  assert.equal(order.shippingProvince, "Lisboa");
  assert.equal(order.shippingZip, "1000-001");
  assert.equal(order.shippingPhone, "+351912345678");
  assert.equal(order.fromCountryCode, "DE");
  assert.equal(order.payType, 3);
  assert.match(order.remark, /site:duo-grey/);
});

test("falls back to the legacy shipping_details field", () => {
  const legacy = { ...session, collected_information: undefined, shipping_details: session.collected_information.shipping_details };
  assert.equal(buildCjOrder(legacy, linkMap, opts).shippingCity, "Lisboa");
});

test("truncates long values to CJ limits", () => {
  const long = structuredClone(session);
  long.collected_information.shipping_details.name = "x".repeat(80);
  long.customer_details.phone = "+".padEnd(30, "1");
  delete long.payment_intent;
  const order = buildCjOrder(long, linkMap, opts);
  assert.equal(order.shippingCustomerName.length, 50);
  assert.equal(order.shippingPhone.length, 20);
  assert.equal(order.orderNumber.length, 50);
});

test("fails loudly on unmapped links, missing address or missing config", () => {
  assert.throws(() => buildCjOrder(session, {}, opts), /No CJ variant mapped/);
  assert.throws(() => buildCjOrder(session, { plink_duo_grey: { vid: "TODO" } }, opts), /No CJ variant mapped/);
  assert.throws(() => buildCjOrder({ ...session, collected_information: undefined }, linkMap, opts), /no shipping address/);
  assert.throws(() => buildCjOrder(session, linkMap, { ...opts, logisticName: "TODO" }), /CJ_LOGISTIC_NAME/);
});
