import { jsonResponse, errorResponse, corsHeaders } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    if (!env.DB) {
      return errorResponse('Database binding missing', 503);
    }

    const body = await request.json();
    const { customerId, items, totalAmount, shippingAddress } = body;

    if (!items || items.length === 0 || !totalAmount) {
      return errorResponse('Invalid order payload', 400);
    }

    const orderId = 'ord_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const orderNumber = 'SZ-' + Math.floor(100000 + Math.random() * 900000);

    // Insert pending order into D1 database
    await env.DB.prepare(
      `INSERT INTO orders (id, order_number, customer_id, items_json, total_amount, payment_status, delivery_status, created_at) 
       VALUES (?, ?, ?, ?, ?, 'Pending', 'Processing', datetime('now'))`
    ).bind(
      orderId,
      orderNumber,
      customerId || 'guest',
      JSON.stringify(items),
      totalAmount
    ).run();

    return jsonResponse({
      success: true,
      orderId,
      orderNumber,
      amount: totalAmount,
      currency: 'INR'
    }, 200, request);

  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, { headers: corsHeaders(request) });
}