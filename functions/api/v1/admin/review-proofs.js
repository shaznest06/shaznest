import { corsAllowed, deleteStoredImage, internalError, json, methodNotAllowed, missingDatabase, options, rejectOrigin, requireAdmin, storeImage, validImageFile } from "../_utils.js";

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
      const { results } = await env.DB.prepare("SELECT id, image_url, verified, created_at FROM review_proofs ORDER BY verified ASC, created_at DESC LIMIT 250").all();
      return json(request, env, { proofs: results || [] });
    }

    if (request.method === "PUT") {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      let body;
      try { body = await request.json(); } catch { body = null; }
      if (!id || typeof body?.verified !== "boolean") return json(request, env, { error: "Proof id and boolean verified status are required." }, 400);
      const result = await env.DB.prepare("UPDATE review_proofs SET verified = ? WHERE id = ?").bind(body.verified ? 1 : 0, id).run();
      if (!result.meta?.changes) return json(request, env, { error: "Proof was not found or is unchanged." }, 404);
      return json(request, env, { id, verified: body.verified });
    }

    if (request.method === "DELETE") {
      const id = new URL(request.url).searchParams.get("id");
      if (!id) return json(request, env, { error: "Proof id is required." }, 400);
      const proof = await env.DB.prepare("SELECT image_url FROM review_proofs WHERE id = ?").bind(id).first();
      if (!proof) return json(request, env, { error: "Proof not found." }, 404);
      await env.DB.prepare("DELETE FROM review_proofs WHERE id = ?").bind(id).run();
      await deleteStoredImage(env, proof.image_url);
      return json(request, env, { id, rejected: true });
    }

    if (request.method !== "POST") return methodNotAllowed(request, env, ["GET", "POST", "PUT", "DELETE"]);
    const form = await request.formData();
    if (form.get("permission") !== "on") return json(request, env, { error: "Customer permission is required." }, 400);
    const file = form.get("image");
    if (!validImageFile(file)) return json(request, env, { error: "Choose a valid image smaller than 5 MB." }, 400);
    const stored = await storeImage(env, file, "review-proofs");
    if (stored.error) return json(request, env, { error: stored.error }, 503);
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO review_proofs (id, image_url, verified) VALUES (?, ?, 0)").bind(id, stored.url).run();
    return json(request, env, { id, verified: false, status: "pending_review" }, 201);
  } catch {
    return internalError(request, env);
  }
}