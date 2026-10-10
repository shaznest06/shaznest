// GET /api/v1/orders/{orderNumber}/tracking: public status for a paid order. No personal details are returned.
import { internalError, json, methodNotAllowed, missingDatabase, options, rejectOrigin } from "../../_utils.js";

const DESCRIPTIONS = {
  Processing: "Payment confirmed. We are preparing your order.",
  Shipped: "Your order has been shipped.",
  Delivered: "Your order has been delivered.",
};

export async function onRequest({ request, env, params }) {
  const originError = rejectOrigin(request, env);
  if (originError) return originError;
  if (request.method === "OPTIONS") return options(request, env);
  if (request.method !== "GET") return methodNotAllowed(request, env, ["GET"]);
  const databaseError = missingDatabase(request, env);
  if (databaseError) return databaseError;

  const orderNumber = String(params.orderNumber || "").trim().toUpperCase();
  if (!/^SN-[A-Z0-9]{8}$/.test(orderNumber)) return json(request, env, { error: "Order not found." }, 404);

  try {
    const order = await env.DB.prepare(
      "SELECT order_number, delivery_status, created_at, updated_at FROM orders WHERE order_number = ? AND payment_status = 'paid'"
    ).bind(orderNumber).first();
    if (!order) return json(request, env, { error: "Order not found." }, 404);

    const events = [{ status: "Processing", description: DESCRIPTIONS.Processing, location: null, timestamp: order.created_at }];
    if (order.delivery_status !== "Processing") {
      events.push({ status: order.delivery_status, description: DESCRIPTIONS[order.delivery_status] || "", location: null, timestamp: order.updated_at });
    }
    return json(request, env, { orderNumber: order.order_number, status: order.delivery_status, updatedAt: order.updated_at, events });
  } catch (error) {
    console.error("Tracking lookup failed", error);
    return internalError(request, env);
  }
}
