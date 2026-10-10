import { corsAllowed, internalError, json, methodNotAllowed, missingDatabase, options, readJson, rejectOrigin, requireAdmin } from "../_utils.js";

const NEXT_STATUS = { Processing: "Shipped", Shipped: "Delivered" };

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
      const { results } = await env.DB.prepare(`
         SELECT o.id, o.order_number, o.customer_id, o.items_json, o.total_amount, o.payment_status,
           o.delivery_status, o.loyalty_stamp_issued, o.created_at, o.shipping_address_json,
           c.email AS customer_email, c.name AS customer_name, c.address_json AS customer_address
        FROM orders o JOIN customers c ON c.id = o.customer_id
        ORDER BY o.created_at DESC LIMIT 250
      `).all();
      return json(request, env, { orders: (results || []).map((row) => ({
        id: row.id,
        orderNumber: row.order_number,
        customerId: row.customer_id,
        customer: { email: row.customer_email, fullName: row.customer_name },
        customerName: row.customer_name,
        shippingAddress: Object.keys(parseJson(row.shipping_address_json)).length ? parseJson(row.shipping_address_json) : parseJson(row.customer_address),
        items: parseItems(row.items_json),
        totalAmount: row.total_amount,
        paymentStatus: row.payment_status,
        status: row.delivery_status,
        loyaltyStampIssued: Boolean(row.loyalty_stamp_issued),
        createdAt: row.created_at,
      })) });
    }

    const url = new URL(request.url);
    if (request.method === "PUT") {
      const body = await readJson(request);
      const id = url.searchParams.get("id") || body?.id;
      const status = body?.status;
      if (!id || !["Processing", "Shipped", "Delivered"].includes(status)) return json(request, env, { error: "Order id and a valid delivery status are required." }, 400);

      const current = await env.DB.prepare("SELECT delivery_status FROM orders WHERE id = ?").bind(id).first();
      if (!current) return json(request, env, { error: "Order not found." }, 404);
      if (NEXT_STATUS[current.delivery_status] !== status && current.delivery_status !== status) {
        return json(request, env, { error: "Order status can advance only Processing → Shipped → Delivered." }, 409);
      }
      const result = await env.DB.prepare("UPDATE orders SET delivery_status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND delivery_status = ?").bind(status, id, current.delivery_status).run();
      if (!result.meta?.changes) return json(request, env, { error: "Order status changed concurrently. Refresh and try again." }, 409);
      return json(request, env, { id, status });
    }

    if (request.method === "POST") {
      const id = url.searchParams.get("id");
      const action = url.searchParams.get("action");
      if (!id || action !== "loyalty-stamp") return json(request, env, { error: "Order id and action=loyalty-stamp are required." }, 400);
      const order = await env.DB.prepare("SELECT customer_id, delivery_status, loyalty_stamp_issued FROM orders WHERE id = ?").bind(id).first();
      if (!order) return json(request, env, { error: "Order not found." }, 404);
      if (order.delivery_status !== "Delivered") return json(request, env, { error: "Loyalty stamps can be issued only for delivered orders." }, 409);
      if (order.loyalty_stamp_issued) return json(request, env, { error: "A loyalty stamp was already issued for this order." }, 409);

      const result = await env.DB.prepare("UPDATE orders SET loyalty_stamp_issued = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND customer_id = ? AND delivery_status = 'Delivered' AND payment_status = 'paid' AND loyalty_stamp_issued = 0").bind(id, order.customer_id).run();
      if (!result.meta?.changes) return json(request, env, { error: "A loyalty stamp was already issued or the order is no longer eligible." }, 409);
      return json(request, env, { id, customerId: order.customer_id, loyaltyStampIssued: true });
    }

    return methodNotAllowed(request, env, ["GET", "PUT", "POST"]);
  } catch {
    return internalError(request, env);
  }
}

function parseItems(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJson(value) {
  try { return JSON.parse(value || "{}"); } catch { return {}; }
}