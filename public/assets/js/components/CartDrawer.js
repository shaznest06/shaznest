import { getCount, getItems, getSubtotal, subscribe } from "../cart.js";
import { formatPrice, html } from "../utils.js";
import { CartItem } from "./CartItem.js";
import { CheckoutForm } from "./CheckoutForm.js";

let drawer = null;
let lastFocus = null;
let hideTimer = null;

/** Opens the cart drawer (mounting it on first use). */
export function openCart() {
  mountCartDrawer();
  clearTimeout(hideTimer);
  lastFocus = document.activeElement;
  drawer.root.hidden = false;
  requestAnimationFrame(() => drawer.root.classList.add("is-open"));
  document.body.classList.add("no-scroll");
  drawer.panel.focus();
}

export function closeCart() {
  if (!drawer) return;
  drawer.root.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  const done = () => (drawer.root.hidden = true);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) done();
  else hideTimer = setTimeout(done, 250);
  lastFocus?.focus?.();
}

/**
 * Mounts the cart drawer once per page and keeps every [data-cart-count] in sync.
 * Any element with [data-open-cart] opens it.
 */
export function mountCartDrawer() {
  if (drawer) return drawer;

  const root = html(`
    <div class="drawer" hidden>
      <div class="drawer__overlay" data-close></div>
      <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1">
        <header class="drawer__head">
          <h2 id="cart-title" class="drawer__title">Your cart</h2>
          <button type="button" class="link-btn" data-close>Close</button>
        </header>
        <div class="drawer__body">
          <div data-view="cart">
            <ul class="cart-list" role="list"></ul>
            <div class="cart-empty" hidden>
              <p>Your cart is empty.</p>
              <a class="btn btn--ghost" href="/#shop" data-close>Browse the collection</a>
            </div>
          </div>
          <div data-view="checkout" hidden></div>
        </div>
        <footer class="drawer__foot">
          <p class="drawer__total"><span>Subtotal</span><span data-subtotal></span></p>
          <p class="note">Delivery charges, if any, are confirmed at payment.</p>
          <button type="button" class="btn btn--primary btn--block" data-to-checkout>Continue to checkout</button>
        </footer>
      </aside>
    </div>`);
  document.body.append(root);

  const panel = root.querySelector(".drawer__panel");
  const list = root.querySelector(".cart-list");
  const empty = root.querySelector(".cart-empty");
  const cartView = root.querySelector('[data-view="cart"]');
  const checkoutView = root.querySelector('[data-view="checkout"]');
  const foot = root.querySelector(".drawer__foot");
  const toCheckout = root.querySelector("[data-to-checkout]");

  const showView = (view) => {
    cartView.hidden = view !== "cart";
    checkoutView.hidden = view !== "checkout";
    toCheckout.hidden = view !== "cart";
    root.querySelector("#cart-title").textContent = view === "cart" ? "Your cart" : "Checkout";
    panel.querySelector(".drawer__body").scrollTop = 0;
  };

  checkoutView.append(CheckoutForm({ getItems, onBack: () => showView("cart") }));
  toCheckout.addEventListener("click", () => showView("checkout"));

  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeCart();
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });

  const render = () => {
    const items = getItems();
    list.replaceChildren(...items.map((item) => CartItem({ item })));
    empty.hidden = items.length > 0;
    foot.hidden = items.length === 0;
    if (!items.length) showView("cart");
    root.querySelector("[data-subtotal]").textContent = formatPrice(getSubtotal());
    document.querySelectorAll("[data-cart-count]").forEach((n) => (n.textContent = getCount()));
  };

  subscribe(render);
  render();
  showView("cart");

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-cart]")) openCart();
  });

  drawer = { root, panel };
  return drawer;
}
