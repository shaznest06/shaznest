import { esc, html } from "../utils.js";

const SESSION_KEY = "sn_customer_session_v1";
const ADDRESS_KEY = "sn_customer_address_v1";
const ORDERS_KEY = "sn_orders_v1";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = "REPLACE_WITH_GOOGLE_WEB_CLIENT_ID";
const GOOGLE_AUTH_URL = "/api/v1/auth/google";
const CUSTOMER_SESSION_URL = "/api/v1/customer/session";
let googleScriptPromise = null;
let initializedGoogleClientId = "";
let activeGoogleCredentialHandler = null;

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

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

function readSession() {
  const session = readStored(SESSION_KEY);
  return session && typeof session.email === "string" ? session : null;
}

function orderRecords() {
  const orders = readStored(ORDERS_KEY, []);
  return Array.isArray(orders) ? orders.filter((order) => order && typeof order === "object") : [];
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusName(value) {
  const status = String(value || "").toLowerCase();
  if (status === "shipped") return "Shipped";
  if (status === "delivered" || status === "completed") return "Delivered";
  if (status === "processing" || status === "pending") return "Processing";
  return "Status unavailable";
}

async function requestCustomerJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json", ...options.headers },
    ...options,
  });
  const type = response.headers.get("content-type") || "";
  const body = type.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(body?.message || `Customer service returned ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    const loaded = () => window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error("Google Identity Services did not initialize."));
    if (!script) {
      script = document.createElement("script");
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", loaded, { once: true });
      script.addEventListener("error", () => reject(new Error("Google sign-in could not be loaded.")), { once: true });
      document.head.append(script);
    } else {
      script.addEventListener("load", loaded, { once: true });
      script.addEventListener("error", () => reject(new Error("Google sign-in could not be loaded.")), { once: true });
      if (window.google?.accounts?.id) loaded();
    }
  }).catch((error) => {
    googleScriptPromise = null;
    throw error;
  });
  return googleScriptPromise;
}

function configureGoogleButton(view, mode, onCredential) {
  if (!location.hash.startsWith("#/account")) return;
  const clientId = window.SHAZ_NEST_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;
  const host = view.querySelector("[data-google-button]");
  const fallback = view.querySelector("[data-google-fallback]");
  const feedback = view.querySelector("[data-auth-feedback]");
  if (!host || !fallback || host.dataset.googleLoading === "true" || host.dataset.googleConfigured === "true") return;
  host.dataset.googleLoading = "true";
  fallback.addEventListener("click", () => {
    const configuredClientId = window.SHAZ_NEST_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;
    feedback.textContent = configuredClientId.includes("REPLACE_WITH")
      ? "Google sign-in is not configured yet. Add the Google Web OAuth client ID to the site configuration."
      : "Google sign-in is still loading. Please try again shortly.";
  }, { once: true });
  loadGoogleIdentityServices().then((identity) => {
    if (!view.isConnected) return;
    host.dataset.googleLoading = "false";
    host.dataset.googleConfigured = "true";
    if (clientId.includes("REPLACE_WITH")) return;

    activeGoogleCredentialHandler = onCredential;
    if (initializedGoogleClientId !== clientId) {
      identity.initialize({
        client_id: clientId,
        auto_select: false,
        callback: (response) => activeGoogleCredentialHandler?.(response),
      });
      initializedGoogleClientId = clientId;
    }
    host.replaceChildren();
    identity.renderButton(host, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: mode === "register" ? "signup_with" : "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: Math.max(240, Math.min(360, Math.round(host.getBoundingClientRect().width || 320))),
    });
    fallback.hidden = true;
  }).catch(() => {
    delete host.dataset.googleLoading;
    feedback.textContent = "Google sign-in is temporarily unavailable. You can use the other sign-in options.";
  });
}

function decodeGoogleCredential(credential) {
  const payload = credential.split(".")[1];
  if (!payload) throw new Error("Google returned an invalid credential.");
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function safeProfileImage(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

async function handleGoogleCredential(response, root, mode) {
  const feedback = root.querySelector("[data-auth-feedback]");
  if (!response?.credential) {
    feedback.textContent = "Google did not return a sign-in credential.";
    return;
  }

  let claims;
  try {
    claims = decodeGoogleCredential(response.credential);
  } catch {
    feedback.textContent = "Google returned an invalid sign-in response.";
    return;
  }
  if (!claims.email || claims.email_verified !== true) {
    feedback.textContent = "A verified Google email address is required.";
    return;
  }

  feedback.textContent = "Verifying your Google account securely…";
  try {
    const result = await requestCustomerJson(GOOGLE_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential, intent: mode, createIfMissing: true }),
    });
    const customer = result?.customer;
    if (result?.authenticated !== true || !customer?.email || customer.email.toLowerCase() !== claims.email.toLowerCase()) {
      throw new Error("Google account verification was unsuccessful.");
    }

    renderPortal(root, {
      ...result,
      authenticated: true,
      customer: {
        ...customer,
        name: customer.name || claims.name || claims.email,
        email: customer.email,
        picture: safeProfileImage(customer.picture || claims.picture),
      },
    });
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  } catch (error) {
    feedback.textContent = error.status === 401 || error.status === 403
      ? "Google account verification was unsuccessful. Please try again."
      : "Secure Google sign-in is not available yet. Your credential was not saved.";
  }
}

function authView(mode, method, onGoogleCredential) {
  const isRegister = mode === "register";
  const usesOtp = method === "otp";
  const view = html(`
    <div class="portal-auth" data-auth-view="${mode}">
      <div class="portal-heading">
        <p class="eyebrow">Customer space</p>
        <h1 class="section-title">Your account</h1>
        <p class="note">Sign in to view your saved details and order history.</p>
      </div>
      <div class="portal-auth__panel">
        <div class="portal-tabs" role="group" aria-label="Account access">
          <button class="portal-tab" type="button" data-auth-mode="login" aria-pressed="${!isRegister}">Sign in</button>
          <button class="portal-tab" type="button" data-auth-mode="register" aria-pressed="${isRegister}">Create account</button>
        </div>
        <div class="portal-methods" role="group" aria-label="Sign-in method">
          <button class="portal-method" type="button" data-auth-method="password" aria-pressed="${!usesOtp}">Email &amp; password</button>
          <button class="portal-method" type="button" data-auth-method="otp" aria-pressed="${usesOtp}">One-time code</button>
        </div>
        <div class="portal-google-signin">
          <div class="portal-google-signin__official" data-google-button></div>
          <button class="portal-google-signin__fallback" type="button" data-google-fallback><span aria-hidden="true">G</span>Sign in with Google</button>
        </div>
        <div class="portal-auth-divider"><span>or continue with email</span></div>
        <form class="portal-form" data-portal-auth novalidate>
          ${isRegister ? `<label class="portal-field"><span>Full name</span><input name="name" autocomplete="name" required minlength="2"></label>` : ""}
          <label class="portal-field"><span>Email address</span><input name="email" type="email" autocomplete="email" required></label>
          ${usesOtp
            ? `<label class="portal-field"><span>One-time code</span><input name="otp" inputmode="numeric" autocomplete="one-time-code" placeholder="6-digit code" maxlength="6" disabled></label>
               <button class="btn btn--ghost portal-otp" type="button" data-otp-request>Request a code</button>`
            : `<label class="portal-field"><span>Password</span><input name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" required minlength="8"></label>`}
          <p class="portal-feedback" data-auth-feedback role="status" aria-live="polite"></p>
          <button class="btn btn--primary btn--block" type="submit">${isRegister ? "Create local preview account" : "Continue in preview"}</button>
        </form>
        <p class="portal-disclaimer">Preview only. Credentials are not verified, transmitted, or saved. Account access will require the secure backend.</p>
      </div>
    </div>`);

  view.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => {
    view.replaceWith(authView(button.dataset.authMode, method, onGoogleCredential));
  }));
  view.querySelectorAll("[data-auth-method]").forEach((button) => button.addEventListener("click", () => {
    view.replaceWith(authView(mode, button.dataset.authMethod, onGoogleCredential));
  }));
  view.querySelector("[data-otp-request]")?.addEventListener("click", () => {
    view.querySelector("[data-auth-feedback]").textContent = "One-time codes are not connected yet. No code was sent.";
  });
  configureGoogleButton(view, mode, (response) => onGoogleCredential(response, mode));
  view.querySelector("[data-portal-auth]").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = view.querySelector("[data-auth-feedback]");
    if (usesOtp) {
      feedback.textContent = "One-time code sign-in is not connected yet.";
      return;
    }
    if (!form.reportValidity()) return;

    const email = form.elements.email.value.trim().toLowerCase();
    const name = isRegister ? form.elements.name.value.trim() : email.split("@")[0];
    if (!writeStored(SESSION_KEY, { name, email, signedInAt: new Date().toISOString() })) {
      feedback.textContent = "This browser could not save a local preview session.";
      return;
    }
    renderPortal(view.parentElement);
  });
  return view;
}

function orderMarkup(order) {
  const orderNumber = order.orderNumber || order.number || order.id || "Order";
  const items = Array.isArray(order.items) ? order.items : [];
  const status = statusName(order.status);
  const statusClass = status.toLowerCase().replace(/\s+/g, "-");
  const itemMarkup = items.length
    ? items.map((item) => `<li>${esc(item.quantity || 1)} × ${esc(item.name || item.productName || "Item")}</li>`).join("")
    : "<li>Item details unavailable</li>";

  return `<article class="portal-order">
    <div class="portal-order__top">
      <div><p class="portal-order__number">${esc(orderNumber)}</p><time class="note">${esc(formatDate(order.date || order.createdAt))}</time></div>
      <span class="portal-status portal-status--${statusClass}">${esc(status)}</span>
    </div>
    <ul class="portal-order__items">${itemMarkup}</ul>
    <a class="portal-order__tracking" href="#/track">Track order <span aria-hidden="true">→</span></a>
  </article>`;
}

function dashboardView(session, accountData = null) {
  const serverManaged = accountData?.authenticated === true;
  const orders = serverManaged ? (Array.isArray(accountData.orders) ? accountData.orders : []) : orderRecords();
  const storedDeliveredCount = orders.filter((order) => ["delivered", "completed"].includes(String(order.status || "").toLowerCase())).length;
  const accountStamps = Number(accountData?.loyalty?.stamps ?? accountData?.loyaltyStamps);
  const deliveredCount = serverManaged && Number.isFinite(accountStamps) ? Math.max(0, Math.floor(accountStamps)) : storedDeliveredCount;
  const filledStamps = Math.min(deliveredCount, 5);
  const address = serverManaged ? accountData.address || {} : readStored(ADDRESS_KEY, {}) || {};
  const picture = safeProfileImage(session.picture);

  return html(`
    <div class="portal-dashboard">
      <header class="portal-dashboard__header">
        <div class="portal-dashboard__profile">${picture ? `<img class="portal-avatar" src="${esc(picture)}" alt="" referrerpolicy="no-referrer">` : `<span class="portal-avatar portal-avatar--fallback" aria-hidden="true">${esc((session.name || session.email || "S").slice(0, 1).toUpperCase())}</span>`}<div><p class="eyebrow">Customer space</p><h1 class="section-title">Welcome, ${esc(session.name || session.email)}</h1><p class="portal-dashboard__email">${esc(session.email)}</p></div></div>
        <button class="link-btn" type="button" data-sign-out>Sign out</button>
        <p class="portal-feedback" data-sign-out-feedback role="status" aria-live="polite"></p>
      </header>
      <section class="portal-section portal-loyalty" aria-labelledby="loyalty-title">
        <div class="portal-section__heading"><div><p class="eyebrow">ShaZ Nest rewards</p><h2 id="loyalty-title">My Digital Loyalty Card</h2></div><span class="portal-loyalty__count">${deliveredCount} completed ${deliveredCount === 1 ? "order" : "orders"}</span></div>
        <div class="portal-stamps" role="img" aria-label="${filledStamps} of 5 loyalty stamps earned">
          ${Array.from({ length: 5 }, (_, index) => `<span class="portal-stamp${index < filledStamps ? " is-earned" : ""}" aria-hidden="true"><span>${index < filledStamps ? "SN" : String(index + 1).padStart(2, "0")}</span></span>`).join("")}
        </div>
        <p class="portal-reward">Collect 5 stamps to claim any item for FREE!</p>
        <p class="note">${serverManaged ? "Loyalty progress is linked to your verified customer account." : "One stamp is shown for each completed order saved in this browser. Rewards are not yet connected to an account system."}</p>
      </section>
      <section class="portal-section" aria-labelledby="orders-title">
        <div class="portal-section__heading"><div><p class="eyebrow">Your purchases</p><h2 id="orders-title">Order History</h2></div><span class="note">${orders.length} ${orders.length === 1 ? "order" : "orders"}</span></div>
        <div class="portal-orders">${orders.length ? orders.map(orderMarkup).join("") : `<div class="portal-empty"><p>${serverManaged ? "No orders are linked to this Google account yet." : "No locally saved order history."}</p><a href="#/shop">Browse the collection</a></div>`}</div>
      </section>
      <section class="portal-section" aria-labelledby="address-title">
        <div class="portal-section__heading"><div><p class="eyebrow">Delivery details</p><h2 id="address-title">Saved Delivery Address</h2></div><span class="portal-address-tag">Primary</span></div>
        <form class="portal-address" data-address-form novalidate>
          <label class="portal-field"><span>Name</span><input name="name" autocomplete="name" value="${esc(address.name)}" required minlength="2"></label>
          <label class="portal-field"><span>Phone</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel-national" value="${esc(address.phone)}" required pattern="[6-9][0-9]{9}" maxlength="10"></label>
          <label class="portal-field"><span>Pincode</span><input name="pincode" inputmode="numeric" autocomplete="postal-code" value="${esc(address.pincode)}" required pattern="[1-9][0-9]{5}" maxlength="6"></label>
          <label class="portal-field portal-field--wide"><span>Address</span><textarea name="address" autocomplete="street-address" required minlength="5" rows="3">${esc(address.address)}</textarea></label>
          <label class="portal-field"><span>City</span><input name="city" autocomplete="address-level2" value="${esc(address.city)}" required minlength="2"></label>
          <label class="portal-field"><span>State</span><select name="state" autocomplete="address-level1" required><option value="">Select state</option>${STATES.map((state) => `<option value="${esc(state)}" ${address.state === state ? "selected" : ""}>${esc(state)}</option>`).join("")}</select></label>
          <p class="portal-feedback portal-field--wide" data-address-feedback role="status" aria-live="polite"></p>
          <button class="btn btn--primary" type="submit">Save primary address</button>
        </form>
      </section>
      <p class="portal-disclaimer">${serverManaged ? "Your Google account was verified by ShaZ Nest. Account data is provided by the customer service." : "This preview stores your session and address only in this browser. It is not a secure customer account."}</p>
    </div>`);
}

function renderPortal(root, accountData = null) {
  const serverManaged = accountData?.authenticated === true;
  const session = serverManaged ? accountData.customer : readSession();
  root.replaceChildren(session
    ? dashboardView(session, serverManaged ? accountData : null)
    : authView("login", "password", (response, mode) => handleGoogleCredential(response, root, mode)));
  root.querySelector("[data-sign-out]")?.addEventListener("click", async () => {
    const button = root.querySelector("[data-sign-out]");
    const feedback = root.querySelector("[data-sign-out-feedback]");
    button.disabled = true;
    if (serverManaged) {
      try {
        await requestCustomerJson(CUSTOMER_SESSION_URL, { method: "DELETE" });
      } catch {
        feedback.textContent = "Could not end the server session. Please try again.";
        button.disabled = false;
        return;
      }
    }
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    renderPortal(root);
  });
  root.querySelector("[data-address-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const address = Object.fromEntries(new FormData(form).entries());
    const feedback = root.querySelector("[data-address-feedback]");
    if (!serverManaged) {
      feedback.textContent = writeStored(ADDRESS_KEY, address) ? "Primary address saved on this device." : "This browser could not save the address.";
      return;
    }
    requestCustomerJson("/api/v1/customer/address", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(address),
    }).then(() => { feedback.textContent = "Primary address saved to your account."; })
      .catch(() => { feedback.textContent = "Address service is unavailable. Your account address was not changed."; });
  });
}

export function CustomerPortal() {
  const root = html('<div class="customer-portal"></div>');
  renderPortal(root);
  let sessionCheckInProgress = false;
  let serverSessionLoaded = false;
  const restoreCustomerSession = () => {
    const route = location.hash.slice(2).split("?", 1)[0];
    if (route !== "account") return;
    const auth = root.querySelector("[data-auth-view]");
    if (auth) configureGoogleButton(auth, auth.dataset.authView, (response, mode) => handleGoogleCredential(response, root, mode));
    if (sessionCheckInProgress || serverSessionLoaded) return;
    sessionCheckInProgress = true;
    requestCustomerJson(CUSTOMER_SESSION_URL).then((result) => {
      if (result?.authenticated === true && result.customer?.email) {
        serverSessionLoaded = true;
        renderPortal(root, {
          ...result,
          authenticated: true,
          customer: { ...result.customer, picture: safeProfileImage(result.customer.picture) },
        });
      } else if (result?.authenticated === false) {
        serverSessionLoaded = true;
      }
    }).catch((error) => {
      if (error.status === 401 || error.status === 403) serverSessionLoaded = true;
    }).finally(() => { sessionCheckInProgress = false; });
  };
  window.addEventListener("hashchange", restoreCustomerSession);
  restoreCustomerSession();
  return root;
}
