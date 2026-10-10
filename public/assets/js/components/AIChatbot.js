import { getProducts } from "../api.js";
import { addItem } from "../cart.js";
import { imageForColour, productUrl } from "../product-model.js";
import { esc, formatPrice, html } from "../utils.js";

const COLORS = {
  "Warm Espresso": {
    swatch: "#53392d",
    answer: "Warm Espresso pairs beautifully with light, warm neutrals.",
    matches: [{ name: "Cream Champagne", hex: "#eadcc1" }, { name: "Soft Ivory", hex: "#f3ecdf" }, { name: "Muted Olive", hex: "#8a876e" }],
  },
  "Cream Champagne": {
    swatch: "#eadcc1",
    answer: "Cream Champagne is a versatile neutral that works well with rich, deeper shades.",
    matches: [{ name: "Deep Onyx", hex: "#252326" }, { name: "Forest Emerald", hex: "#355c4b" }, { name: "Warm Espresso", hex: "#53392d" }],
  },
  "Emerald Onyx": {
    swatch: "#285342",
    answer: "Emerald Onyx can be balanced with soft neutrals or a tonal dark look.",
    matches: [{ name: "Soft Ivory", hex: "#f3ecdf" }, { name: "Warm Taupe", hex: "#a18e7b" }, { name: "Deep Onyx", hex: "#252326" }],
  },
};

function colorPanel() {
  return `<form class="ai-color-form" data-color-form>
    <label for="ai-hijab-color">Choose your hijab shade</label>
    <div class="ai-color-form__row">
      <select id="ai-hijab-color" name="color">${Object.entries(COLORS).map(([name, color]) => `<option value="${esc(name)}">${esc(name)}</option>`).join("")}</select>
      <button class="ai-send" type="submit">Match</button>
    </div>
  </form>`;
}

function productCard(product) {
  const image = imageForColour(product, product.availableColours[0]?.name);
  const card = html(`<article class="ai-product-card">
    <a class="ai-product-card__image" href="${productUrl(product)}" tabindex="-1" aria-hidden="true">
      ${image ? `<img src="${esc(image.src)}" alt="${esc(image.alt || product.name)}" loading="lazy">` : `<span>${esc(product.name.charAt(0))}</span>`}
    </a>
    <div class="ai-product-card__info"><p class="ai-product-card__category">${esc(product.category)}</p><h3><a href="${productUrl(product)}">${esc(product.name)}</a></h3><p class="ai-product-card__price">${formatPrice(product.price)}</p></div>
    <button class="ai-product-card__add" type="button" data-chat-add="${esc(product.id)}" ${product.stock > 0 ? "" : "disabled"}>${product.stock > 0 ? "Add to cart" : "Sold out"}</button>
  </article>`);
  return card;
}

function FAQ(message) {
  const text = message.toLowerCase();
  if (/ship|delivery|deliver|dispatch|shipping/.test(text)) {
    return "Shipping availability and delivery estimates depend on your address. Current shipping timelines are not published here yet; please confirm with ShaZ Nest on Instagram before placing an order.";
  }
  if (/return|refund|exchange|replace/.test(text)) {
    return "I can’t confirm a return or exchange window because the current policy isn’t connected here. Please message ShaZ Nest on Instagram with your order details before sending anything back.";
  }
  if (/fabric|wash|care|clean|iron/.test(text)) {
    return "For delicate fabrics, check the garment label first. As a gentle starting point, hand-wash separately in cool water with mild detergent, avoid wringing, and air-dry away from direct heat.";
  }
  if (/loyalty|stamp|reward|free/.test(text)) {
    return "The digital loyalty card tracks qualifying completed orders. Five stamps are shown as eligibility for one free item; reward validation must be confirmed by ShaZ Nest before redemption.";
  }
  return null;
}

async function requestWorkersAI(message) {
  const configured = window.SHAZ_NEST_AI_ENDPOINT;
  if (!configured) return null;
  const endpoint = new URL(configured, location.origin);
  if (endpoint.origin !== location.origin || !endpoint.pathname.startsWith("/api/")) return null;
  try {
    const response = await fetch(endpoint.href, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return typeof result.reply === "string" ? result.reply.slice(0, 1200) : null;
  } catch {
    return null;
  }
}

export function AIChatbot() {
  const root = html(`<div class="ai-concierge">
    <button class="ai-concierge__trigger" type="button" aria-haspopup="dialog" aria-controls="ai-concierge-dialog" aria-expanded="false">
      <span class="ai-concierge__spark" aria-hidden="true">✦</span><span>ShaZ AI Concierge</span>
    </button>
    <dialog class="ai-chat" id="ai-concierge-dialog" aria-labelledby="ai-chat-title">
      <section class="ai-chat__panel">
        <header class="ai-chat__header">
          <div class="ai-chat__identity"><span class="ai-chat__mark" aria-hidden="true">SN</span><div><h2 id="ai-chat-title">ShaZ AI Concierge</h2><p>Style advice, made personal</p></div></div>
          <button class="ai-chat__close" type="button" aria-label="Close concierge">×</button>
        </header>
        <div class="ai-chat__stream" data-chat-stream aria-live="polite" aria-relevant="additions">
          <article class="ai-message ai-message--assistant"><p>Hello, I can help you find a colour pairing, browse the collection, or answer questions about care and loyalty.</p>${colorPanel()}<div class="ai-quick-actions"><button type="button" data-chat-action="best">Show Best Sellers</button><button type="button" data-chat-action="budget">Find Under ₹999</button><button type="button" data-chat-action="loyalty">Loyalty Rewards Info</button></div></article>
        </div>
        <form class="ai-chat__composer" data-chat-form>
          <label class="visually-hidden" for="ai-chat-input">Ask ShaZ AI Concierge</label>
          <input id="ai-chat-input" name="message" type="text" maxlength="500" autocomplete="off" placeholder="Ask about colours, products or care…" required>
          <button class="ai-send" type="submit" aria-label="Send message">Send</button>
        </form>
        <p class="ai-chat__disclaimer">Automated style guidance. Product availability is shown from the current catalogue.</p>
      </section>
    </dialog>
  </div>`);

  const trigger = root.querySelector(".ai-concierge__trigger");
  const dialog = root.querySelector(".ai-chat");
  const stream = root.querySelector("[data-chat-stream]");
  const composer = root.querySelector("[data-chat-form]");
  const messageInput = composer.elements.message;
  let cataloguePromise;

  const getCatalogue = () => cataloguePromise ||= getProducts().catch(() => []);
  const scrollStream = () => { stream.scrollTop = stream.scrollHeight; };

  const addMessage = (text, role = "assistant", products = []) => {
    const message = document.createElement("article");
    message.className = `ai-message ai-message--${role}`;
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    message.append(paragraph);
    if (products.length) {
      const cards = document.createElement("div");
      cards.className = "ai-product-list";
      cards.append(...products.map(productCard));
      message.append(cards);
    }
    stream.append(message);
    scrollStream();
  };

  const addColorMatch = (selected) => {
    const color = COLORS[selected];
    if (!color) return;
    const message = document.createElement("article");
    message.className = "ai-message ai-message--assistant";
    const paragraph = document.createElement("p");
    paragraph.textContent = color.answer;
    const swatches = document.createElement("div");
    swatches.className = "ai-match-swatches";
    color.matches.forEach((match) => {
      const chip = document.createElement("span");
      chip.className = "ai-match-swatch";
      const dot = document.createElement("span");
      dot.className = "ai-match-swatch__dot";
      dot.style.setProperty("--match-color", match.hex);
      dot.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.textContent = match.name;
      chip.append(dot, name);
      swatches.append(chip);
    });
    message.append(paragraph, swatches);
    stream.append(message);
    scrollStream();
  };

  const recommend = async (action) => {
    addMessage(action === "budget" ? "Find items under ₹999" : "Show Best Sellers", "user");
    const catalogue = await getCatalogue();
    if (action === "budget") {
      const matches = catalogue.filter((product) => product.stock > 0 && product.price < 999).sort((a, b) => a.price - b.price).slice(0, 4);
      addMessage(matches.length ? `Here are available pieces currently listed under ₹999 (${matches.length} shown).` : "I couldn’t find available items under ₹999 in the current catalogue.", "assistant", matches);
      return;
    }
    const featured = catalogue.filter((product) => product.stock > 0 && product.featured).slice(0, 4);
    addMessage(featured.length
      ? "Sales ranking isn’t connected yet, so these are featured available pieces rather than verified best sellers."
      : "Sales ranking and featured-product data aren’t available yet, so I can’t identify best sellers without inventing that information.", "assistant", featured);
  };

  const answer = async (message) => {
    const text = message.trim();
    if (!text) return;
    addMessage(text, "user");
    const faq = FAQ(text);
    if (faq) {
      addMessage(faq);
      return;
    }
    if (/best.?seller|popular|recommend|suggest|show.*product/.test(text.toLowerCase())) {
      await recommend("best");
      return;
    }
    if (/under\s*(?:rs\.?\s*|rupees?\s*)?999|below\s*(?:rs\.?\s*|rupees?\s*)?999|budget/.test(text.toLowerCase())) {
      await recommend("budget");
      return;
    }
    if (/warm espresso|cream champagne|emerald onyx|color|colour|abaya/.test(text.toLowerCase())) {
      addMessage("Use the colour matcher above to choose your hijab shade and see complementary Abaya colours.");
      return;
    }
    const generated = await requestWorkersAI(text);
    addMessage(generated || "I can help with the colour matcher, featured products, items under ₹999, shipping, returns, fabric care, or loyalty rewards. What would you like to explore?");
  };

  trigger.addEventListener("click", () => {
    if (!dialog.open) dialog.showModal();
    trigger.setAttribute("aria-expanded", "true");
    messageInput.focus();
  });
  root.querySelector(".ai-chat__close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  root.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-chat-action]");
    if (action) {
      if (action.dataset.chatAction === "loyalty") {
        addMessage("Loyalty Rewards Info", "user");
        addMessage(FAQ("loyalty rewards"));
      } else {
        await recommend(action.dataset.chatAction);
      }
      return;
    }

    const addButton = event.target.closest("[data-chat-add]");
    if (addButton) {
      const catalogue = await getCatalogue();
      const product = catalogue.find((item) => String(item.id) === addButton.dataset.chatAdd);
      if (!product || product.stock <= 0) {
        addMessage("That piece is no longer available. Please refresh the collection to see current stock.");
        return;
      }
      addItem(product, { colour: product.availableColours[0]?.name || null, quantity: 1, image: imageForColour(product, product.availableColours[0]?.name)?.src || null });
      addMessage(`${product.name} was added to your cart.`);
    }
  });

  root.addEventListener("submit", async (event) => {
    if (event.target.matches("[data-color-form]")) {
      event.preventDefault();
      const selected = new FormData(event.target).get("color");
      addMessage(`My hijab is ${selected}.`, "user");
      addColorMatch(selected);
      return;
    }
    if (event.target.matches("[data-chat-form]")) {
      event.preventDefault();
      const text = messageInput.value;
      messageInput.value = "";
      await answer(text);
    }
  });

  return root;
}
