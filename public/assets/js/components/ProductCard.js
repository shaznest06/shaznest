import { categoryName } from "../config.js";
import { addItem } from "../cart.js";
import { imageForColour, isInStock, productUrl } from "../product-model.js";
import { esc, formatPrice, html } from "../utils.js";
import { ColourSelector } from "./ColourSelector.js";
import { openCart } from "./CartDrawer.js";

export function priceMarkup(product) {
  return `<span class="price">${formatPrice(product.price)}</span>${
    product.compareAtPrice ? ` <s class="price price--compare"><span class="visually-hidden">Original price </span>${formatPrice(product.compareAtPrice)}</s>` : ""
  }`;
}

export function mediaMarkup(product, image, { eager = false } = {}) {
  return image
    ? `<img src="${esc(image.src)}" alt="${esc(image.alt)}" ${eager ? "" : 'loading="lazy"'} decoding="async">`
    : `<span class="media-fallback" aria-hidden="true">${esc(product.name.charAt(0))}</span>`;
}

/** ProductCard({ product }) → <li> for use inside ProductGrid. */
export function ProductCard({ product }) {
  const url = productUrl(product);
  const inStock = isInStock(product);
  let colour = product.availableColours[0]?.name ?? null;

  const el = html(`
    <li class="product-card">
      <a class="product-card__media" href="${url}" tabindex="-1" aria-hidden="true">
        ${mediaMarkup(product, imageForColour(product, colour))}
        ${inStock ? "" : '<span class="tag">Sold out</span>'}
      </a>
      <div class="product-card__body">
        <p class="eyebrow">${esc(categoryName(product.category))}</p>
        <h3 class="product-card__title"><a href="${url}">${esc(product.name)}</a></h3>
        <p class="product-card__price">${priceMarkup(product)}</p>
        <div class="product-card__colours"></div>
        <button type="button" class="btn btn--ghost btn--block" ${inStock ? "" : "disabled"}>
          ${inStock ? "Add to cart" : "Sold out"}
        </button>
      </div>
    </li>`);

  const media = el.querySelector(".product-card__media");
  if (product.availableColours.length > 1) {
    el.querySelector(".product-card__colours").append(
      ColourSelector({
        colours: product.availableColours,
        selected: colour,
        compact: true,
        onChange: (c) => {
          colour = c;
          const tag = media.querySelector(".tag");
          media.innerHTML = mediaMarkup(product, imageForColour(product, c));
          if (tag) media.append(tag);
        },
      })
    );
  }

  el.querySelector("button.btn").addEventListener("click", () => {
    addItem(product, { colour, quantity: 1, image: imageForColour(product, colour)?.src || null });
    openCart();
  });
  return el;
}
