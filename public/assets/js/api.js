// Single place the frontend talks to the backend. Swap endpoints in config.js.
import { CONFIG } from "./config.js";
import { normalizeProduct } from "./product-model.js";

let productsRequest = null;

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { headers: { Accept: "application/json", ...options.headers }, ...options });
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** All active products. Accepts either an array or { products: [...] } from the API. */
export async function getProducts({ category, featured } = {}) {
  productsRequest ??= fetchJson(CONFIG.api.products)
    .then((data) => (Array.isArray(data) ? data : data?.products || []))
    .then((list) => list.map(normalizeProduct).filter((p) => p && p.active))
    .catch((err) => {
      productsRequest = null;
      throw err;
    });

  let products = await productsRequest;
  if (category) products = products.filter((p) => p.category === category);
  if (featured) products = products.filter((p) => p.featured);
  return products;
}

/** Later: GET /api/v1/products/{slug} */
export async function getProductBySlug(slug) {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) || null;
}

/**
 * Later: POST /api/v1/orders → returns the Razorpay order to open checkout with.
 * Returns { status: "unavailable" } while online payment is not integrated.
 */
export async function createOrder(payload) {
  if (!CONFIG.features.onlinePayment) return { status: "unavailable" };
  const order = await fetchJson(CONFIG.api.createOrder, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: "created", order };
}

/**
 * GET /api/v1/orders/{orderNumber}/tracking
 * Expected response:
 * { orderNumber, status, updatedAt, events: [{ status, description, location, timestamp }] }
 */
export async function getOrderTracking(orderNumber) {
  if (!CONFIG.features.orderTracking) return { status: "unavailable" };
  try {
    const tracking = await fetchJson(CONFIG.api.orderTracking(orderNumber));
    return { status: "ok", tracking };
  } catch (err) {
    if (err.status === 404) return { status: "not_found" };
    throw err;
  }
}
