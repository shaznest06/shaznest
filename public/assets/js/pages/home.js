import { CATEGORIES, CONFIG } from "../config.js";
import { getProducts } from "../api.js";
import { reconcile } from "../cart.js";
import { mountCartDrawer } from "../components/CartDrawer.js";
import { ProductGrid } from "../components/ProductGrid.js";
import { OrderTracking } from "../components/OrderTracking.js";
import { CustomerPortal } from "../components/CustomerPortal.js";
import { ReviewGallery } from "../components/ReviewGallery.js";
import { Checkout } from "../components/Checkout.js";
import { AdminPortal } from "../components/AdminPortal.js";
import { AIChatbot } from "../components/AIChatbot.js";

mountCartDrawer();
document.getElementById("tracking-root").append(OrderTracking());
document.getElementById("view-account").replaceChildren(CustomerPortal());
document.getElementById("view-reviews").replaceChildren(ReviewGallery());
document.getElementById("view-checkout").replaceChildren(Checkout());
document.getElementById("view-admin").replaceChildren(AdminPortal());
document.getElementById("view-home").append(AIChatbot());

const shopRoot = document.getElementById("shop-root");
const featuredSection = document.getElementById("featured");
const filters = document.getElementById("shop-filters");

const emptyMessage = (category) => {
  const label = CATEGORIES.find((c) => c.slug === category)?.name.toLowerCase() || "collection";
  return `<p class="empty-state__title">Our ${label} are coming to the website soon.</p>
    <p>Follow <a href="${CONFIG.instagram.url}" target="_blank" rel="noopener">${CONFIG.instagram.handle}</a> on Instagram to see new pieces first.</p>`;
};

let activeCategory = new URLSearchParams(location.search).get("category");
if (!CATEGORIES.some((c) => c.slug === activeCategory)) activeCategory = null;

function renderFilters() {
  filters.querySelectorAll("[data-category]").forEach((b) => {
    b.setAttribute("aria-pressed", String((b.dataset.category || null) === activeCategory));
  });
}

async function renderShop() {
  renderFilters();
  shopRoot.replaceChildren(ProductGrid.loading());
  try {
    const products = await getProducts({ category: activeCategory || undefined });
    shopRoot.replaceChildren(ProductGrid({ products, emptyMessage: emptyMessage(activeCategory) }));
  } catch {
    shopRoot.innerHTML = `<div class="empty-state"><p>We couldn't load the collection. Please refresh the page to try again.</p></div>`;
  }
}

filters.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-category]");
  if (!btn) return;
  activeCategory = btn.dataset.category || null;
  const route = activeCategory ? `#/shop?category=${encodeURIComponent(activeCategory)}` : "#/shop";
  history.replaceState(null, "", route);
  renderShop();
});

// Category tiles filter the shop in place instead of reloading the page.
document.querySelectorAll("[data-category-link]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    filters.querySelector(`[data-category="${a.dataset.categoryLink}"]`)?.click();
    document.getElementById("shop").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  })
);

async function renderFeatured() {
  try {
    const featured = await getProducts({ featured: true });
    if (!featured.length) return;
    document.getElementById("featured-root").replaceChildren(ProductGrid({ products: featured.slice(0, 4) }));
    featuredSection.hidden = false;
  } catch {}
}

renderShop();
renderFeatured();
getProducts().then(reconcile).catch(() => {});
