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
  id: "cs_test_123",
  client_reference_id: "duo-grey",
  customer_details: { email: "a@b.pt", phone: "+351912345678", name: "Ana Silva" },
  collected_information: {
    shipping_details: {
      name: "Ana Silva",
      address: { line1: "Rua A 1", line2: "2 Esq", city: "Lisboa", state: "", postal_code: "1000-001", country: "PT" },
    },
  },
  line_items: { data: [{ quantity: 1, price: { id: "price_duo_grey" } }] },
};
const priceMap = { price_duo_grey: { vid: "VID-GREY", units: 2 } };

test("builds a CJ order with address, phone and unit multiplier", () => {
  const order = buildCjOrder(session, priceMap, { logisticName: "CJPacket", fromCountryCode: "DE" });
  assert.deepEqual(order.products, [{ vid: "VID-GREY", quantity: 2 }]);
  assert.equal(order.orderNumber, "cs_test_123");
  assert.equal(order.shippingCountryCode, "PT");
  assert.equal(order.shippingProvince, "Lisboa");
  assert.equal(order.shippingZip, "1000-001");
  assert.equal(order.shippingPhone, "+351912345678");
  assert.equal(order.remark, "site:duo-grey");
  assert.equal(order.fromCountryCode, "DE");
});

test("falls back to legacy shipping_details field", () => {
  const legacy = { ...session, collected_information: undefined, shipping_details: session.collected_information.shipping_details };
  assert.equal(buildCjOrder(legacy, priceMap, {}).shippingCity, "Lisboa");
});

test("fails loudly on unmapped prices or missing address", () => {
  assert.throws(() => buildCjOrder(session, {}, {}), /No CJ variant mapped/);
  assert.throws(() => buildCjOrder({ ...session, collected_information: undefined, customer_details: {} }, priceMap, {}), /no shipping address/);
});
