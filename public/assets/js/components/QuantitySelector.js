import { esc, html, uniqueId } from "../utils.js";

/**
 * QuantitySelector({ value, min, max, label, onChange }) → HTMLElement
 * Exposes el.setValue(n) for external updates.
 */
export function QuantitySelector({ value = 1, min = 1, max = Infinity, label = "Quantity", onChange = () => {}, compact = false }) {
  const id = uniqueId("qty");
  const el = html(`
    <div class="qty${compact ? " is-compact" : ""}">
      <label class="${compact ? "visually-hidden" : "field-label"}" for="${id}">${esc(label)}</label>
      <div class="qty__control">
        <button type="button" class="qty__btn" data-step="-1" aria-label="Decrease quantity">−</button>
        <input id="${id}" class="qty__input" type="number" inputmode="numeric" min="${min}" ${Number.isFinite(max) ? `max="${max}"` : ""} value="${value}">
        <button type="button" class="qty__btn" data-step="1" aria-label="Increase quantity">+</button>
      </div>
    </div>`);

  const input = el.querySelector("input");
  const dec = el.querySelector('[data-step="-1"]');
  const inc = el.querySelector('[data-step="1"]');
  let current = value;

  const set = (n, notify = true) => {
    const next = Math.max(min, Math.min(max, Math.floor(Number(n)) || min));
    input.value = next;
    dec.disabled = next <= min;
    inc.disabled = next >= max;
    if (next !== current) {
      current = next;
      if (notify) onChange(next);
    }
  };

  el.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (btn) set(current + Number(btn.dataset.step));
  });
  input.addEventListener("change", () => set(input.value));
  set(value, false);

  el.setValue = (n) => set(n, false);
  return el;
}
