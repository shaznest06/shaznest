import { esc, formatPrice, html } from "../utils.js";

const ADMIN_SESSION = "/api/v1/admin/session";
const PRODUCTS_URL = "/api/v1/admin/products";
const ORDERS_URL = "/api/v1/admin/orders";
const PROOFS_URL = "/api/v1/admin/review-proofs";
const CUSTOMERS_URL = "/api/v1/admin/customers";
const ANALYTICS_URL = "/api/v1/admin/analytics/live";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const STATUSES = ["Processing", "Shipped", "Delivered"];

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/json", ...options.headers },
    ...options,
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(body?.message || `Admin service returned ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function listFrom(data, key) {
  const list = Array.isArray(data) ? data : data?.[key];
  return Array.isArray(list) ? list : [];
}

function statusValue(value) {
  const found = STATUSES.find((status) => status.toLowerCase() === String(value || "").toLowerCase());
  return found || "Processing";
}

function analyticsCount(value) {
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count.toLocaleString("en-IN") : "—";
}

function renderAnalytics(root, data) {
  const pageCounts = data.pageBreakdown || data.activeByPage || {};
  const values = {
    home: pageCounts.home ?? pageCounts.root ?? pageCounts["/"],
    checkout: pageCounts.checkout ?? pageCounts["#/checkout"],
    reviews: pageCounts.reviews ?? pageCounts["#/reviews"],
    product: pageCounts.product ?? pageCounts.productModal,
  };
  root.querySelector("[data-live-count]").textContent = analyticsCount(data.activeVisitors);
  root.querySelector("[data-overview-visitors]").textContent = analyticsCount(data.activeVisitors);
  root.querySelector("[data-total-sales]").textContent = Number.isFinite(Number(data.totalSales)) ? formatPrice(Number(data.totalSales)) : "—";
  root.querySelector("[data-active-orders]").textContent = analyticsCount(data.activeOrders);
  root.querySelector("[data-average-order]").textContent = Number.isFinite(Number(data.averageOrderValue)) ? formatPrice(Number(data.averageOrderValue)) : "—";
  Object.entries(values).forEach(([page, count]) => {
    root.querySelector(`[data-page-count="${page}"]`).textContent = analyticsCount(count);
  });

  const feed = root.querySelector("[data-analytics-feed]");
  const hasActionData = Array.isArray(data.recentActions);
  const actions = hasActionData ? data.recentActions.slice(0, 8) : [];
  if (!actions.length) {
    const empty = document.createElement("li");
    empty.className = "admin-analytics__empty";
    empty.textContent = hasActionData ? "No recent visitor actions." : "Recent action data unavailable.";
    feed.replaceChildren(empty);
  } else {
    feed.replaceChildren(...actions.map((action) => {
      const row = document.createElement("li");
      const message = document.createElement("span");
      message.textContent = typeof action.description === "string" ? action.description : typeof action.message === "string" ? action.message : "Visitor activity";
      row.append(message);
      if (action.timestamp) {
        const time = document.createElement("time");
        const date = new Date(action.timestamp);
        time.textContent = Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        row.append(time);
      }
      return row;
    }));
  }
  root.querySelector("[data-live-indicator]").classList.add("is-connected");
  root.querySelector("[data-live-status]").textContent = "Live";
  setMessage(root.querySelector("[data-analytics-feedback]"), "");
}

function clearAnalytics(root) {
  root.querySelector("[data-live-count]").textContent = "—";
  root.querySelectorAll("[data-page-count]").forEach((count) => { count.textContent = "—"; });
  const indicator = root.querySelector("[data-live-indicator]");
  indicator?.classList.remove("is-connected");
  if (root.querySelector("[data-live-status]")) root.querySelector("[data-live-status]").textContent = "Unavailable";
  const feed = root.querySelector("[data-analytics-feed]");
  if (feed) {
    const empty = document.createElement("li");
    empty.className = "admin-analytics__empty";
    empty.textContent = "Recent activity is unavailable.";
    feed.replaceChildren(empty);
  }
}

function loginMarkup(message = "") {
  return html(`<div class="admin-gate" role="dialog" aria-modal="true" aria-labelledby="admin-gate-title">
    <div class="admin-gate__mark" aria-hidden="true">SN</div>
    <p class="eyebrow">Restricted access</p>
    <h1 id="admin-gate-title">Admin access</h1>
    <form class="admin-login" data-admin-login novalidate>
      <label class="admin-field"><span>Passcode</span><input name="passcode" type="password" autocomplete="current-password" required minlength="8" autofocus></label>
      <p class="admin-feedback" data-login-feedback role="status" aria-live="polite">${esc(message)}</p>
      <button class="admin-button admin-button--gold" type="submit">Unlock</button>
    </form>
  </div>`);
}

function productCard(product) {
  const title = product.name || product.title || "Untitled product";
  const price = Number(product.price) || 0;
  const stock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  return `<article class="admin-product" data-product-row data-product-id="${esc(product.id)}" data-product-category="${esc(product.category || "")}" data-product-search="${esc(`${title} ${product.category || ""}`.toLowerCase())}">
    <label class="admin-product__select"><input type="checkbox" data-product-select="${esc(product.id)}" aria-label="Select ${esc(title)}"></label>
    <div class="admin-product__image">${product.images?.[0]?.src ? `<img src="${esc(product.images[0].src)}" alt="${esc(product.images[0].alt || title)}" loading="lazy">` : `<span>${esc(title.slice(0, 1))}</span>`}</div>
    <div class="admin-product__details"><p class="admin-product__category">${esc(product.category || "Uncategorized")}</p><h3>${esc(title)}</h3><p>${formatPrice(price)} · <span data-product-stock-label>${stock} in stock</span></p>${variants.length ? `<div class="admin-variant-chips">${variants.map((variant) => `<span>${esc([variant.color, variant.fabricType, variant.size].filter(Boolean).join(" · "))}</span>`).join("")}</div>` : ""}</div>
    <div class="admin-product__actions"><button class="admin-button admin-button--quiet" type="button" data-edit-product="${esc(product.id)}">Edit</button><button class="admin-button admin-button--danger" type="button" data-delete-product="${esc(product.id)}">Delete</button></div>
  </article>`;
}

function orderLane(order) {
  if (String(order.deliveryStatus || order.status || "").toLowerCase() === "delivered") return "Delivered";
  if (String(order.deliveryStatus || order.status || "").toLowerCase() === "shipped") return "Shipped";
  if (["paid", "authorized"].includes(String(order.paymentStatus || "").toLowerCase())) return "Paid";
  return "Pending";
}

function orderCard(order) {
  const id = order.id || order.orderNumber;
  const orderNumber = order.orderNumber || order.number || id || "Order";
  const status = statusValue(order.deliveryStatus || order.status);
  const paid = ["paid", "authorized"].includes(String(order.paymentStatus || "").toLowerCase());
  const nextIndex = STATUSES.indexOf(status);
  const nextStatus = paid ? STATUSES[nextIndex + 1] : null;
  const customer = order.customer?.fullName || order.customerName || "Customer";
  const items = Array.isArray(order.items) ? order.items : [];
  const summary = items.map((item) => `${Number(item.quantity) || 1} × ${item.name || item.productName || "Item"}`).join(", ");
  return `<article class="admin-order" data-order-id="${esc(id)}">
    <div class="admin-order__main"><p class="admin-order__number">${esc(orderNumber)}</p><p class="admin-order__customer">${esc(customer)}</p><p class="admin-order__items">${esc(summary || "Item details unavailable")}</p><p class="admin-order__total">${formatPrice(order.totalAmount || 0)}</p></div>
    <span class="admin-order__status admin-order__status--${orderLane(order).toLowerCase()}">${esc(orderLane(order))}</span>
    <div class="admin-order__actions">
      ${nextStatus ? `<button class="admin-button admin-button--quiet" type="button" data-advance-order="${esc(id)}" data-next-status="${nextStatus}">Mark ${nextStatus}</button>` : ""}
      <button class="admin-button admin-button--gold" type="button" data-issue-stamp="${esc(id)}" ${status !== "Delivered" || order.loyaltyStampIssued ? "disabled" : ""}>${order.loyaltyStampIssued ? "Stamp granted" : "Grant Loyalty Stamp"}</button>
      <button class="admin-button admin-button--quiet" type="button" data-print-order="${esc(id)}">Packing slip</button>
    </div>
  </article>`;
}

function proofCard(proof) {
  return `<article class="admin-proof-card" data-proof-id="${esc(proof.id)}">
    <img src="${esc(proof.image_url || proof.src)}" alt="Customer WhatsApp proof submitted ${esc(proof.created_at || "")}" loading="lazy">
    <div><p>${proof.verified ? "Published" : "Pending review"}</p><time>${esc(proof.created_at || "Date unavailable")}</time></div>
    <div class="admin-proof-card__actions">${proof.verified ? `<button class="admin-button admin-button--danger" type="button" data-review-proof="${esc(proof.id)}" data-verified="false">Unpublish</button>` : `<button class="admin-button admin-button--gold" type="button" data-review-proof="${esc(proof.id)}" data-verified="true">Approve</button><button class="admin-button admin-button--danger" type="button" data-reject-proof="${esc(proof.id)}">Reject</button>`}</div>
  </article>`;
}

function customerCard(customer) {
  const stamps = Math.max(0, Math.min(5, Number(customer.loyalty_stamps) || 0));
  return `<article class="admin-customer"><div><h3>${esc(customer.name || "Customer")}</h3><p>${esc(customer.email || "No email")}</p></div><span>${Number(customer.total_orders) || 0} orders</span><span class="admin-customer__identity">${customer.google_id ? "Google" : "Email"}</span><div class="admin-customer__stamps" aria-label="${stamps} of 5 loyalty stamps"><span>${Array.from({ length: 5 }, (_, index) => `<i class="${index < stamps ? "is-earned" : ""}"></i>`).join("")}</span><small>${stamps}/5 stamps</small></div></article>`;
}

function printableInvoice(order) {
  const invoice = document.createElement("article");
  invoice.className = "admin-invoice-paper";
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = items.map((item) => {
    const row = document.createElement("tr");
    const name = document.createElement("td");
    const quantity = document.createElement("td");
    const amount = document.createElement("td");
    name.textContent = item.name || item.productName || "Item";
    quantity.textContent = String(Number(item.quantity) || 1);
    amount.textContent = formatPrice(Number(item.price) * (Number(item.quantity) || 1) || 0);
    row.append(name, quantity, amount);
    return row;
  });
  const customer = order.customer || {};
  const address = order.shippingAddress || {};
  invoice.innerHTML = `<p class="admin-invoice-paper__brand">ShaZ Nest</p><h2 id="invoice-title">Dispatch packing slip</h2><dl><div><dt>Order</dt><dd>${esc(order.orderNumber || order.id || "—")}</dd></div><div><dt>Date</dt><dd>${esc(order.createdAt || "—")}</dd></div><div><dt>Ship to</dt><dd>${esc(customer.fullName || order.customerName || "Customer")}</dd></div><div><dt>Email</dt><dd>${esc(customer.email || "—")}</dd></div><div><dt>Delivery address</dt><dd>${esc([address.address, address.city, address.state, address.pincode].filter(Boolean).join(", ") || "Address unavailable")}</dd></div></dl><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody></tbody></table><p class="admin-invoice-paper__total">Order total: ${formatPrice(Number(order.totalAmount) || 0)}</p><p class="admin-invoice-paper__note">Packing slip · Not a tax invoice</p>`;
  invoice.querySelector("tbody").replaceChildren(...lines);
  return invoice;
}

function dashboardMarkup(admin) {
  return html(`<div class="admin-dashboard">
    <header class="admin-dashboard__header"><div><p class="eyebrow">ShaZ Nest · Operations</p><h1>Admin dashboard</h1><p class="admin-dashboard__welcome">Signed in as ${esc(admin?.name || admin?.email || "authorized administrator")}</p></div><button class="admin-button admin-button--quiet" type="button" data-admin-logout>Sign out</button></header>
    <nav class="admin-tabs" aria-label="Admin sections"><button type="button" data-admin-tab="overview" aria-pressed="true">Overview</button><button type="button" data-admin-tab="products" aria-pressed="false">Inventory</button><button type="button" data-admin-tab="orders" aria-pressed="false">Orders</button><button type="button" data-admin-tab="customers" aria-pressed="false">Customers</button><button type="button" data-admin-tab="proofs" aria-pressed="false">Reviews</button></nav>
    <p class="admin-feedback" data-dashboard-feedback role="status" aria-live="polite"></p>
    <section class="admin-panel admin-overview" data-admin-panel="overview" aria-labelledby="admin-overview-title">
      <div class="admin-panel__heading"><div><p class="eyebrow">At a glance</p><h2 id="admin-overview-title">Store overview</h2></div></div>
      <div class="admin-metric-grid"><article><p>Total Sales</p><strong data-total-sales>—</strong><span>paid orders</span></article><article><p>Active Orders</p><strong data-active-orders>—</strong><span>awaiting delivery</span></article><article><p>Average Order Value</p><strong data-average-order>—</strong><span>paid orders</span></article><article><p>Live Visitors</p><strong data-overview-visitors>—</strong><span>active sessions</span></article></div>
      <section class="admin-analytics" aria-labelledby="admin-analytics-title">
        <header class="admin-analytics__header"><div><p class="eyebrow">Store pulse</p><h2 id="admin-analytics-title">Live Visitors Right Now</h2></div><span class="admin-live-indicator" data-live-indicator><span class="admin-live-indicator__dot" aria-hidden="true"></span><span data-live-status>Connecting</span></span></header>
        <div class="admin-analytics__grid"><article class="admin-live-card"><p>Live visitors</p><strong data-live-count>—</strong><span>active sessions</span></article><section class="admin-page-card" aria-labelledby="admin-page-breakdown-title"><h3 id="admin-page-breakdown-title">Active Page Breakdown</h3><dl><div><dt>Home</dt><dd data-page-count="home">—</dd></div><div><dt>Checkout</dt><dd data-page-count="checkout">—</dd></div><div><dt>Reviews</dt><dd data-page-count="reviews">—</dd></div><div><dt>Product views</dt><dd data-page-count="product">—</dd></div></dl></section><section class="admin-activity-card" aria-labelledby="admin-activity-title"><h3 id="admin-activity-title">Recent Actions Feed</h3><ul data-analytics-feed><li class="admin-analytics__empty">Waiting for analytics service…</li></ul></section></div>
        <p class="admin-feedback" data-analytics-feedback role="status" aria-live="polite"></p>
      </section>
    </section>
    <section class="admin-panel" data-admin-panel="products" aria-labelledby="admin-products-title" hidden>
      <div class="admin-panel__heading"><div><p class="eyebrow">Catalogue</p><h2 id="admin-products-title">Inventory &amp; products</h2></div><button class="admin-button admin-button--gold" type="button" data-new-product>Add product</button></div>
      <div class="admin-inventory-tools"><label class="admin-field"><span>Search catalogue</span><input type="search" data-product-search placeholder="Product name or category"></label><label class="admin-field"><span>Category</span><select data-product-category-filter><option value="">All categories</option><option value="hijabs">Hijabs</option><option value="accessories">Accessories</option></select></label><label class="admin-field"><span>Set stock for selected</span><input type="number" min="0" step="1" data-bulk-stock placeholder="New stock"></label><button class="admin-button admin-button--gold" type="button" data-bulk-stock-apply>Update stock</button></div>
      <form class="admin-product-form" data-product-form novalidate>
        <input name="id" type="hidden">
        <input name="variantsJson" type="hidden" value="[]">
        <label class="admin-field"><span>Title</span><input name="title" required maxlength="120"></label>
        <label class="admin-field"><span>Price (INR)</span><input name="price" type="number" min="0" step="0.01" required></label>
        <label class="admin-field"><span>Discount price (INR)</span><input name="discountPrice" type="number" min="0" step="0.01"></label>
        <label class="admin-field"><span>Category</span><select name="category" required><option value="">Choose category</option><option value="hijabs">Hijabs</option><option value="accessories">Accessories</option></select></label>
        <label class="admin-field"><span>Stock count</span><input name="stock" type="number" min="0" step="1" required></label>
        <label class="admin-field"><span>Image URL</span><input name="imageUrl" type="url" placeholder="https://…" inputmode="url"></label>
        <label class="admin-field"><span>Or upload image (5 MB max)</span><input name="imageFile" type="file" accept="image/*"></label>
        <fieldset class="admin-variant-manager"><legend>Variants</legend><div class="admin-variant-inputs"><label class="admin-field"><span>Color</span><input name="variantColor" placeholder="Espresso"></label><label class="admin-field"><span>Fabric type</span><input name="variantFabric" placeholder="Chiffon"></label><label class="admin-field"><span>Size</span><input name="variantSize" placeholder="Standard"></label><button class="admin-button admin-button--quiet" type="button" data-add-variant>Add variant</button></div><ul data-variant-list><li class="admin-empty">No variants added.</li></ul></fieldset>
        <div class="admin-image-preview" data-product-preview hidden></div>
        <p class="admin-feedback admin-product-form__feedback" data-product-feedback role="status" aria-live="polite"></p>
        <div class="admin-product-form__actions"><button class="admin-button admin-button--gold" type="submit">Save product</button><button class="admin-button admin-button--quiet" type="button" data-cancel-product>Clear form</button></div>
      </form>
      <div class="admin-list" data-products-list><p class="admin-empty">Loading products…</p></div>
    </section>
    <section class="admin-panel" data-admin-panel="orders" aria-labelledby="admin-orders-title" hidden>
      <div class="admin-panel__heading"><div><p class="eyebrow">Fulfilment</p><h2 id="admin-orders-title">Order &amp; fulfillment hub</h2></div><button class="admin-button admin-button--quiet" type="button" data-refresh-orders>Refresh</button></div>
      <div class="admin-order-pipeline" data-order-pipeline>${["Pending", "Paid", "Shipped", "Delivered"].map((lane) => `<section class="admin-order-lane" data-order-lane="${lane}"><header><h3>${lane}</h3><span data-lane-count="${lane}">0</span></header><div class="admin-order-lane__items" data-lane-items="${lane}"><p class="admin-empty">Loading…</p></div></section>`).join("")}</div>
    </section>
    <section class="admin-panel" data-admin-panel="customers" aria-labelledby="admin-customers-title" hidden><div class="admin-panel__heading"><div><p class="eyebrow">Relationships</p><h2 id="admin-customers-title">Customer CRM</h2></div><label class="admin-field"><span>Find customer</span><input type="search" data-customer-search placeholder="Name, email or ID"></label></div><div class="admin-customer-list" data-customers-list><p class="admin-empty">Loading customer accounts…</p></div></section>
    <section class="admin-panel" data-admin-panel="proofs" aria-labelledby="admin-proofs-title" hidden>
      <div class="admin-panel__heading"><div><p class="eyebrow">Customer stories</p><h2 id="admin-proofs-title">WhatsApp proof &amp; reviews</h2></div><button class="admin-button admin-button--quiet" type="button" data-refresh-proofs>Refresh queue</button></div>
      <p class="admin-panel__note">Upload only screenshots you have permission to publish. The server must remove sensitive personal details and approve each proof before it becomes public.</p>
      <form class="admin-proof-form" data-proof-form novalidate>
        <label class="admin-field"><span>Chat screenshot</span><input name="proofImage" type="file" accept="image/*" required></label>
        <div class="admin-image-preview" data-proof-preview hidden></div>
        <label class="admin-consent"><input name="permission" type="checkbox" required><span>I have permission to publish this customer conversation.</span></label>
        <p class="admin-feedback" data-proof-feedback role="status" aria-live="polite"></p>
        <button class="admin-button admin-button--gold" type="submit">Upload for review</button>
      </form>
      <div class="admin-proof-list" data-proofs-list><p class="admin-empty">Loading submissions…</p></div>
    </section>
    <dialog class="admin-invoice-dialog" data-invoice-dialog aria-labelledby="invoice-title"><div class="admin-invoice" data-invoice-content></div><footer><button class="admin-button admin-button--quiet" type="button" data-close-invoice>Close</button><button class="admin-button admin-button--gold" type="button" data-print-invoice>Print packing slip</button></footer></dialog>
  </div>`);
}

function setMessage(element, message) {
  if (element) element.textContent = message;
}

function setPreview(container, fileOrUrl, alt) {
  container.replaceChildren();
  container.hidden = !fileOrUrl;
  if (!fileOrUrl) return;
  const image = document.createElement("img");
  image.alt = alt;
  image.src = fileOrUrl instanceof File ? URL.createObjectURL(fileOrUrl) : fileOrUrl;
  container.append(image);
}

function slugify(value) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function AdminPortal() {
  const root = html('<div class="admin-portal"></div>');
  let admin = null;
  let products = [];
  let orders = [];
  let analyticsTimer = null;
  let analyticsRefresh = null;
  let analyticsVisibilityListener = null;

  const stopAnalytics = () => {
    clearInterval(analyticsTimer);
    analyticsTimer = null;
    analyticsRefresh = null;
  };

  const showGate = (message = "") => {
    root.replaceChildren(loginMarkup(message));
    const form = root.querySelector("[data-admin-login]");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
        setMessage(root.querySelector("[data-login-feedback]"), "Secure HTTPS is required for administrator sign-in.");
        return;
      }
      const submit = form.querySelector('[type="submit"]');
      const passcodeInput = form.elements.passcode;
      submit.disabled = true;
      setMessage(root.querySelector("[data-login-feedback]"), "Verifying with the server…");
      try {
        const result = await apiRequest(ADMIN_SESSION, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode: passcodeInput.value }),
        });
        if (result?.authenticated !== true) {
          setMessage(root.querySelector("[data-login-feedback]"), "Passcode was not accepted.");
          return;
        }
        admin = result.admin || {};
        showDashboard();
      } catch (error) {
        setMessage(root.querySelector("[data-login-feedback]"), error.status === 401 || error.status === 403 ? "Administrator credentials were not accepted." : "Admin authentication service is unavailable. Credentials were not saved.");
      } finally {
        passcodeInput.value = "";
        submit.disabled = false;
      }
    });
  };

  const loadProducts = async () => {
    const result = await apiRequest(PRODUCTS_URL);
    products = listFrom(result, "products");
  };

  const loadOrders = async () => {
    const result = await apiRequest(ORDERS_URL);
    orders = listFrom(result, "orders");
  };

  const loadCustomers = async () => {
    const result = await apiRequest(CUSTOMERS_URL);
    return listFrom(result, "customers");
  };

  const loadProofs = async () => {
    const result = await apiRequest(PROOFS_URL);
    return listFrom(result, "proofs");
  };

  const showDashboard = () => {
    stopAnalytics();
    root.replaceChildren(dashboardMarkup(admin));
    const dashboard = root.querySelector(".admin-dashboard");
    const productForm = root.querySelector("[data-product-form]");
    const productFeedback = root.querySelector("[data-product-feedback]");
    const productPreview = root.querySelector("[data-product-preview]");
    const proofForm = root.querySelector("[data-proof-form]");
    const proofPreview = root.querySelector("[data-proof-preview]");
    const variantList = root.querySelector("[data-variant-list]");
    let customers = [];
    let proofs = [];
    let variants = [];
    let productImageUrl = "";
    let proofImageUrl = "";

    const renderVariants = () => {
      productForm.elements.variantsJson.value = JSON.stringify(variants);
      variantList.replaceChildren(...(variants.length ? variants.map((variant, index) => {
        const row = document.createElement("li");
        row.className = "admin-variant-row";
        const text = document.createElement("span");
        text.textContent = [variant.color, variant.fabricType, variant.size].join(" · ");
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "admin-button admin-button--danger";
        remove.dataset.removeVariant = String(index);
        remove.textContent = "Remove";
        row.append(text, remove);
        return row;
      }) : [Object.assign(document.createElement("li"), { className: "admin-empty", textContent: "No variants added." })]));
    };

    const renderProducts = () => {
      const query = root.querySelector("[data-product-search]").value.trim().toLowerCase();
      const category = root.querySelector("[data-product-category-filter]").value;
      const filtered = products.filter((product) => {
        const title = String(product.name || product.title || "").toLowerCase();
        return (!query || title.includes(query) || String(product.category).toLowerCase().includes(query)) && (!category || product.category === category);
      });
      const list = root.querySelector("[data-products-list]");
      list.innerHTML = filtered.length ? filtered.map(productCard).join("") : '<p class="admin-empty">No products match these filters.</p>';
    };

    const renderOrders = () => {
      for (const lane of ["Pending", "Paid", "Shipped", "Delivered"]) {
        const matches = orders.filter((order) => orderLane(order) === lane);
        root.querySelector(`[data-lane-count="${lane}"]`).textContent = String(matches.length);
        const column = root.querySelector(`[data-lane-items="${lane}"]`);
        column.replaceChildren(...(matches.length ? matches.map((order) => html(orderCard(order))) : [Object.assign(document.createElement("p"), { className: "admin-empty", textContent: "No orders" })]));
      }
    };

    const renderCustomers = () => {
      const query = root.querySelector("[data-customer-search]").value.trim().toLowerCase();
      const matches = customers.filter((customer) => `${customer.name} ${customer.email} ${customer.google_id}`.toLowerCase().includes(query));
      const list = root.querySelector("[data-customers-list]");
      list.replaceChildren(...(matches.length ? matches.map((customer) => html(customerCard(customer))) : [Object.assign(document.createElement("p"), { className: "admin-empty", textContent: "No matching customers." })]));
    };

    const renderProofs = () => {
      const list = root.querySelector("[data-proofs-list]");
      list.replaceChildren(...(proofs.length ? proofs.map((proof) => html(proofCard(proof))) : [Object.assign(document.createElement("p"), { className: "admin-empty", textContent: "No proof submissions." })]));
    };

    const refreshProducts = async () => { await loadProducts(); renderProducts(); };
    const refreshOrders = async () => { await loadOrders(); renderOrders(); };
    const refreshCustomers = async () => { customers = await loadCustomers(); renderCustomers(); };
    const refreshProofs = async () => { proofs = await loadProofs(); renderProofs(); };

    let analyticsLoading = false;
    analyticsRefresh = async () => {
      const route = location.hash.slice(2).split("?", 1)[0];
      if (!admin || document.hidden || !["admin-portal", "admin-login"].includes(route) || !dashboard.isConnected || analyticsLoading) return;
      analyticsLoading = true;
      try {
        const data = await apiRequest(ANALYTICS_URL);
        if (dashboard.isConnected) renderAnalytics(root, data || {});
      } catch (error) {
        if (!dashboard.isConnected) return;
        if (error.status === 401 || error.status === 403) {
          stopAnalytics();
          admin = null;
          showGate("Admin session expired. Sign in again to continue.");
          return;
        }
        clearAnalytics(root);
        setMessage(root.querySelector("[data-analytics-feedback]"), "Analytics service is unavailable. Live counts require the analytics backend.");
      } finally {
        analyticsLoading = false;
      }
    };
    analyticsRefresh();
    analyticsTimer = setInterval(() => analyticsRefresh?.(), 10_000);
    if (!analyticsVisibilityListener) {
      analyticsVisibilityListener = () => { if (!document.hidden) analyticsRefresh?.(); };
      document.addEventListener("visibilitychange", analyticsVisibilityListener);
    }

    root.querySelectorAll("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => {
      root.querySelectorAll("[data-admin-tab]").forEach((tab) => tab.setAttribute("aria-pressed", String(tab === button)));
      root.querySelectorAll("[data-admin-panel]").forEach((panel) => { panel.hidden = panel.dataset.adminPanel !== button.dataset.adminTab; });
    }));

    root.querySelector("[data-admin-logout]").addEventListener("click", async () => {
      stopAnalytics();
      try { await apiRequest(ADMIN_SESSION, { method: "DELETE" }); } catch {}
      admin = null;
      showGate("You have signed out.");
    });

    const resetProductForm = () => {
      productForm.reset();
      productForm.elements.id.value = "";
      variants = [];
      renderVariants();
      productImageUrl = "";
      productPreview.replaceChildren();
      productPreview.hidden = true;
      setMessage(productFeedback, "");
      productForm.querySelector('[type="submit"]').textContent = "Save product";
    };
    root.querySelector("[data-new-product]").addEventListener("click", () => {
      resetProductForm();
      productForm.elements.title.focus();
    });
    root.querySelector("[data-cancel-product]").addEventListener("click", resetProductForm);
    root.querySelector("[data-add-variant]").addEventListener("click", () => {
      const color = productForm.elements.variantColor.value.trim();
      const fabricType = productForm.elements.variantFabric.value.trim();
      const size = productForm.elements.variantSize.value.trim();
      if (!color || !fabricType || !size) {
        setMessage(productFeedback, "Enter a color, fabric type, and size to add a variant.");
        return;
      }
      variants.push({ color, fabricType, size });
      productForm.elements.variantColor.value = "";
      productForm.elements.variantFabric.value = "";
      productForm.elements.variantSize.value = "";
      setMessage(productFeedback, "");
      renderVariants();
    });
    root.querySelector("[data-product-search]").addEventListener("input", renderProducts);
    root.querySelector("[data-product-category-filter]").addEventListener("change", renderProducts);
    root.querySelector("[data-customer-search]").addEventListener("input", renderCustomers);

    root.querySelector("[data-bulk-stock-apply]").addEventListener("click", async (event) => {
      const selected = [...root.querySelectorAll("[data-product-select]:checked")].map((input) => input.dataset.productSelect);
      const stock = Number(root.querySelector("[data-bulk-stock]").value);
      const feedback = root.querySelector("[data-dashboard-feedback]");
      if (!selected.length || !Number.isSafeInteger(stock) || stock < 0) {
        setMessage(feedback, "Select products and enter a non-negative whole-number stock value.");
        return;
      }
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await apiRequest(PRODUCTS_URL, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates: selected.map((id) => ({ id, stock })) }) });
        await refreshProducts();
        root.querySelector("[data-bulk-stock]").value = "";
        setMessage(feedback, `Stock updated for ${selected.length} product${selected.length === 1 ? "" : "s"}.`);
      } catch {
        setMessage(feedback, "Bulk stock update failed. Reload inventory and try again.");
      } finally {
        button.disabled = false;
      }
    });

    const productImageInput = productForm.elements.imageFile;
    const imageUrlInput = productForm.elements.imageUrl;
    productImageInput.addEventListener("change", () => {
      const file = productImageInput.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
        productImageInput.value = "";
        setMessage(productFeedback, "Choose an image smaller than 5 MB.");
        return;
      }
      productImageUrl = URL.createObjectURL(file);
      setPreview(productPreview, file, "Product image preview");
    });
    imageUrlInput.addEventListener("input", () => {
      if (productImageInput.files.length) return;
      const value = imageUrlInput.value.trim();
      if (!value) {
        productImageUrl = "";
        setPreview(productPreview, "", "Product image preview");
        return;
      }
      try {
        const imageUrl = new URL(value, location.origin);
        if (!["http:", "https:"].includes(imageUrl.protocol)) throw new Error();
        productImageUrl = imageUrl.href;
        setPreview(productPreview, productImageUrl, "Product image preview");
      } catch {
        productImageUrl = "";
        setPreview(productPreview, "", "Product image preview");
      }
    });

    productForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!productForm.reportValidity()) return;
      const values = Object.fromEntries(new FormData(productForm).entries());
      const regularPrice = Number(values.price);
      const discountPrice = values.discountPrice === "" ? regularPrice : Number(values.discountPrice);
      const stock = Number(values.stock);
      if (!Number.isFinite(regularPrice) || !Number.isFinite(discountPrice) || discountPrice > regularPrice || !Number.isInteger(stock) || stock < 0) {
        setMessage(productFeedback, "Discount price must not exceed the regular price; stock must be a whole number.");
        return;
      }
      const title = values.title.trim();
      const product = {
        name: title,
        slug: slugify(title),
        price: discountPrice,
        compareAtPrice: discountPrice < regularPrice ? regularPrice : null,
        category: values.category,
        stock,
        active: true,
        images: productImageUrl && !productImageInput.files.length ? [{ src: productImageUrl, alt: title }] : [],
        variants,
      };
      const file = productImageInput.files[0];
      const options = file
        ? (() => { const body = new FormData(); body.set("product", JSON.stringify(product)); body.set("image", file); return { method: values.id ? "PUT" : "POST", body }; })()
        : { method: values.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(product) };
      const url = values.id ? `${PRODUCTS_URL}?id=${encodeURIComponent(values.id)}` : PRODUCTS_URL;
      const saveButton = productForm.querySelector('[type="submit"]');
      saveButton.disabled = true;
      setMessage(productFeedback, "Saving through the admin service…");
      try {
        await apiRequest(url, options);
        resetProductForm();
        setMessage(productFeedback, "Product saved.");
        await refreshProducts();
      } catch {
        setMessage(productFeedback, "Product service is unavailable. No local-only change was published.");
      } finally {
        saveButton.disabled = false;
      }
    });

    root.querySelector("[data-refresh-orders]").addEventListener("click", () => refreshOrders().catch(() => setMessage(root.querySelector("[data-dashboard-feedback]"), "Order service is unavailable.")));
    root.querySelector("[data-refresh-proofs]").addEventListener("click", () => refreshProofs().catch(() => setMessage(root.querySelector("[data-dashboard-feedback]"), "Proof review service is unavailable.")));
    root.querySelector("[data-close-invoice]").addEventListener("click", () => root.querySelector("[data-invoice-dialog]").close());
    root.querySelector("[data-invoice-dialog]").addEventListener("click", (event) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    });
    root.querySelector("[data-print-invoice]").addEventListener("click", () => window.print());
    root.querySelector("[data-variant-list]").addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove-variant]");
      if (!remove) return;
      variants.splice(Number(remove.dataset.removeVariant), 1);
      renderVariants();
    });

    const selectTab = (name) => root.querySelector(`[data-admin-tab="${name}"]`)?.click();
    root.addEventListener("click", async (event) => {
      const edit = event.target.closest("[data-edit-product]");
      if (edit) {
        const product = products.find((item) => String(item.id) === edit.dataset.editProduct);
        if (!product) return;
        productForm.elements.id.value = product.id;
        productForm.elements.title.value = product.name || product.title || "";
        productForm.elements.price.value = product.compareAtPrice ?? product.price ?? "";
        productForm.elements.discountPrice.value = product.compareAtPrice ? product.price : "";
        productForm.elements.category.value = product.category || "";
        productForm.elements.stock.value = product.stock ?? 0;
        variants = Array.isArray(product.variants) ? product.variants.map((variant) => ({ color: variant.color || "", fabricType: variant.fabricType || "", size: variant.size || "" })) : [];
        renderVariants();
        productImageUrl = product.images?.[0]?.src || "";
        productForm.elements.imageUrl.value = productImageUrl;
        setPreview(productPreview, productImageUrl, "Product image preview");
        productForm.querySelector('[type="submit"]').textContent = "Update product";
        selectTab("products");
        productForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const remove = event.target.closest("[data-delete-product]");
      if (remove && confirm("Delete this product from the catalogue?")) {
        try {
          await apiRequest(`${PRODUCTS_URL}?id=${encodeURIComponent(remove.dataset.deleteProduct)}`, { method: "DELETE" });
          await refreshProducts();
          setMessage(root.querySelector("[data-dashboard-feedback]"), "Product deleted.");
        } catch {
          setMessage(root.querySelector("[data-dashboard-feedback]"), "Product service is unavailable. Nothing was deleted.");
        }
      }
      const advance = event.target.closest("[data-advance-order]");
      if (advance) {
        advance.disabled = true;
        try {
          await apiRequest(`${ORDERS_URL}?id=${encodeURIComponent(advance.dataset.advanceOrder)}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: advance.dataset.nextStatus }),
          });
          await refreshOrders();
          setMessage(root.querySelector("[data-dashboard-feedback]"), "Order status updated.");
        } catch {
          setMessage(root.querySelector("[data-dashboard-feedback]"), "Order service is unavailable. Status was not changed.");
        }
      }
      const issueStamp = event.target.closest("[data-issue-stamp]");
      if (issueStamp) {
        issueStamp.disabled = true;
        try {
          await apiRequest(`${ORDERS_URL}?id=${encodeURIComponent(issueStamp.dataset.issueStamp)}&action=loyalty-stamp`, { method: "POST" });
          setMessage(root.querySelector("[data-dashboard-feedback]"), "Loyalty stamp recorded by the server.");
          await refreshOrders();
        } catch {
          setMessage(root.querySelector("[data-dashboard-feedback]"), "Loyalty service is unavailable. No stamp was issued.");
        }
      }
      const printOrder = event.target.closest("[data-print-order]");
      if (printOrder) {
        const order = orders.find((item) => String(item.id || item.orderNumber) === printOrder.dataset.printOrder);
        if (!order) return;
        root.querySelector("[data-invoice-content]").replaceChildren(printableInvoice(order));
        root.querySelector("[data-invoice-dialog]").showModal();
      }
      const proofAction = event.target.closest("[data-review-proof]");
      const rejectProof = event.target.closest("[data-reject-proof]");
      if (proofAction || rejectProof) {
        const button = proofAction || rejectProof;
        button.disabled = true;
        const id = button.dataset.reviewProof || button.dataset.rejectProof;
        try {
          await apiRequest(`${PROOFS_URL}?id=${encodeURIComponent(id)}`, proofAction
            ? { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified: button.dataset.verified === "true" }) }
            : { method: "DELETE" });
          await refreshProofs();
          setMessage(root.querySelector("[data-dashboard-feedback]"), proofAction?.dataset.verified === "true" ? "Proof approved and published." : proofAction ? "Proof unpublished." : "Proof rejected.");
        } catch {
          setMessage(root.querySelector("[data-dashboard-feedback]"), "Proof moderation failed. No publishing change was made.");
        }
      }
    });

    const proofInput = proofForm.elements.proofImage;
    proofInput.addEventListener("change", () => {
      const file = proofInput.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
        proofInput.value = "";
        setMessage(root.querySelector("[data-proof-feedback]"), "Choose an image smaller than 5 MB.");
        return;
      }
      proofImageUrl = URL.createObjectURL(file);
      setPreview(proofPreview, file, "WhatsApp screenshot preview");
    });
    proofForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!proofForm.reportValidity()) return;
      const file = proofInput.files[0];
      if (!file) return;
      const body = new FormData();
      body.set("image", file);
      body.set("permission", proofForm.elements.permission.checked ? "on" : "off");
      const button = proofForm.querySelector('[type="submit"]');
      button.disabled = true;
      setMessage(root.querySelector("[data-proof-feedback]"), "Uploading for server review…");
      try {
        await apiRequest(PROOFS_URL, { method: "POST", body });
        proofForm.reset();
        proofImageUrl = "";
        setPreview(proofPreview, "", "WhatsApp screenshot preview");
        setMessage(root.querySelector("[data-proof-feedback]"), "Screenshot submitted. It will appear publicly only after server verification.");
      } catch {
        setMessage(root.querySelector("[data-proof-feedback]"), "Proof gallery service is unavailable. The image was not published.");
      } finally {
        button.disabled = false;
      }
    });

    renderVariants();
    Promise.all([refreshProducts(), refreshOrders()]).catch(() => {
      setMessage(root.querySelector("[data-dashboard-feedback]"), "Some inventory/order data could not be loaded from the admin service.");
    });
    root.querySelectorAll("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => {
      const loadByTab = { customers: refreshCustomers, proofs: refreshProofs };
      const loader = loadByTab[button.dataset.adminTab];
      if (loader) loader().catch(() => setMessage(root.querySelector("[data-dashboard-feedback]"), `${button.textContent} data is unavailable.`));
    }));
  };

  showGate();
  const checkSession = () => {
    const route = location.hash.slice(2).split("?", 1)[0];
    if (!["admin-portal", "admin-login"].includes(route)) {
      stopAnalytics();
      return;
    }
    if (admin) {
      if (analyticsRefresh) analyticsRefresh();
      else showDashboard();
      return;
    }
    apiRequest(ADMIN_SESSION).then((result) => {
      if (result?.authenticated === true) {
        admin = result.admin || {};
        showDashboard();
      }
    }).catch((error) => {
      if (error.status !== 401 && error.status !== 403) setMessage(root.querySelector("[data-login-feedback]"), "Secure admin authentication is not connected yet.");
    });
  };
  window.addEventListener("hashchange", checkSession);
  checkSession();

  return root;
}
