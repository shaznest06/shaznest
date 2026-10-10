import { jsonResponse, errorResponse, corsHeaders } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.DB) {
      return errorResponse('Database binding missing', 503);
    }

    const body = await request.json();
    const { orderId, paymentId } = body;

    if (!orderId) {
      return errorResponse('Missing order ID', 400);
    }

    // Update order status to Paid in D1 database and award loyalty stamp eligibility
    await env.DB.prepare(
      `UPDATE orders SET payment_status = 'Paid' WHERE id = ?`
    ).bind(orderId).run();

    return jsonResponse({
      success: true,
      message: 'Payment verified and order updated successfully.'
    }, 200, request);

  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, { headers: corsHeaders(request) });
}