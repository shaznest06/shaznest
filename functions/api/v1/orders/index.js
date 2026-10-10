// POST /api/v1/orders: validates the cart, prices it on the server, creates a Razorpay order
// and saves a pending order. The browser never decides the amount.
import { internalError, json, methodNotAllowed, missingDatabase, newOrderNumber, options, parseImages, readJson, rejectOrigin } from "../_utils.js";

const MOBILE = /^[6-9]\d{9}$/;
const PINCODE = /^[1-9]\d{5}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

const text = (value, min, max) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max ? trimmed : null;
};

function validate(body) {
  const c = body?.customer;
  const a = body?.shippingAddress;
  const fullName = text(c?.fullName, 2, 100);
  const email = text(c?.email, 5, 254);
  const mobile = typeof c?.mobile === "string" ? c.mobile.trim() : "";
  const address = text(a?.address, 5, 300);
  const city = text(a?.city, 2, 80);
  const state = text(a?.state, 2, 60);
  const pincode = typeof a?.pincode === "string" ? a.pincode.trim() : "";
  if (!fullName) return { error: "Please enter your full name." };
  if (!email || !EMAIL.test(email)) return { error: "Please enter a valid email address." };
  if (!MOBILE.test(mobile)) return { error: "Please enter a valid 10-digit mobile number." };
  if (!address || !city || !state) return { error: "Please enter your full delivery address." };
  if (!PINCODE.test(pincode)) return { error: "Please enter a valid 6-digit pincode." };

  const items = body?.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) return { error: "Your cart is empty or too large." };
  const lines = [];
  for (const item of items) {
    const productId = text(item?.productId, 1, 64);
    const quantity = item?.quantity;
    const colour = item?.colour == null || item.colour === "" ? null : text(item.colour, 1, 60);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10 || (item?.colour && !colour)) return { error: "One of the cart items is invalid." };
    lines.push({ productId, quantity, colour });
  }
  return { value: { fullName, email, mobile, address, city, state, pincode, lines } };
}

export async function onRequest({ request, env }) {
  const originError = rejectOrigin(request, env);
  if (originError) return originError;
  if (request.method === "OPTIONS") return options(request, env);
  if (request.method !== "POST") return methodNotAllowed(request, env, ["POST"]);
  const databaseError = missingDatabase(request, env);
  if (databaseError) return databaseError;
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return json(request, env, { error: "Online payment is not configured yet." }, 503);

  const parsed = validate(await readJson(request));
  if (parsed.error) return json(request, env, { error: parsed.error }, 400);
  const { fullName, email, mobile, address, city, state, pincode, lines } = parsed.value;

  try {
    // Price everything from the database; ignore any price or total sent by the browser.
    const ids = [...new Set(lines.map((line) => line.productId))];
    const { results } = await env.DB.prepare(
      `SELECT id, title, price, stock, active, variants_json FROM products WHERE id IN (${ids.map(() => "?").join(",")})`
    ).bind(...ids).all();
    const products = new Map((results || []).map((row) => [row.id, row]));

    const wanted = new Map();
    const orderItems = [];
    let subtotalPaise = 0;
    for (const line of lines) {
      const product = products.get(line.productId);
      if (!product || !product.active) return json(request, env, { error: "One of the items in your cart is no longer available." }, 409);
      wanted.set(line.productId, (wanted.get(line.productId) || 0) + line.quantity);
      if (wanted.get(line.productId) > product.stock) return json(request, env, { error: `Only ${product.stock} of "${product.title}" left in stock.` }, 409);

      const colours = [...new Set(parseImages(product.variants_json).map((variant) => variant?.color).filter(Boolean))];
      let colour = null;
      if (colours.length) {
        colour = colours.find((name) => name.toLowerCase() === (line.colour || "").toLowerCase()) || null;
        if (!colour) return json(request, env, { error: `Please choose an available colour for "${product.title}".` }, 400);
      }
      const unitPaise = Math.round(Number(product.price) * 100);
      subtotalPaise += unitPaise * line.quantity;
      orderItems.push({ productId: product.id, name: product.title, colour, quantity: line.quantity, unitPrice: unitPaise / 100 });
    }

    // Loyalty rewards are not applied yet: they need verified customer accounts.
    const shippingRupees = Number(env.SHIPPING_FLAT_RUPEES || 0);
    const shippingPaise = Number.isFinite(shippingRupees) && shippingRupees > 0 ? Math.round(shippingRupees * 100) : 0;
    const totalPaise = subtotalPaise + shippingPaise;
    if (totalPaise < 100) return json(request, env, { error: "The order total is too low." }, 400);

    const orderNumber = newOrderNumber();
    const razorpay = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: totalPaise, currency: "INR", receipt: orderNumber, notes: { orderNumber } }),
    });
    if (!razorpay.ok) {
      console.error("Razorpay order creation failed", razorpay.status);
      return json(request, env, { error: "We couldn't start the payment. Please try again." }, 502);
    }
    const razorpayOrder = await razorpay.json();

    const shipping = { name: fullName, phone: mobile, address, city, state, pincode, country: "IN" };
    await env.DB.prepare("INSERT INTO customers (id, email, name, address_json) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO NOTHING")
      .bind(crypto.randomUUID(), email, fullName, JSON.stringify(shipping)).run();
    const customer = await env.DB.prepare("SELECT id FROM customers WHERE email = ?").bind(email).first();

    await env.DB.prepare(
      `INSERT INTO orders (id, order_number, customer_id, items_json, total_amount, shipping_address_json, razorpay_order_id, razorpay_amount_paise, payment_status, delivery_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'Processing', ${NOW}, ${NOW})`
    ).bind(crypto.randomUUID(), orderNumber, customer.id, JSON.stringify(orderItems), totalPaise / 100, JSON.stringify(shipping), razorpayOrder.id, totalPaise).run();

    return json(request, env, { keyId: env.RAZORPAY_KEY_ID, id: razorpayOrder.id, amount: totalPaise, currency: "INR", orderNumber });
  } catch (error) {
    console.error("Order creation failed", error);
    return internalError(request, env);
  }
}
