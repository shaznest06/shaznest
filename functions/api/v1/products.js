// GET /api/v1/products: public catalogue (active products only), in the shape the storefront expects.
import { internalError, json, methodNotAllowed, missingDatabase, options, parseImages, rejectOrigin, slugify } from "./_utils.js";

export async function onRequest({ request, env }) {
  const originError = rejectOrigin(request, env);
  if (originError) return originError;
  if (request.method === "OPTIONS") return options(request, env);
  if (request.method !== "GET") return methodNotAllowed(request, env, ["GET"]);
  const databaseError = missingDatabase(request, env);
  if (databaseError) return databaseError;

  try {
    const { results } = await env.DB.prepare(
      "SELECT id, title, slug, price, compare_at_price, category, stock, images_json, variants_json, description FROM products WHERE active = 1 ORDER BY created_at DESC"
    ).all();
    const products = (results || []).map((row) => {
      const colours = [...new Set(parseImages(row.variants_json).map((variant) => variant?.color).filter(Boolean))];
      return {
        id: row.id,
        name: row.title,
        slug: row.slug || slugify(row.title),
        category: row.category,
        description: row.description,
        price: row.price,
        compareAtPrice: row.compare_at_price,
        availableColours: colours.map((name) => ({ name, hex: null })),
        images: parseImages(row.images_json),
        stock: row.stock,
        featured: false,
        active: true,
      };
    });
    return json(request, env, { products }, 200, { "Cache-Control": "public, max-age=30" });
  } catch (error) {
    console.error("Product list failed", error);
    return internalError(request, env);
  }
}
