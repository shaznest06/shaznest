// POST /api/v1/payments/verify: confirms Razorpay's signature, then marks the order paid.
import { hmacSha256Hex, internalError, json, methodNotAllowed, missingDatabase, options, parseJson, readJson, rejectOrigin, timingSafeEqual } from "../_utils.js";

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

function orderView(row) {
  const items = parseJson(row.items_json, []);
  return {
    orderNumber: row.order_number,
    status: String(row.delivery_status || "Processing").toLowerCase(),
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    total: row.total_amount,
    items: Array.isArray(items) ? items.map(({ productId, name, colour, quantity }) => ({ productId, name, colour, quantity })) : [],
  };
}

export async function onRequest({ request, env }) {
  const originError = rejectOrigin(request, env);
  if (originError) return originError;
  if (request.method === "OPTIONS") return options(request, env);
  if (request.method !== "POST") return methodNotAllowed(request, env, ["POST"]);
  const databaseError = missingDatabase(request, env);
  if (databaseError) return databaseError;
  if (!env.RAZORPAY_KEY_SECRET) return json(request, env, { error: "Online payment is not configured yet." }, 503);

  const body = await readJson(request);
  const orderId = body?.razorpayOrderId;
  const paymentId = body?.razorpayPaymentId;
  const signature = body?.razorpaySignature;
  if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string"
    || !/^order_[A-Za-z0-9]{6,40}$/.test(orderId) || !/^pay_[A-Za-z0-9]{6,40}$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return json(request, env, { error: "Invalid payment details.", verified: false }, 400);
  }

  try {
    const expected = await hmacSha256Hex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
    if (!timingSafeEqual(expected, signature.toLowerCase())) {
      return json(request, env, { error: "Payment signature could not be verified.", verified: false }, 400);
    }

    const order = await env.DB.prepare("SELECT * FROM orders WHERE razorpay_order_id = ?").bind(orderId).first();
    if (!order) return json(request, env, { error: "Order not found.", verified: false }, 404);

    if (order.payment_status === "paid") {
      // Repeated verification of the same payment is fine; a different payment id is not.
      if (order.razorpay_payment_id !== paymentId) return json(request, env, { error: "This order is already paid.", verified: false }, 409);
      return json(request, env, { verified: true, order: orderView(order) });
    }

    const result = await env.DB.prepare(
      `UPDATE orders SET payment_status = 'paid', razorpay_payment_id = ?, updated_at = ${NOW} WHERE id = ? AND payment_status != 'paid'`
    ).bind(paymentId, order.id).run();

    if (result.meta?.changes) {
      const items = parseJson(order.items_json, []);
      for (const item of Array.isArray(items) ? items : []) {
        await env.DB.prepare(`UPDATE products SET stock = MAX(stock - ?, 0), updated_at = ${NOW} WHERE id = ?`).bind(item.quantity, item.productId).run();
      }
    }

    const fresh = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(order.id).first();
    return json(request, env, { verified: true, order: orderView(fresh) });
  } catch (error) {
    console.error("Payment verification failed", error);
    return internalError(request, env);
  }
}
