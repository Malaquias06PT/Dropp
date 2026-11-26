(function () {
  "use strict";

  var C = window.STORE_CONFIG;
  var I18N = window.I18N;
  var STORAGE_KEY = "dropp.lang";

  function store(get, value) {
    try {
      if (get) return window.localStorage.getItem(STORAGE_KEY);
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      return null;
    }
    return null;
  }

  function pickLanguage() {
    var fromUrl = new URLSearchParams(window.location.search).get("lang");
    var candidates = [fromUrl, store(true)].concat(
      (navigator.languages || [navigator.language || ""]).map(function (l) {
        return (l || "").slice(0, 2).toLowerCase();
      })
    );
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i] && C.languages.indexOf(candidates[i]) !== -1) return candidates[i];
    }
    return C.defaultLanguage;
  }

  var lang = pickLanguage();

  function money(value) {
    return new Intl.NumberFormat(lang, { style: "currency", currency: C.currency }).format(value);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  var baseVars = {
    brand: C.brand,
    product: C.productName,
    email: C.seller.email,
    days: C.returnDays,
    min: C.shippingDays.min,
    max: C.shippingDays.max,
  };

  function fill(template, vars) {
    var all = Object.assign({}, baseVars, vars || {});
    return template.replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(all, k) ? String(all[k]) : m;
    });
  }

  function t(key, vars) {
    var dict = I18N[lang] || I18N[C.defaultLanguage];
    var value = dict[key] !== undefined ? dict[key] : I18N.en[key];
    return value === undefined ? key : fill(value, vars);
  }

  function addBusinessDays(date, days) {
    var d = new Date(date);
    var added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      var wd = d.getDay();
      if (wd !== 0 && wd !== 6) added++;
    }
    return d;
  }

  function hoodieSvg(color) {
    var sherpa = "#f4ecdf";
    return (
      '<svg viewBox="0 0 400 420" role="img" aria-label="' + escapeHtml(C.productName) + '" class="hoodie-svg">' +
      // body + sleeves
      '<path d="M130 130 Q200 115 270 130 L330 165 Q350 178 355 200 L372 290 Q374 305 358 308 L330 312 Q318 312 316 300 L300 215 L300 395 Q200 410 100 395 L100 215 L84 300 Q82 312 70 312 L42 308 Q26 305 28 290 L45 200 Q50 178 70 165 Z" fill="' + color + '"/>' +
      // sleeve folds
      '<path d="M100 215 L100 300 M300 215 L300 300" stroke="#000" stroke-opacity=".12" stroke-width="3" fill="none"/>' +
      // sherpa cuffs and hem
      '<path d="M34 300 L76 307 M324 307 L366 300" stroke="' + sherpa + '" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M104 392 Q200 406 296 392" stroke="' + sherpa + '" stroke-width="10" fill="none" stroke-linecap="round"/>' +
      // kangaroo pocket
      '<path d="M140 290 L260 290 L272 352 L128 352 Z" fill="#000" fill-opacity=".1"/>' +
      // hood with sherpa lining and depth
      '<path d="M128 150 C118 62 165 28 200 28 C235 28 282 62 272 150 C250 168 150 168 128 150 Z" fill="' + color + '"/>' +
      '<path d="M152 146 C146 84 174 58 200 58 C226 58 254 84 248 146 C230 158 170 158 152 146 Z" fill="' + sherpa + '"/>' +
      '<path d="M166 140 C164 96 182 78 200 78 C218 78 236 96 234 140 C220 148 180 148 166 140 Z" fill="#000" fill-opacity=".14"/>' +
      "</svg>"
    );
  }

  function productVisual(colorId) {
    var color = C.colors.filter(function (c) { return c.id === colorId; })[0] || C.colors[0];
    if (color.image) {
      return '<img src="' + escapeHtml(color.image) + '" alt="' + escapeHtml(C.productName + " – " + t("color_" + color.id)) + '" loading="lazy">';
    }
    return hoodieSvg(color.swatch);
  }

  /* ---------- static text ---------- */
  function applyText() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-brand]").forEach(function (el) { el.textContent = C.brand; });
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    document.querySelectorAll("[data-mail]").forEach(function (el) {
      el.textContent = C.seller.email;
      el.setAttribute("href", "mailto:" + C.seller.email);
    });
    document.querySelectorAll("[data-complaints]").forEach(function (el) {
      el.setAttribute("href", C.seller.complaintsBookUrl);
    });
    var from = document.querySelector("[data-from-price]");
    if (from) from.textContent = t("heroFrom", { price: money(C.offers[0].price) });
  }

  function buildLanguagePicker() {
    var select = document.getElementById("lang");
    if (!select) return;
    select.innerHTML = C.languages.map(function (code) {
      return '<option value="' + code + '"' + (code === lang ? " selected" : "") + ">" + escapeHtml(I18N[code].langName) + "</option>";
    }).join("");
    select.addEventListener("change", function () {
      lang = select.value;
      store(false, lang);
      render();
    });
  }

  /* ---------- buy box ---------- */
  var state = { color: C.colors[0].id, offer: (C.offers.filter(function (o) { return o.featured; })[0] || C.offers[0]).id };

  function checkoutUrl(offer, colorId) {
    var link = offer.stripeLinks && offer.stripeLinks[colorId];
    if (!link) return "";
    var url = new URL(link);
    // Shows up on the payment in Stripe, so you always know exactly what to order from the supplier.
    url.searchParams.set("client_reference_id", offer.id + "-" + colorId);
    if (lang) url.searchParams.set("locale", lang);
    return url.toString();
  }

  function renderBuyBox() {
    var box = document.getElementById("buy-box");
    if (!box) return;
    var single = C.offers.filter(function (o) { return o.quantity === 1; })[0];

    var colorsHtml = C.colors.map(function (c) {
      return (
        '<label class="swatch">' +
        '<input type="radio" name="color" value="' + c.id + '"' + (c.id === state.color ? " checked" : "") + ">" +
        '<span class="swatch-dot" style="background:' + c.swatch + '"></span>' +
        '<span class="swatch-name">' + escapeHtml(t("color_" + c.id)) + "</span></label>"
      );
    }).join("");

    var offersHtml = C.offers.map(function (o) {
      var save = single ? single.price * o.quantity - o.price : 0;
      var note = o.featured && save > 0 ? '<span class="offer-note">' + escapeHtml(t("offerDuoNote", { save: money(save) })) + "</span>" : "";
      var each = o.quantity > 1 ? '<span class="offer-each">' + escapeHtml(t("offerEach", { price: money(o.price / o.quantity) })) + "</span>" : "";
      return (
        '<label class="offer' + (o.featured ? " offer-featured" : "") + '">' +
        '<input type="radio" name="offer" value="' + o.id + '"' + (o.id === state.offer ? " checked" : "") + ">" +
        '<span class="offer-main"><span class="offer-title">' + escapeHtml(t("offer_" + o.id)) + "</span>" + note + "</span>" +
        '<span class="offer-price"><strong>' + money(o.price) + "</strong>" + each + "</span></label>"
      );
    }).join("");

    var offer = C.offers.filter(function (o) { return o.id === state.offer; })[0];
    var url = checkoutUrl(offer, state.color);
    var now = new Date();
    var fmt = new Intl.DateTimeFormat(lang, { day: "numeric", month: "long" });
    var delivery = t("buyDelivery", {
      from: fmt.format(addBusinessDays(now, C.shippingDays.min)),
      to: fmt.format(addBusinessDays(now, C.shippingDays.max)),
    });

    var cta = url
      ? '<a class="btn btn-primary btn-block" href="' + escapeHtml(url) + '" data-goatcounter-click="checkout-' + offer.id + "-" + state.color + '">' + escapeHtml(t("buyCta")) + " · " + money(offer.price) + "</a>"
      : '<button class="btn btn-primary btn-block" type="button" disabled>' + escapeHtml(t("buyUnavailable")) + "</button>";

    box.innerHTML =
      '<div class="buy-visual" style="--swatch:' + (C.colors.filter(function (c) { return c.id === state.color; })[0].swatch) + '">' + productVisual(state.color) + "</div>" +
      '<div class="buy-form">' +
      "<h2>" + escapeHtml(t("buyTitle")) + "</h2>" +
      '<fieldset><legend>' + escapeHtml(t("colorLabel")) + ": <strong>" + escapeHtml(t("color_" + state.color)) + "</strong></legend>" +
      '<div class="swatches">' + colorsHtml + "</div></fieldset>" +
      '<fieldset><legend>' + escapeHtml(t("offerLabel")) + '</legend><div class="offers">' + offersHtml + "</div></fieldset>" +
      cta +
      '<p class="buy-meta">🚚 ' + escapeHtml(delivery) + "</p>" +
      '<p class="buy-meta">🔒 ' + escapeHtml(t("buyPayments")) + "</p>" +
      "</div>";

    box.querySelectorAll('input[name="color"]').forEach(function (input) {
      input.addEventListener("change", function () { state.color = input.value; renderBuyBox(); renderHeroVisual(); });
    });
    box.querySelectorAll('input[name="offer"]').forEach(function (input) {
      input.addEventListener("change", function () { state.offer = input.value; renderBuyBox(); });
    });
  }

  function renderHeroVisual() {
    var hero = document.getElementById("hero-visual");
    if (hero) hero.innerHTML = productVisual(state.color);
  }

  /* ---------- legal pages ---------- */
  function renderLegal() {
    var el = document.getElementById("legal");
    if (!el) return;
    var page = el.getAttribute("data-page");
    var hasLang = window.LEGAL[lang] && window.LEGAL[lang][page];
    var doc = hasLang ? window.LEGAL[lang][page] : window.LEGAL.en[page];
    var vars = {
      legalName: escapeHtml(C.seller.legalName),
      taxId: escapeHtml(C.seller.taxId),
      address: escapeHtml(C.seller.address),
      email: escapeHtml(C.seller.email),
      complaints: escapeHtml(C.seller.complaintsBookUrl),
      brand: escapeHtml(C.brand),
    };
    document.title = doc.title + " · " + C.brand;
    el.innerHTML =
      (hasLang ? "" : '<p class="note">' + escapeHtml(t("legalFallback")) + "</p>") +
      "<h1>" + escapeHtml(doc.title) + "</h1>" + fill(doc.body, vars);
  }

  /* ---------- JSON-LD for search engines ---------- */
  function renderStructuredData() {
    if (!document.getElementById("buy-box")) return;
    var data = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: C.productName,
      brand: { "@type": "Brand", name: C.brand },
      description: t("heroText"),
      offers: C.offers.map(function (o) {
        return {
          "@type": "Offer",
          price: o.price.toFixed(2),
          priceCurrency: C.currency,
          availability: "https://schema.org/InStock",
          url: C.siteUrl + "#buy",
        };
      }),
    };
    var s = document.getElementById("ld-product") || document.createElement("script");
    s.type = "application/ld+json";
    s.id = "ld-product";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  /* ---------- free analytics (GoatCounter, no cookies) ---------- */
  function loadAnalytics() {
    if (!C.goatcounterCode) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://" + C.goatcounterCode + ".goatcounter.com/count");
    document.body.appendChild(s);
  }

  function render() {
    applyText();
    renderHeroVisual();
    renderBuyBox();
    renderLegal();
    renderStructuredData();
  }

  buildLanguagePicker();
  render();
  loadAnalytics();
})();
