import { setQuantity, removeItem } from "../cart.js";
import { esc, formatPrice, html } from "../utils.js";
import { QuantitySelector } from "./QuantitySelector.js";

/** CartItem({ item }) → <li> with quantity controls and remove. */
export function CartItem({ item }) {
  const url = `/products/${encodeURIComponent(item.slug)}`;
  const el = html(`
    <li class="cart-item">
      <a class="cart-item__media" href="${url}" tabindex="-1" aria-hidden="true">
        ${item.image ? `<img src="${esc(item.image)}" alt="" loading="lazy">` : `<span class="media-fallback">${esc(item.name.charAt(0))}</span>`}
      </a>
      <div class="cart-item__info">
        <a class="cart-item__name" href="${url}">${esc(item.name)}</a>
        ${item.colour ? `<p class="cart-item__meta">${esc(item.colour)}</p>` : ""}
        <div class="cart-item__actions"></div>
      </div>
      <div class="cart-item__end">
        <p class="cart-item__price">${formatPrice(item.price * item.quantity)}</p>
        <button type="button" class="link-btn" data-remove>Remove<span class="visually-hidden"> ${esc(item.name)}</span></button>
      </div>
    </li>`);

  el.querySelector(".cart-item__actions").append(
    QuantitySelector({
      value: item.quantity,
      min: 1,
      max: item.maxQuantity || Infinity,
      compact: true,
      label: `Quantity for ${item.name}`,
      onChange: (n) => setQuantity(item.key, n),
    })
  );
  el.querySelector("[data-remove]").addEventListener("click", () => removeItem(item.key));
  return el;
}
