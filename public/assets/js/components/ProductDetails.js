import { categoryName } from "../config.js";
import { addItem } from "../cart.js";
import { imageForColour, isInStock } from "../product-model.js";
import { esc, html } from "../utils.js";
import { ColourSelector } from "./ColourSelector.js";
import { QuantitySelector } from "./QuantitySelector.js";
import { mediaMarkup, priceMarkup } from "./ProductCard.js";
import { openCart } from "./CartDrawer.js";

/** ProductDetails({ product }) → full product view with gallery, options and add to cart. */
export function ProductDetails({ product }) {
  const inStock = isInStock(product);
  let colour = product.availableColours[0]?.name ?? null;
  let quantity = 1;
  let activeImage = imageForColour(product, colour);

  const paragraphs = product.description
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");

  const el = html(`
    <article class="product-details">
      <div class="product-details__gallery">
        <div class="product-details__main">${mediaMarkup(product, activeImage, { eager: true })}</div>
        ${
          product.images.length > 1
            ? `<ul class="product-details__thumbs" role="list">${product.images
                .map(
                  (img, i) => `<li><button type="button" class="thumb" data-index="${i}" aria-label="View image ${i + 1}" aria-pressed="${img === activeImage}">
                    <img src="${esc(img.src)}" alt="" loading="lazy"></button></li>`
                )
                .join("")}</ul>`
            : ""
        }
      </div>
      <div class="product-details__info">
        <p class="eyebrow">${esc(categoryName(product.category))}</p>
        <h1 class="product-details__title">${esc(product.name)}</h1>
        <p class="product-details__price">${priceMarkup(product)}</p>
        <div class="product-details__options"></div>
        <button type="button" class="btn btn--primary btn--block" data-add ${inStock ? "" : "disabled"}>
          ${inStock ? "Add to cart" : "Sold out"}
        </button>
        ${paragraphs ? `<div class="product-details__description">${paragraphs}</div>` : ""}
      </div>
    </article>`);

  const main = el.querySelector(".product-details__main");
  const showImage = (img) => {
    activeImage = img;
    main.innerHTML = mediaMarkup(product, img, { eager: true });
    el.querySelectorAll(".thumb").forEach((t) => t.setAttribute("aria-pressed", String(product.images[t.dataset.index] === img)));
  };

  el.querySelector(".product-details__thumbs")?.addEventListener("click", (e) => {
    const t = e.target.closest(".thumb");
    if (t) showImage(product.images[t.dataset.index]);
  });

  const options = el.querySelector(".product-details__options");
  if (product.availableColours.length) {
    options.append(
      ColourSelector({
        colours: product.availableColours,
        selected: colour,
        onChange: (c) => {
          colour = c;
          const img = product.images.find((i) => i.colour === c);
          if (img) showImage(img);
        },
      })
    );
  }
  if (inStock) {
    options.append(QuantitySelector({ value: 1, min: 1, max: product.stock, onChange: (n) => (quantity = n) }));
  }

  el.querySelector("[data-add]").addEventListener("click", () => {
    addItem(product, { colour, quantity, image: imageForColour(product, colour)?.src || null });
    openCart();
  });
  return el;
}
