// Product shape shared by every component. The backend API should return this
// shape; normalizeProduct() guards against missing or malformed fields.
//
// {
//   id: string,
//   name: string,
//   slug: string,                       // used in /products/<slug>
//   category: "hijabs" | "accessories",
//   description: string,
//   price: number,                      // INR
//   compareAtPrice: number | null,      // original price, shown struck through when higher than price
//   availableColours: [{ name: string, hex: string | null }],
//   images: [{ src: string, alt: string, colour: string | null }],
//   stock: number,                      // 0 = sold out. Never displayed to customers.
//   featured: boolean,
//   active: boolean,                    // inactive products are hidden everywhere
// }

const toNumber = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));

export function normalizeProduct(raw) {
  if (!raw || raw.id == null || !raw.slug || !raw.name) return null;
  const price = toNumber(raw.price);
  if (!Number.isFinite(price) || price < 0) return null;

  const compareAt = toNumber(raw.compareAtPrice);
  const stock = toNumber(raw.stock);

  return {
    id: String(raw.id),
    name: String(raw.name),
    slug: String(raw.slug),
    category: String(raw.category || "").toLowerCase(),
    description: String(raw.description || ""),
    price,
    compareAtPrice: Number.isFinite(compareAt) && compareAt > price ? compareAt : null,
    availableColours: (raw.availableColours || [])
      .map((c) => (typeof c === "string" ? { name: c, hex: null } : { name: c?.name, hex: c?.hex || null }))
      .filter((c) => c.name),
    images: (raw.images || [])
      .map((i) =>
        typeof i === "string"
          ? { src: i, alt: String(raw.name), colour: null }
          : { src: i?.src, alt: i?.alt || String(raw.name), colour: i?.colour || null }
      )
      .filter((i) => i.src),
    stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,
    featured: Boolean(raw.featured),
    active: raw.active !== false,
  };
}

export const isInStock = (product) => product.stock > 0;

export const productUrl = (product) => `/products/${encodeURIComponent(product.slug)}`;

// Prefer an image tagged with the selected colour, otherwise the first image.
export const imageForColour = (product, colour) =>
  (colour && product.images.find((i) => i.colour === colour)) || product.images[0] || null;
