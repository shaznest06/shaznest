import { esc, html } from "../utils.js";

const DRAFTS_KEY = "sn_customer_review_drafts_v1";
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function readDrafts() {
  try {
    const value = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveDraft(draft) {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify([...readDrafts(), draft].slice(-10)));
    return true;
  } catch {
    return false;
  }
}

function proofCard(proof, index) {
  return `<li class="proof-card">
    <button class="proof-card__open" type="button" data-proof-index="${index}" aria-label="Zoom verified WhatsApp screenshot ${index + 1}">
      <img src="${esc(proof.src)}" alt="${esc(proof.alt || "Verified WhatsApp customer conversation")}" loading="lazy" decoding="async">
      <span class="proof-card__zoom" aria-hidden="true">+</span>
    </button>
    <p class="proof-card__label">Verified WhatsApp order</p>
  </li>`;
}

export function ReviewGallery({ whatsappProofs = [] } = {}) {
  let proofs = Array.isArray(whatsappProofs)
    ? whatsappProofs.filter((proof) => proof?.verified === true && typeof proof.src === "string" && proof.src.trim())
    : [];
  const root = html(`
    <div class="review-gallery">
      <header class="review-gallery__intro">
        <p class="eyebrow">Community</p>
        <h1 class="section-title">Customer Reviews</h1>
        <p class="note">Share your experience with ShaZ Nest. Reviews saved here are private drafts until a secure review service is connected.</p>
      </header>

      <div class="review-gallery__layout">
        <section class="review-panel review-compose" aria-labelledby="review-form-title">
          <div class="review-panel__heading">
            <p class="eyebrow">Your experience</p>
            <h2 id="review-form-title">Write a review</h2>
          </div>
          <form class="review-form" data-review-form novalidate>
            <fieldset class="review-rating">
              <legend class="review-label">Your rating</legend>
              <div class="review-rating__stars" role="radiogroup" aria-label="Rate from 1 to 5 stars">
                ${[1, 2, 3, 4, 5].map((rating) => `<label class="review-star">
                  <input type="radio" name="rating" value="${rating}" required>
                  <span aria-hidden="true">★</span><span class="visually-hidden">${rating} ${rating === 1 ? "star" : "stars"}</span>
                </label>`).join("")}
              </div>
            </fieldset>
            <label class="review-field"><span class="review-label">Your review</span><textarea name="body" rows="5" minlength="10" maxlength="1200" placeholder="What did you think of your purchase?" required></textarea></label>
            <label class="review-field"><span class="review-label">Product photos <small>Optional, up to 3 images</small></span><input name="photos" type="file" accept="image/*" multiple></label>
            <p class="review-upload-note">Photo previews stay in this page and are not uploaded.</p>
            <div class="review-previews" data-review-previews aria-live="polite"></div>
            <p class="review-feedback" data-review-feedback role="status" aria-live="polite"></p>
            <button class="btn btn--primary" type="submit">Save review draft</button>
          </form>
        </section>

        <section class="review-panel proof-gallery" aria-labelledby="proof-gallery-title">
          <div class="review-panel__heading">
            <p class="eyebrow">Order verification</p>
            <h2 id="proof-gallery-title">WhatsApp Proof Gallery</h2>
            <p class="note">Customer conversation screenshots are shown only after they have been supplied and verified.</p>
          </div>
          <div data-proof-content></div>
        </section>
      </div>

      <section class="review-drafts" aria-labelledby="review-drafts-title" ${readDrafts().length ? "" : "hidden"}>
        <div class="review-panel__heading"><p class="eyebrow">Saved on this device</p><h2 id="review-drafts-title">Your review drafts</h2></div>
        <div class="review-drafts__list" data-review-drafts></div>
      </section>

      <dialog class="proof-lightbox" aria-label="WhatsApp screenshot preview">
        <button class="proof-lightbox__close" type="button" aria-label="Close screenshot preview">Close</button>
        <img alt="Verified WhatsApp customer conversation preview">
      </dialog>
    </div>`);

  const form = root.querySelector("[data-review-form]");
  const photoInput = form.elements.photos;
  const previews = root.querySelector("[data-review-previews]");
  const feedback = root.querySelector("[data-review-feedback]");
  let previewUrls = [];

  const clearPreviews = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls = [];
    previews.replaceChildren();
  };

  photoInput.addEventListener("change", () => {
    clearPreviews();
    const files = [...photoInput.files];
    if (files.length > MAX_PHOTOS || files.some((file) => !file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES)) {
      photoInput.value = "";
      feedback.textContent = "Choose up to 3 image files, each smaller than 5 MB.";
      return;
    }
    feedback.textContent = "";
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      const image = document.createElement("img");
      image.src = url;
      image.alt = `Preview: ${file.name}`;
      image.loading = "lazy";
      const item = document.createElement("div");
      item.className = "review-preview";
      item.append(image);
      previews.append(item);
    });
  });

  root.querySelectorAll('[name="rating"]').forEach((input) => input.addEventListener("change", () => {
    root.querySelectorAll(".review-star").forEach((star, index) => {
      star.classList.toggle("is-selected", index < Number(input.value));
    });
  }));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const draft = {
      rating: Number(form.elements.rating.value),
      body: form.elements.body.value.trim(),
      photoNames: [...photoInput.files].map((file) => file.name),
      savedAt: new Date().toISOString(),
    };
    if (!saveDraft(draft)) {
      feedback.textContent = "This browser could not save your review draft.";
      return;
    }
    clearPreviews();
    form.reset();
    root.querySelectorAll(".review-star").forEach((star) => star.classList.remove("is-selected"));
    feedback.textContent = "Draft saved on this device. It has not been published or sent.";
    renderDrafts(root);
  });

  const lightbox = root.querySelector(".proof-lightbox");
  const lightboxImage = lightbox.querySelector("img");
  const renderProofs = () => {
    const proofContent = root.querySelector("[data-proof-content]");
    proofContent.innerHTML = proofs.length
      ? `<ul class="proof-grid">${proofs.map(proofCard).join("")}</ul>`
      : `<div class="proof-empty"><span class="proof-empty__mark" aria-hidden="true">WA</span><p>No verified customer screenshots have been added yet.</p></div>`;
    proofContent.querySelectorAll("[data-proof-index]").forEach((button) => button.addEventListener("click", () => {
      const proof = proofs[Number(button.dataset.proofIndex)];
      if (!proof) return;
      lightboxImage.src = proof.src;
      lightboxImage.alt = proof.alt || "Verified WhatsApp customer conversation preview";
      lightbox.showModal();
    }));
  };
  renderProofs();
  let proofsLoaded = false;
  const loadPublicProofs = () => {
    if (proofsLoaded || !location.hash.startsWith("#/reviews")) return;
    proofsLoaded = true;
    fetch("/api/v1/review-proofs", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("Proof gallery is unavailable.");
        return response.json();
      })
      .then((data) => {
        const remoteProofs = Array.isArray(data) ? data : data?.proofs || [];
        const approved = remoteProofs.filter((proof) => proof?.verified === true && typeof proof.src === "string" && proof.src.trim());
        if (!approved.length) return;
        proofs = [...new Map([...proofs, ...approved].map((proof) => [proof.id || proof.src, proof])).values()];
        renderProofs();
      })
      .catch(() => { proofsLoaded = false; });
  };
  window.addEventListener("hashchange", loadPublicProofs);
  loadPublicProofs();
  lightbox.querySelector(".proof-lightbox__close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  renderDrafts(root);
  return root;
}

function renderDrafts(root) {
  const container = root.querySelector("[data-review-drafts]");
  const section = root.querySelector(".review-drafts");
  const drafts = readDrafts();
  section.hidden = drafts.length === 0;
  container.replaceChildren(...drafts.slice().reverse().map((draft) => {
    const item = html(`<article class="review-draft"><div class="review-draft__rating" aria-label="${esc(draft.rating)} out of 5 stars">${"★".repeat(Math.min(5, Math.max(0, Number(draft.rating) || 0)))}<span>${esc(draft.rating)}/5</span></div><p></p><small></small></article>`);
    item.querySelector("p").textContent = draft.body || "";
    item.querySelector("small").textContent = `${formatDraftDate(draft.savedAt)} · Local draft${draft.photoNames?.length ? ` · ${draft.photoNames.length} photo preview${draft.photoNames.length === 1 ? "" : "s"}` : ""}`;
    return item;
  }));
}

function formatDraftDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Saved" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
