import { internalError, json, missingDatabase, options, rejectOrigin, requireAdmin } from "../_utils.js";

export async function onRequestOptions({ request, env }) {
  return options(request, env);
}

export async function onRequest({ request, env }) {
  const originError = rejectOrigin(request, env);
  if (originError) return originError;
  if (request.method === "OPTIONS") return options(request, env);
  if (request.method !== "GET") return json(request, env, { error: "Method not allowed." }, 405, { Allow: "GET, OPTIONS" });
  const authError = await requireAdmin(request, env);
  if (authError) return authError;
  const databaseError = missingDatabase(request, env);
  if (databaseError) return databaseError;

  try {
    const { results } = await env.DB.prepare(`
      SELECT c.id, c.name, c.email, c.google_id, c.loyalty_stamps,
        COUNT(o.id) AS total_orders,
        MAX(o.created_at) AS last_order_at
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY last_order_at DESC, c.name COLLATE NOCASE ASC
      LIMIT 1000
    `).all();
    return json(request, env, { customers: results || [] });
  } catch {
    return internalError(request, env);
  }
}