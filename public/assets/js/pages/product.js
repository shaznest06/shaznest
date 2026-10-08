import { CONFIG } from "../config.js";
import { getProductBySlug, getProducts } from "../api.js";
import { reconcile } from "../cart.js";
import { isInStock, productUrl } from "../product-model.js";
import { mountCartDrawer } from "../components/CartDrawer.js";
import { ProductDetails } from "../components/ProductDetails.js";

mountCartDrawer();

const root = document.getElementById("product-root");

// Supports /products/<slug> (via _redirects) and /product?slug=<slug>.
function currentSlug() {
  const match = location.pathname.match(/^\/products\/([^/]+)\/?$/);
  if (match) return decodeURIComponent(match[1]);
  return new URLSearchParams(location.search).get("slug");
}

function setMeta(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function applySeo(product) {
  const url = CONFIG.siteUrl + productUrl(product);
  const title = `${product.name} | ${CONFIG.brand}`;
  const description = (product.description || `Shop ${product.name} from ${CONFIG.brand}.`).replace(/\s+/g, " ").slice(0, 160);
  const image = product.images[0] ? new URL(product.images[0].src, CONFIG.siteUrl).href : null;

  document.title = title;
  setMeta('meta[name="description"]', "content", description);
  setMeta('link[rel="canonical"]', "href", url);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[property="og:type"]', "content", "product");
  if (image) setMeta('meta[property="og:image"]', "content", image);
  setMeta('meta[name="robots"]', "content", "index,follow");

  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images.map((i) => new URL(i.src, CONFIG.siteUrl).href),
    brand: { "@type": "Brand", name: CONFIG.brand },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: product.price,
      availability: isInStock(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  });
  document.head.append(ld);
}

function notFound() {
  document.title = `Product not found | ${CONFIG.brand}`;
  root.innerHTML = `
    <div class="empty-state">
      <p class="empty-state__title">This product isn't available.</p>
      <p>It may have been removed or the link may be incorrect.</p>
      <a class="btn btn--ghost" href="/#shop">Browse the collection</a>
    </div>`;
}

async function init() {
  const slug = currentSlug();
  if (!slug) return notFound();
  try {
    const product = await getProductBySlug(slug);
    if (!product) return notFound();
    applySeo(product);
    root.replaceChildren(ProductDetails({ product }));
    reconcile(await getProducts());
  } catch {
    root.innerHTML = `<div class="empty-state"><p>We couldn't load this product. Please refresh the page to try again.</p></div>`;
  }
}

init();
