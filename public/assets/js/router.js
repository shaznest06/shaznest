const routeViews = [...document.querySelectorAll("[data-route-view]")];
const routeNames = new Set(["", "shop", "track", "account", "admin-portal", "admin-login", "checkout", "reviews"]);
const adminRoutes = new Set(["admin-portal", "admin-login"]);

function renderRoute() {
  const hash = window.location.hash;
  const routeHash = hash.startsWith("#/");
  const [path = "", query = ""] = routeHash ? hash.slice(2).split("?", 2) : [""];
  const route = routeNames.has(path) ? path : "";
  const viewName = adminRoutes.has(route) ? "admin" : ["account", "checkout", "reviews"].includes(route) ? route : "home";

  routeViews.forEach((view) => {
    const active = view.id === `view-${viewName}`;
    view.hidden = !active;
    view.setAttribute("aria-hidden", String(!active));
    view.classList.toggle("is-active", active);
    if (view.id === "view-admin") {
      if (active && adminRoutes.has(route)) view.setAttribute("data-admin-route-active", "true");
      else view.removeAttribute("data-admin-route-active");
    }
  });

  document.querySelectorAll("[data-route-link]").forEach((link) => {
    const current = link.getAttribute("href") === hash || (!routeHash && link.getAttribute("href") === "#/");
    if (current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  if (route === "shop") {
    const category = new URLSearchParams(query).get("category");
    const filter = [...document.querySelectorAll("#shop-filters [data-category]")]
      .find((button) => button.dataset.category === (category || ""));
    if (filter && filter.getAttribute("aria-pressed") !== "true") filter.click();
  }

  if (route === "shop" || route === "track") {
    const target = document.getElementById(route === "track" ? "track" : "shop");
    target?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  } else if (routeHash) {
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("popstate", renderRoute);
window.addEventListener("DOMContentLoaded", renderRoute, { once: true });