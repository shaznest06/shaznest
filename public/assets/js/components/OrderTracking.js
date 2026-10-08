import { CONFIG } from "../config.js";
import { getOrderTracking } from "../api.js";
import { esc, html } from "../utils.js";

const formatDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

// Renders the response of GET /api/v1/orders/{orderNumber}/tracking
function trackingMarkup(t) {
  const events = Array.isArray(t.events) ? t.events : [];
  return `
    <div class="tracking-result">
      <p class="eyebrow">Order ${esc(t.orderNumber)}</p>
      <p class="tracking-result__status">${esc(t.status)}</p>
      ${t.updatedAt ? `<p class="note">Updated ${esc(formatDate(t.updatedAt))}</p>` : ""}
      ${
        events.length
          ? `<ol class="timeline">${events
              .map(
                (ev) => `<li><strong>${esc(ev.status)}</strong>${ev.description ? `<span>${esc(ev.description)}</span>` : ""}
                  <small>${esc([ev.location, formatDate(ev.timestamp)].filter(Boolean).join(" · "))}</small></li>`
              )
              .join("")}</ol>`
          : ""
      }
    </div>`;
}

/** OrderTracking() → tracking form. Shows no results until the tracking API is live. */
export function OrderTracking() {
  const el = html(`
    <form class="tracking" novalidate>
      <div class="field">
        <label class="field-label" for="order-number">Order number</label>
        <input id="order-number" name="orderNumber" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="order-number-err">
        <p class="field-error" id="order-number-err" aria-live="polite"></p>
      </div>
      <button type="submit" class="btn btn--primary">Track order</button>
      <div class="tracking__output" aria-live="polite"></div>
    </form>`);

  const input = el.elements.orderNumber;
  const output = el.querySelector(".tracking__output");
  const button = el.querySelector("button");

  el.addEventListener("submit", async (e) => {
    e.preventDefault();
    const orderNumber = input.value.trim().toUpperCase();
    const err = el.querySelector(".field-error");
    err.textContent = orderNumber ? "" : "Please enter your order number.";
    input.setAttribute("aria-invalid", String(!orderNumber));
    output.innerHTML = "";
    if (!orderNumber) return input.focus();

    button.disabled = true;
    try {
      const result = await getOrderTracking(orderNumber);
      if (result.status === "ok") output.innerHTML = trackingMarkup(result.tracking);
      else if (result.status === "not_found")
        output.innerHTML = `<p class="notice">We couldn't find an order with that number. Please check it and try again.</p>`;
      else
        output.innerHTML = `<p class="notice">Online order tracking isn't available yet. For an update on your order, message us on Instagram at <a href="${CONFIG.instagram.url}" target="_blank" rel="noopener">${CONFIG.instagram.handle}</a>.</p>`;
    } catch {
      output.innerHTML = `<p class="notice">We couldn't check your order right now. Please try again in a moment.</p>`;
    } finally {
      button.disabled = false;
    }
  });
  return el;
}
