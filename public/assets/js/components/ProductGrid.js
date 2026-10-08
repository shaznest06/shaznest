import { html } from "../utils.js";
import { ProductCard } from "./ProductCard.js";

/**
 * ProductGrid({ products, emptyMessage }) → HTMLElement
 * ProductGrid.loading(count) renders skeleton cards while data loads.
 */
export function ProductGrid({ products, emptyMessage = "" }) {
  if (!products.length) {
    return html(`<div class="empty-state">${emptyMessage}</div>`);
  }
  const grid = html(`<ul class="product-grid" role="list"></ul>`);
  products.forEach((product) => grid.append(ProductCard({ product })));
  return grid;
}

ProductGrid.loading = (count = 4) =>
  html(`<ul class="product-grid" aria-busy="true" aria-label="Loading products">${
    '<li class="product-card is-skeleton"><span class="product-card__media"></span><span class="skeleton-line"></span><span class="skeleton-line short"></span></li>'.repeat(count)
  }</ul>`);
