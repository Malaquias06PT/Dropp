/*
 * STORE CONFIGURATION — this is the only file you need to edit to run the shop.
 * Everything marked "TODO" must be filled in before you start selling.
 * See docs/SETUP.md (Portuguese, step by step) for where each value comes from.
 */
window.STORE_CONFIG = {
  brand: "Dropp",
  productName: "CloudHood",

  // Public address of the site (used for links and SEO). Change when you add a custom domain.
  siteUrl: "https://malaquias06pt.github.io/Dropp/",

  // Seller identity — required by EU consumer law on the legal notice page. TODO
  seller: {
    legalName: "TODO: Nome completo ou empresa",
    taxId: "TODO: NIF / VAT number",
    address: "TODO: Morada completa, Código Postal, Cidade, Portugal",
    email: "TODO@example.com",
    // Portuguese online complaints book (Livro de Reclamações Eletrónico) — mandatory for PT sellers.
    complaintsBookUrl: "https://www.livroreclamacoes.pt/",
  },

  currency: "EUR",

  // Colours offered. `image` is optional: drop real supplier photos into site/images/ and point to them.
  colors: [
    { id: "grey", swatch: "#9a9590", image: "" },
    { id: "cream", swatch: "#e9dfcf", image: "" },
    { id: "navy", swatch: "#2f3b55", image: "" },
  ],

  // Offers. Prices are what the customer pays, VAT and shipping included.
  // `stripeLinks` maps a colour id to the Stripe Payment Link for that colour + offer. TODO
  offers: [
    {
      id: "single",
      quantity: 1,
      price: 39.9,
      stripeLinks: { grey: "", cream: "", navy: "" },
    },
    {
      id: "duo",
      quantity: 2,
      price: 69.9,
      featured: true,
      stripeLinks: { grey: "", cream: "", navy: "" },
    },
  ],

  // Delivery promise shown on the site (business days, from the EU warehouse).
  shippingDays: { min: 4, max: 8 },
  returnDays: 14, // legal minimum in the EU; you may offer more (e.g. 30).

  // Countries you ship to (must match the list allowed in your Stripe Payment Links).
  shipsTo: ["PT", "ES", "FR", "DE", "IT", "NL", "BE", "AT", "IE", "LU", "FI", "DK", "SE", "PL", "CZ", "SK", "SI", "HR", "GR", "RO", "HU", "BG", "EE", "LV", "LT", "CY", "MT"],

  // Free, cookieless analytics (no cookie banner needed). Create a site at goatcounter.com
  // and put its code here, e.g. "dropp" for https://dropp.goatcounter.com. Leave "" to disable.
  goatcounterCode: "",

  languages: ["en", "pt", "es", "fr", "de"],
  defaultLanguage: "en",
};
