import { CONFIG } from "../config.js";
import { createOrder } from "../api.js";
import { clear, getItems, getSubtotal } from "../cart.js";
import { esc, formatPrice, html } from "../utils.js";

const ADDRESS_KEY = "sn_customer_address_v1";
const SESSION_KEY = "sn_customer_session_v1";
const ORDERS_KEY = "sn_orders_v1";
const RAZORPAY_KEY_ID = "rzp_test_REPLACE_WITH_TEST_KEY";
const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const VERIFY_PAYMENT_URL = "/api/v1/payments/verify";
const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
];

let razorpayLoad;

function readStored(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayLoad) return razorpayLoad;

  razorpayLoad = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => window.Razorpay ? resolve() : reject(new Error("Razorpay checkout did not initialize."));
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded."));
    document.head.append(script);
  }).catch((error) => {
    razorpayLoad = null;
    throw error;
  });
  return razorpayLoad;
}

function loyaltyStamps() {
  const orders = readStored(ORDERS_KEY, []);
  if (!Array.isArray(orders)) return 0;
  return orders.filter((order) => ["delivered", "completed"].includes(String(order?.status || "").toLowerCase())).length;
}

function addressMarkup(savedAddress) {
  if (!savedAddress || !savedAddress.name) return "";
  const session = readStored(SESSION_KEY, {});
  return `<div class="checkout-saved-address">
    <p class="eyebrow">Saved primary address</p>
    <p><strong>${esc(savedAddress.name)}</strong> · ${esc(savedAddress.phone)}</p>
    <p>${esc(savedAddress.address)}, ${esc(savedAddress.city)}, ${esc(savedAddress.state)} ${esc(savedAddress.pincode)}</p>
    <button class="link-btn" type="button" data-use-saved>Use this address</button>
    <span class="visually-hidden" data-saved-email>${esc(session?.email || "")}</span>
  </div>`;
}

function stepOneMarkup(savedAddress) {
  return `<section class="checkout-step" data-checkout-step="1" aria-labelledby="checkout-address-title">
    <div class="checkout-step__heading"><p class="eyebrow">Step 1 of 3</p><h2 id="checkout-address-title">Delivery address</h2></div>
    ${addressMarkup(savedAddress)}
    <div class="checkout-address-fields">
      <label class="checkout-field"><span>Full name</span><input name="name" autocomplete="name" required minlength="2"></label>
      <label class="checkout-field"><span>Mobile number</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel-national" required pattern="[6-9][0-9]{9}" maxlength="10"></label>
      <label class="checkout-field"><span>Email address</span><input name="email" type="email" autocomplete="email" required></label>
      <label class="checkout-field checkout-field--wide"><span>Address</span><textarea name="address" autocomplete="street-address" rows="3" required minlength="5"></textarea></label>
      <label class="checkout-field"><span>City</span><input name="city" autocomplete="address-level2" required minlength="2"></label>
      <label class="checkout-field"><span>State</span><select name="state" autocomplete="address-level1" required><option value="">Choose state</option>${STATES.map((state) => `<option value="${esc(state)}">${esc(state)}</option>`).join("")}</select></label>
      <label class="checkout-field"><span>Pincode</span><input name="pincode" inputmode="numeric" autocomplete="postal-code" required pattern="[1-9][0-9]{5}" maxlength="6"></label>
    </div>
    <p class="checkout-feedback" data-address-feedback role="status" aria-live="polite"></p>
    <button class="btn btn--primary" type="button" data-next-step="2">Continue to order summary</button>
  </section>`;
}

function orderSummaryMarkup(items, discountKey) {
  const subtotal = getSubtotal();
  const stamps = loyaltyStamps();
  const eligible = stamps >= 5 && items.length > 0;
  const discountedItem = eligible ? items.find((item) => item.key === discountKey) || items[0] : null;
  const discount = discountedItem ? Math.min(subtotal, Number(discountedItem.price) || 0) : 0;
  const rows = items.map((item) => `<li class="checkout-summary__item">
    <span>${esc(item.quantity)} × ${esc(item.name)}${item.colour ? ` · ${esc(item.colour)}` : ""}</span>
    <strong>${formatPrice(item.quantity * item.price)}</strong>
  </li>`).join("");
  const reward = eligible
    ? `<label class="checkout-reward"><span>Use one loyalty reward (one item unit free)</span><select data-reward-item>${items.map((item) => `<option value="${esc(item.key)}" ${item.key === discountedItem.key ? "selected" : ""}>${esc(item.name)} · ${formatPrice(item.price)}</option>`).join("")}</select><small>Eligibility and discount are rechecked by the server before payment.</small></label>`
    : `<p class="checkout-loyalty-note">${stamps}/5 completed-order stamps. ${stamps >= 5 ? "Add an item to apply a reward." : "Collect 5 delivered-order stamps to unlock one free item."}</p>`;

  return `<div class="checkout-summary">
    <ul class="checkout-summary__items">${rows || "<li>Your cart is empty.</li>"}</ul>
    ${reward}
    <dl class="checkout-totals"><div><dt>Subtotal</dt><dd>${formatPrice(subtotal)}</dd></div>${discount ? `<div class="checkout-totals__discount"><dt>Loyalty reward preview</dt><dd>−${formatPrice(discount)}</dd></div>` : ""}<div class="checkout-totals__due"><dt>Estimated total</dt><dd>${formatPrice(Math.max(0, subtotal - discount))}</dd></div></dl>
    <p class="checkout-summary__note">Final item prices, stock, reward eligibility, shipping charges, and payable amount are confirmed by the server.</p>
  </div>`;
}

function stepTwoMarkup() {
  return `<section class="checkout-step" data-checkout-step="2" aria-labelledby="checkout-summary-title" hidden>
    <div class="checkout-step__heading"><p class="eyebrow">Step 2 of 3</p><h2 id="checkout-summary-title">Order summary</h2></div>
    <div data-order-summary></div>
    <div class="checkout-step__actions"><button class="btn btn--ghost" type="button" data-previous-step="1">Back to address</button><button class="btn btn--primary" type="button" data-next-step="3">Continue to payment</button></div>
  </section>`;
}

function stepThreeMarkup() {
  return `<section class="checkout-step" data-checkout-step="3" aria-labelledby="checkout-payment-title" hidden>
    <div class="checkout-step__heading"><p class="eyebrow">Step 3 of 3</p><h2 id="checkout-payment-title">Secure payment</h2></div>
    <div class="checkout-payment-methods" aria-label="Available payment methods"><span>Razorpay</span><span>UPI</span><span>Cards</span></div>
    <p class="checkout-summary__note">Payment opens only after a server-created Razorpay test order is available. Payment confirmation is verified by the server before an order is saved.</p>
    <button class="btn btn--primary btn--block" type="button" data-pay>Pay with Razorpay / UPI / Cards</button>
    <div class="checkout-feedback" data-checkout-feedback role="status" aria-live="polite"></div>
    <button class="link-btn" type="button" data-previous-step="2">Back to order summary</button>
  </section>`;
}

function validateAddress(form) {
  const fields = [...form.querySelector('[data-checkout-step="1"]').querySelectorAll("input, select, textarea")];
  const invalid = fields.find((field) => !field.checkValidity());
  if (invalid) {
    invalid.reportValidity();
    invalid.focus();
    return false;
  }
  return true;
}

async function verifyPayment(response) {
  const result = await fetch(VERIFY_PAYMENT_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
    }),
  });
  if (!result.ok) throw new Error("Payment verification is not available.");
  const data = await result.json();
  if (data.verified !== true || !data.order) throw new Error("The server could not verify this payment.");
  return data.order;
}

function saveVerifiedOrder(order, fallbackItems) {
  const orderNumber = order.orderNumber || order.number || order.id;
  if (!orderNumber) throw new Error("Verified order response did not include an order number.");
  const existing = readStored(ORDERS_KEY, []);
  const orders = Array.isArray(existing) ? existing : [];
  const saved = {
    ...order,
    orderNumber: String(orderNumber),
    status: order.status || "processing",
    date: order.date || order.createdAt || new Date().toISOString(),
    items: Array.isArray(order.items) ? order.items : fallbackItems.map(({ productId, name, quantity }) => ({ productId, name, quantity })),
  };
  const updated = [saved, ...orders.filter((item) => String(item?.orderNumber || item?.number || item?.id) !== String(orderNumber))];
  if (!writeStored(ORDERS_KEY, updated)) throw new Error("The verified order could not be saved in this browser.");
  return saved;
}

export async function initiateRazorpayPayment({ payload, prefill, onStatus, onVerified }) {
  if (!CONFIG.features.onlinePayment) {
    onStatus("Online payment is not enabled until the server order and verification endpoints are configured. No payment was started.");
    return;
  }

  onStatus("Creating a secure order...");
  const result = await createOrder(payload);
  if (result.status !== "created") {
    onStatus("The order service is unavailable. No payment was started.");
    return;
  }

  const order = result.order || {};
  const key = order.keyId || RAZORPAY_KEY_ID;
  const orderId = order.id || order.razorpayOrderId;
  const amount = Number(order.amount);
  if (!key || key.includes("REPLACE_WITH") || !orderId || !Number.isSafeInteger(amount) || amount <= 0 || (order.currency && order.currency !== "INR")) {
    throw new Error("A valid Razorpay test key and server-created INR order are required.");
  }

  await loadRazorpayScript();
  const checkout = new window.Razorpay({
    key,
    amount,
    currency: "INR",
    name: CONFIG.brand,
    description: "ShaZ Nest order",
    order_id: orderId,
    prefill,
    theme: { color: "#d4af37" },
    handler: async (response) => {
      onStatus("Payment received. Verifying securely with the server...");
      try {
        const verifiedOrder = await verifyPayment(response);
        const savedOrder = saveVerifiedOrder(verifiedOrder, payload.items);
        clear();
        onVerified(savedOrder);
      } catch {
        onStatus("Payment was reported by Razorpay, but server verification is pending. Your cart is unchanged; contact support before retrying.");
      }
    },
    modal: { ondismiss: () => onStatus("Payment was not completed. Your cart is unchanged.") },
  });
  checkout.on("payment.failed", () => onStatus("Payment could not be completed. Your cart is unchanged."));
  checkout.open();
}

export function Checkout() {
  const savedAddress = readStored(ADDRESS_KEY, {});
  let currentStep = 1;
  let selectedRewardKey = null;
  const root = html(`<div class="checkout-page">
    <header class="checkout-page__header"><p class="eyebrow">ShaZ Nest</p><h1 class="section-title">Checkout</h1><p class="note">Your cart is reviewed and priced by the secure order service.</p></header>
    <ol class="checkout-progress" aria-label="Checkout progress"><li data-progress="1" aria-current="step">Delivery</li><li data-progress="2">Summary</li><li data-progress="3">Payment</li></ol>
    <form class="checkout-flow" novalidate>
      ${stepOneMarkup(savedAddress)}${stepTwoMarkup()}${stepThreeMarkup()}
    </form>
  </div>`);
  const form = root.querySelector(".checkout-flow");
  const feedback = root.querySelector("[data-checkout-feedback]");

  const setStep = (step) => {
    currentStep = step;
    form.querySelectorAll("[data-checkout-step]").forEach((panel) => { panel.hidden = Number(panel.dataset.checkoutStep) !== step; });
    root.querySelectorAll("[data-progress]").forEach((node) => {
      if (Number(node.dataset.progress) === step) node.setAttribute("aria-current", "step");
      else node.removeAttribute("aria-current");
    });
    if (step >= 2) {
      const summary = root.querySelector("[data-order-summary]");
      summary.innerHTML = orderSummaryMarkup(getItems(), selectedRewardKey);
      selectedRewardKey = root.querySelector("[data-reward-item]")?.value || selectedRewardKey;
      summary.querySelector("[data-reward-item]")?.addEventListener("change", (event) => {
        selectedRewardKey = event.currentTarget.value;
        summary.innerHTML = orderSummaryMarkup(getItems(), selectedRewardKey);
        setStep(currentStep);
      });
    }
    if (step === 3) {
      const payment = root.querySelector("[data-checkout-step='3']");
      payment.querySelector("[data-payment-summary]")?.remove();
      const summary = document.createElement("p");
      summary.className = "checkout-payment-total";
      summary.dataset.paymentSummary = "";
      const reward = getItems().find((item) => item.key === selectedRewardKey);
      const discount = loyaltyStamps() >= 5 && reward ? Math.min(getSubtotal(), Number(reward.price) || 0) : 0;
      summary.textContent = `Estimated total: ${formatPrice(Math.max(0, getSubtotal() - discount))}`;
      payment.insertBefore(summary, payment.querySelector(".checkout-payment-methods"));
    }
  };

  root.querySelector("[data-use-saved]")?.addEventListener("click", (event) => {
    const section = root.querySelector('[data-checkout-step="1"]');
    const address = savedAddress || {};
    for (const name of ["name", "phone", "address", "city", "state", "pincode"]) {
      const field = section.querySelector(`[name="${name}"]`);
      if (field) field.value = address[name] || "";
    }
    const emailField = section.querySelector('[name="email"]');
    if (emailField) emailField.value = root.querySelector("[data-saved-email]")?.textContent || "";
    event.currentTarget.textContent = "Saved address selected";
  });

  root.querySelectorAll("[data-next-step]").forEach((button) => button.addEventListener("click", () => {
    const next = Number(button.dataset.nextStep);
    if (next === 2) {
      if (!getItems().length) {
        root.querySelector("[data-address-feedback]").textContent = "Your cart is empty. Add an item before checkout.";
        return;
      }
      root.querySelector("[data-address-feedback]").textContent = "";
      if (!validateAddress(form)) return;
      const values = Object.fromEntries(new FormData(form).entries());
      writeStored(ADDRESS_KEY, { name: values.name, phone: values.phone, address: values.address, city: values.city, state: values.state, pincode: values.pincode });
      selectedRewardKey = getItems()[0]?.key || null;
    }
    if (next === 3 && !getItems().length) {
      feedback.textContent = "Your cart is empty. Add an item before checkout.";
      return;
    }
    setStep(next);
  }));

  root.querySelectorAll("[data-previous-step]").forEach((button) => button.addEventListener("click", () => setStep(Number(button.dataset.previousStep))));

  root.querySelector("[data-pay]").addEventListener("click", async () => {
    if (currentStep !== 3 || !getItems().length) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const reward = root.querySelector("[data-reward-item]")?.value || null;
    const payload = {
      customer: { fullName: values.name, mobile: values.phone, email: values.email },
      shippingAddress: { address: values.address, city: values.city, state: values.state, pincode: values.pincode, country: "IN" },
      items: getItems().map((item) => ({ productId: item.productId, colour: item.colour, quantity: item.quantity })),
      paymentMethod: "online",
      loyaltyRewardProductId: reward ? getItems().find((item) => item.key === reward)?.productId : null,
    };
    const payButton = root.querySelector("[data-pay]");
    payButton.disabled = true;
    feedback.textContent = "";
    try {
      await initiateRazorpayPayment({
        payload,
        prefill: { name: values.name, contact: values.phone, email: values.email },
        onStatus: (message) => { feedback.textContent = message; },
        onVerified: (order) => {
          feedback.textContent = `Payment verified. Order ${order.orderNumber} is saved to your order history.`;
        },
      });
    } catch (error) {
      feedback.textContent = error.message || "Payment could not be started. No payment was taken.";
    } finally {
      payButton.disabled = false;
    }
  });

  setStep(currentStep);
  return root;
}
