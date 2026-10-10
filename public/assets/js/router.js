// Hash router for the single-page storefront (index.html).
// The page already contains every view; this only shows the right one.
const VIEWS = {
  account: "view-account",
  checkout: "view-checkout",
  reviews: "view-reviews",
  "admin-portal": "view-admin",
  "admin-login": "view-admin",
  admin: "view-admin",
};
const HOME = "view-home";
const SCROLL_TARGETS = { shop: "shop", track: "track" };
const CATEGORIES = ["hijabs", "accessories"];

const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  return { path, params: new URLSearchParams(query) };
}

function showView(id) {
  document.querySelectorAll("[data-route-view]").forEach((view) => {
    const active = view.id === id;
    view.hidden = !active;
    view.setAttribute("aria-hidden", String(!active));
    view.classList.toggle("is-active", active);
  });
}

function handleRoute() {
  const { path, params } = parseHash();
  const viewId = VIEWS[path] || HOME;
  showView(viewId);

  if (viewId !== HOME) {
    window.scrollTo(0, 0);
    return;
  }

  const category = params.get("category");
  window.dispatchEvent(new CustomEvent("shaz:filter-category", {
    detail: { category: CATEGORIES.includes(category) ? category : null },
  }));

  const target = SCROLL_TARGETS[path];
  if (target) {
    document.getElementById(target)?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });
  } else if (!path || path === "") {
    // "#/" or empty hash: top of the page. Plain in-page anchors (#shop, #track) scroll natively.
    if (location.hash === "#/" || location.hash === "") window.scrollTo(0, 0);
  }
}

window.addEventListener("hashchange", handleRoute);
handleRoute();
