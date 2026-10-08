// Cart state, persisted in localStorage. Later this can sync with a server-side cart.
const STORAGE_KEY = "sn_cart_v2";
const LEGACY_KEY = "sn_cart"; // held placeholder products from the preview site

let items = load();
const listeners = new Set();

function load() {
  try {
    localStorage.removeItem(LEGACY_KEY);
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function commit() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((fn) => fn(getItems()));
}

const lineKey = (productId, colour) => `${productId}::${colour || ""}`;

export const getItems = () => items.map((i) => ({ ...i }));
export const getCount = () => items.reduce((n, i) => n + i.quantity, 0);
export const getSubtotal = () => items.reduce((n, i) => n + i.quantity * i.price, 0);

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addItem(product, { colour = null, quantity = 1, image = null } = {}) {
  if (product.stock <= 0) return;
  const key = lineKey(product.id, colour);
  const existing = items.find((i) => i.key === key);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, product.stock);
    existing.maxQuantity = product.stock;
  } else {
    items.push({
      key,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      colour,
      image,
      quantity: Math.min(quantity, product.stock),
      maxQuantity: product.stock,
    });
  }
  commit();
}

export function setQuantity(key, quantity) {
  const item = items.find((i) => i.key === key);
  if (!item) return;
  if (quantity <= 0) return removeItem(key);
  item.quantity = Math.min(quantity, item.maxQuantity || quantity);
  commit();
}

export function removeItem(key) {
  items = items.filter((i) => i.key !== key);
  commit();
}

export function clear() {
  items = [];
  commit();
}

// Re-check saved cart lines against the current catalogue: drop products that
// no longer exist or are sold out, and refresh names, prices and stock limits.
export function reconcile(products) {
  const byId = new Map(products.map((p) => [p.id, p]));
  items = items
    .filter((i) => byId.get(i.productId)?.stock > 0)
    .map((i) => {
      const p = byId.get(i.productId);
      return { ...i, name: p.name, slug: p.slug, price: p.price, maxQuantity: p.stock, quantity: Math.min(i.quantity, p.stock) };
    });
  commit();
}
