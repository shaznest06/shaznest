import { internalError, json, missingDatabase, options, rejectOrigin, requireAdmin } from "../../_utils.js";

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
    await env.DB.prepare("UPDATE visitor_sessions SET active = 0 WHERE active = 1 AND expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')").run();
    const [countResult, breakdownResult, actionsResult, salesResult, activeOrdersResult, pipelineResult] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS count FROM visitor_sessions WHERE active = 1 AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"),
      env.DB.prepare("SELECT page, COUNT(*) AS count FROM visitor_sessions WHERE active = 1 AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now') GROUP BY page"),
      env.DB.prepare("SELECT description, created_at AS timestamp FROM visitor_actions ORDER BY created_at DESC LIMIT 8"),
      env.DB.prepare("SELECT COALESCE(SUM(total_amount), 0) AS total_sales, COUNT(*) AS paid_orders, COALESCE(AVG(total_amount), 0) AS average_order_value FROM orders WHERE payment_status = 'paid'"),
      env.DB.prepare("SELECT COUNT(*) AS count FROM orders WHERE payment_status = 'paid' AND delivery_status != 'Delivered'"),
      env.DB.prepare("SELECT payment_status, delivery_status, COUNT(*) AS count FROM orders GROUP BY payment_status, delivery_status"),
    ]);
    const pageBreakdown = { home: 0, checkout: 0, reviews: 0, product: 0 };
    for (const row of breakdownResult.results || []) {
      if (Object.hasOwn(pageBreakdown, row.page)) pageBreakdown[row.page] = row.count;
    }
    return json(request, env, {
      activeVisitors: countResult.results?.[0]?.count ?? 0,
      pageBreakdown,
      totalSales: salesResult.results?.[0]?.total_sales ?? 0,
      paidOrders: salesResult.results?.[0]?.paid_orders ?? 0,
      averageOrderValue: salesResult.results?.[0]?.average_order_value ?? 0,
      activeOrders: activeOrdersResult.results?.[0]?.count ?? 0,
      orderPipeline: pipelineResult.results || [],
      recentActions: (actionsResult.results || []).map((row) => ({ description: row.description, timestamp: row.timestamp })),
    });
  } catch {
    return internalError(request, env);
  }
}