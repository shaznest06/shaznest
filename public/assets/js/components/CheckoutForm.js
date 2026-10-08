import { CONFIG } from "../config.js";
import { createOrder } from "../api.js";
import { esc, html, uniqueId } from "../utils.js";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

const FIELDS = [
  { name: "fullName", label: "Full name", autocomplete: "name", validate: (v) => v.length >= 2 || "Please enter your full name." },
  {
    name: "mobile", label: "Mobile number", type: "tel", inputmode: "tel", autocomplete: "tel-national", hint: "10-digit Indian mobile number",
    clean: (v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""),
    validate: (v) => /^[6-9]\d{9}$/.test(v) || "Please enter a valid 10-digit mobile number.",
  },
  { name: "email", label: "Email", type: "email", autocomplete: "email", validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Please enter a valid email address." },
  { name: "address", label: "Address", textarea: true, autocomplete: "street-address", validate: (v) => v.length >= 5 || "Please enter your full address." },
  { name: "city", label: "City", autocomplete: "address-level2", half: true, validate: (v) => v.length >= 2 || "Please enter your city." },
  { name: "state", label: "State", select: STATES, autocomplete: "address-level1", half: true, validate: (v) => !!v || "Please choose your state." },
  { name: "pincode", label: "Pincode", inputmode: "numeric", autocomplete: "postal-code", maxlength: 6, validate: (v) => /^[1-9]\d{5}$/.test(v) || "Please enter a valid 6-digit pincode." },
];

function fieldMarkup(f) {
  const id = uniqueId(f.name);
  const attrs = `id="${id}" name="${f.name}" autocomplete="${f.autocomplete}" aria-describedby="${id}-err" required`;
  let control;
  if (f.textarea) control = `<textarea ${attrs} rows="2"></textarea>`;
  else if (f.select)
    control = `<select ${attrs}><option value="">Select</option>${f.select.map((s) => `<option>${esc(s)}</option>`).join("")}</select>`;
  else
    control = `<input ${attrs} type="${f.type || "text"}" ${f.inputmode ? `inputmode="${f.inputmode}"` : ""} ${f.maxlength ? `maxlength="${f.maxlength}"` : ""}>`;
  return `
    <div class="field${f.half ? " field--half" : ""}">
      <label class="field-label" for="${id}">${esc(f.label)}</label>
      ${control}
      <p class="field-error" id="${id}-err" aria-live="polite"></p>
    </div>`;
}

/**
 * CheckoutForm({ getItems, onBack }) → HTMLElement
 * Online payment only. Until Razorpay is integrated, submitting explains that
 * ordering isn't live yet — nothing is saved or charged.
 */
export function CheckoutForm({ getItems, onBack }) {
  const el = html(`
    <form class="checkout" novalidate>
      <button type="button" class="link-btn checkout__back">← Back to cart</button>
      <fieldset>
        <legend class="checkout__heading">Delivery details</legend>
        <div class="checkout__fields">${FIELDS.map(fieldMarkup).join("")}</div>
      </fieldset>
      <fieldset>
        <legend class="checkout__heading">Payment</legend>
        <div class="payment-option" aria-describedby="pay-note">
          <span class="payment-option__radio" aria-hidden="true"></span>
          <span><strong>Online payment</strong><br><small>UPI, cards and netbanking</small></span>
        </div>
        <p class="note" id="pay-note">${
          CONFIG.features.onlinePayment
            ? "You'll be taken to our secure payment partner to complete your order."
            : `Online payment is still being set up, so orders can't be placed on the website yet. To order now, message us on Instagram at <a href="${CONFIG.instagram.url}" target="_blank" rel="noopener">${CONFIG.instagram.handle}</a>.`
        }</p>
      </fieldset>
      <button type="submit" class="btn btn--primary btn--block">Proceed to payment</button>
      <p class="notice" role="status" hidden></p>
    </form>`);

  const notice = el.querySelector(".notice");
  const submit = el.querySelector('[type="submit"]');
  el.querySelector(".checkout__back").addEventListener("click", onBack);

  const validate = () => {
    const data = {};
    let firstInvalid = null;
    for (const f of FIELDS) {
      const input = el.elements[f.name];
      const raw = input.value.trim();
      const value = f.clean ? f.clean(raw) : raw;
      const result = f.validate(value);
      const error = result === true ? "" : result;
      input.setAttribute("aria-invalid", String(!!error));
      document.getElementById(input.getAttribute("aria-describedby")).textContent = error;
      if (error && !firstInvalid) firstInvalid = input;
      data[f.name] = value;
    }
    return { data, firstInvalid };
  };

  el.addEventListener("submit", async (e) => {
    e.preventDefault();
    notice.hidden = true;
    const { data, firstInvalid } = validate();
    if (firstInvalid) return firstInvalid.focus();

    // Shape of POST /api/v1/orders. Prices are recalculated server-side.
    const payload = {
      customer: { fullName: data.fullName, mobile: data.mobile, email: data.email },
      shippingAddress: { address: data.address, city: data.city, state: data.state, pincode: data.pincode, country: "IN" },
      items: getItems().map((i) => ({ productId: i.productId, colour: i.colour, quantity: i.quantity })),
      paymentMethod: "online",
    };

    submit.disabled = true;
    try {
      const result = await createOrder(payload);
      if (result.status === "unavailable") {
        notice.innerHTML = `Online payment isn't live yet, so no order has been placed and nothing has been charged. To order now, message us on Instagram at <a href="${CONFIG.instagram.url}" target="_blank" rel="noopener">${CONFIG.instagram.handle}</a>.`;
      } else {
        // TODO(razorpay): open Razorpay Checkout with result.order and verify payment server-side.
        notice.textContent = "We couldn't start the payment. Please try again.";
      }
    } catch {
      notice.textContent = "Something went wrong. Please try again in a moment.";
    } finally {
      notice.hidden = false;
      submit.disabled = false;
    }
  });

  return el;
}
