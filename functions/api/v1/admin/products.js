import { corsAllowed, internalError, json, methodNotAllowed, missingDatabase, options, parseImages, readFormOrJson, rejectOrigin, requireAdmin, slugify, storeImage, validImageFile } from "../_utils.js";

function productRow(row) {
  const images = parseImages(row.images_json);
  return {
    id: row.id,
    title: row.title,
    name: row.title,
    slug: row.slug || slugify(row.title),
    price: row.price,
    compareAtPrice: row.compare_at_price,
    compare_at_price: row.compare_at_price,
    category: row.category,
    stock: row.stock,
    images,
    variants: parseImages(row.variants_json),
    description: row.description,
    active: Boolean(row.active),
  };
}

function validProduct(product) {
  const title = typeof product?.title === "string" ? product.title.trim() : typeof product?.name === "string" ? product.name.trim() : "";
  const price = Number(product?.price);
  const compareAt = product?.compare_at_price ?? product?.compareAtPrice;
  const category = product?.category;
  const stock = Number(product?.stock);
  const description = typeof product?.description === "string" ? product.description : "";
  const images = parseImages(product?.images_json ?? product?.images);
  const variants = parseImages(product?.variants_json ?? product?.variants);
  if (!title || title.length > 120) return { error: "Product title must be 1–120 characters." };
  if (!Number.isFinite(price) || price < 0) return { error: "Price must be a non-negative number." };
  if (compareAt != null && compareAt !== "" && (!Number.isFinite(Number(compareAt)) || Number(compareAt) < price)) return { error: "Compare-at price must be at least the sale price." };
  if (!["hijabs", "accessories"].includes(category)) return { error: "Category must be hijabs or accessories." };
  if (!Number.isSafeInteger(stock) || stock < 0) return { error: "Stock must be a non-negative whole number." };
  if (description.length > 10_000) return { error: "Description is too long." };
  if (!Array.isArray(images) || images.length > 20 || images.some((image) => !image || typeof image.src !== "string" || image.src.length > 2048)) return { error: "Product images are invalid." };
  if (!Array.isArray(variants) || variants.length > 100 || variants.some((variant) => !variant || typeof variant.color !== "string" || typeof variant.fabricType !== "string" || typeof variant.size !== "string")) return { error: "Product variants must include color, fabricType, and size." };
  return { value: { title, price, compareAt: compareAt == null || compareAt === "" ? null : Number(compareAt), category, stock, description, images, variants } };
}

export async function onRequestOptions({ request, env }) {
  return options(request, env);
}

export async function onRequest({ request, env }) {
  const originError = rejectOrigin(request, env);
  if (originError) return originError;
  if (request.method === "OPTIONS") return options(request, env);
  const authError = await requireAdmin(request, env);
  if (authError) return authError;
  const databaseError = missingDatabase(request, env);
  if (databaseError) return databaseError;

  try {
    if (request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT id, title, slug, price, compare_at_price, category, stock, images_json, variants_json, description, active FROM products WHERE active = 1 ORDER BY created_at DESC").all();
      return json(request, env, { products: (results || []).map(productRow) });
    }

    if (request.method === "DELETE") {
      const id = new URL(request.url).searchParams.get("id");
      if (!id) return json(request, env, { error: "Product id is required." }, 400);
      const result = await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
      return result.meta?.changes ? json(request, env, { deleted: true, id }) : json(request, env, { error: "Product not found." }, 404);
    }

    if (request.method === "PATCH") {
      const body = await request.json().catch(() => null);
      if (!Array.isArray(body?.updates) || body.updates.length < 1 || body.updates.length > 250) return json(request, env, { error: "Provide between 1 and 250 stock updates." }, 400);
      const seen = new Set();
      for (const update of body.updates) {
        if (typeof update?.id !== "string" || !update.id || seen.has(update.id) || !Number.isSafeInteger(update.stock) || update.stock < 0) return json(request, env, { error: "Each stock update requires a unique product id and a non-negative whole-number stock value." }, 400);
        seen.add(update.id);
      }
      const statements = body.updates.map((update) => env.DB.prepare("UPDATE products SET stock = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").bind(update.stock, update.id));
      const results = await env.DB.batch(statements);
      if (results.some((result) => !result.meta?.changes)) return json(request, env, { error: "One or more products were not found. Reload inventory before retrying." }, 409);
      return json(request, env, { updated: results.length });
    }

    if (!["POST", "PUT"].includes(request.method)) return methodNotAllowed(request, env, ["GET", "POST", "PUT", "PATCH", "DELETE"]);
    const parsed = await readFormOrJson(request);
    if (!parsed.product || typeof parsed.product !== "object") return json(request, env, { error: "Product JSON is required." }, 400);
    const validation = validProduct(parsed.product);
    if (validation.error) return json(request, env, { error: validation.error }, 400);
    const product = validation.value;

    if (parsed.image && parsed.image.size) {
      if (!validImageFile(parsed.image)) return json(request, env, { error: "Product image must be an image smaller than 5 MB." }, 400);
      const stored = await storeImage(env, parsed.image, "products");
      if (stored.error) return json(request, env, { error: stored.error }, 503);
      product.images = [{ src: stored.url, alt: product.title }];
    }

    const id = request.method === "PUT" ? new URL(request.url).searchParams.get("id") : null;
    if (request.method === "PUT" && !id) return json(request, env, { error: "Product id is required in the id query parameter." }, 400);
    const productId = id || crypto.randomUUID();
    const slug = slugify(product.title);
    const statement = request.method === "POST"
      ? env.DB.prepare("INSERT INTO products (id, title, slug, price, compare_at_price, category, stock, images_json, variants_json, description, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)").bind(productId, product.title, slug, product.price, product.compareAt, product.category, product.stock, JSON.stringify(product.images), JSON.stringify(product.variants), product.description)
      : env.DB.prepare("UPDATE products SET title = ?, slug = ?, price = ?, compare_at_price = ?, category = ?, stock = ?, images_json = ?, variants_json = ?, description = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").bind(product.title, slug, product.price, product.compareAt, product.category, product.stock, JSON.stringify(product.images), JSON.stringify(product.variants), product.description, productId);
    const result = await statement.run();
    if (request.method === "PUT" && !result.meta?.changes) return json(request, env, { error: "Product not found." }, 404);
    return json(request, env, { product: { ...product, id: productId, slug, name: product.title, compareAtPrice: product.compareAt } }, request.method === "POST" ? 201 : 200);
  } catch (error) {
    if (error?.cause?.message?.includes("UNIQUE") || error?.message?.includes("UNIQUE")) return json(request, env, { error: "A product with this title/slug already exists." }, 409);
    return internalError(request, env);
  }
}