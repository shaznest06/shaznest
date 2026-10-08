const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

// All product data is escaped before it reaches innerHTML, since it will come from an API.
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const formatPrice = (amount) =>
  "₹" + Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Builds a single element from an HTML string.
export function html(markup) {
  const tpl = document.createElement("template");
  tpl.innerHTML = markup.trim();
  return tpl.content.firstElementChild;
}

let uid = 0;
export const uniqueId = (prefix = "sn") => `${prefix}-${++uid}`;
