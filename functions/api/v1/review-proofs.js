import { corsAllowed, internalError, json, methodNotAllowed, missingDatabase, options, rejectOrigin } from "./_utils.js";

export async function onRequestOptions({ request, env }) {
  return options(request, env);
}

export async function onRequest({ request, env }) {
  const originError = rejectOrigin(request, env);
  if (originError) return originError;
  if (request.method === "OPTIONS") return options(request, env);
  if (request.method !== "GET") return methodNotAllowed(request, env, ["GET"]);
  const databaseError = missingDatabase(request, env);
  if (databaseError) return databaseError;

  try {
    const { results } = await env.DB.prepare("SELECT id, image_url, verified, created_at FROM review_proofs WHERE verified = 1 ORDER BY created_at DESC LIMIT 100").all();
    return json(request, env, { proofs: (results || []).map((proof) => ({ id: proof.id, src: proof.image_url, alt: "Verified WhatsApp customer conversation", verified: true, createdAt: proof.created_at })) });
  } catch {
    return internalError(request, env);
  }
}