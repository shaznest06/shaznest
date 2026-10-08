import { esc, html, uniqueId } from "../utils.js";

/**
 * Colour swatches backed by native radio inputs (keyboard and screen-reader friendly).
 * ColourSelector({ colours, selected, onChange, compact }) → HTMLElement
 */
export function ColourSelector({ colours, selected = null, onChange = () => {}, compact = false }) {
  const name = uniqueId("colour");
  const current = selected ?? colours[0]?.name ?? null;

  const el = html(`
    <fieldset class="colour-selector${compact ? " is-compact" : ""}">
      <legend class="${compact ? "visually-hidden" : "field-label"}">Colour<span class="colour-selector__current">${esc(current)}</span></legend>
      <div class="colour-selector__options">
        ${colours
          .map(
            (c) => `
          <label class="swatch" title="${esc(c.name)}">
            <input type="radio" name="${name}" value="${esc(c.name)}" ${c.name === current ? "checked" : ""}>
            <span class="swatch__dot" style="${c.hex ? `--swatch:${esc(c.hex)}` : ""}" data-empty="${c.hex ? "false" : "true"}"></span>
            <span class="visually-hidden">${esc(c.name)}</span>
          </label>`
          )
          .join("")}
      </div>
    </fieldset>`);

  el.addEventListener("change", (e) => {
    el.querySelector(".colour-selector__current").textContent = e.target.value;
    onChange(e.target.value);
  });
  return el;
}
