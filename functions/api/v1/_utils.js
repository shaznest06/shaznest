const ADMIN_COOKIE = "sn_admin_session";
const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

function allowedOrigins(request, env) {
  const ownOrigin = new URL(request.url).origin;
  const configured = String(env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([ownOrigin, ...configured]);
}

export function corsAllowed(request, env) {
  const origin = request.headers.get("Origin");
  return !origin || allowedOrigins(request, env).has(origin);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && corsAllowed(request, env)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

export function empty(request, env, status = 204) {
  return new Response(null, { status, headers: corsHeaders(request, env) });
}

export function json(request, env, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export function options(request, env) {
  if (!corsAllowed(request, env)) return json(request, env, { error: "Origin is not allowed." }, 403);
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

export function rejectOrigin(request, env) {
  return corsAllowed(request, env) ? null : json(request, env, { error: "Origin is not allowed." }, 403);
}

export function methodNotAllowed(request, env, allow) {
  return json(request, env, { error: "Method not allowed." }, 405, { Allow: [...allow, "OPTIONS"].join(", ") });
}

export function missingDatabase(request, env) {
  return env.DB ? null : json(request, env, { error: "D1 database binding is missing. Configure the Pages binding named DB." }, 503);
}

export function parseJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

export async function readFormOrJson(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const raw = form.get("product");
    const product = typeof raw === "string" ? parseJson(raw, null) : null;
    return { product, image: form.get("image") };
  }
  return { product: await readJson(request), image: null };
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function hasAdminSecret(env) {
  return typeof env.ADMIN_SECRET === "string" && env.ADMIN_SECRET.length >= 16;
}

export async function issueAdminCookie(env, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + ADMIN_SESSION_SECONDS;
  const payload = String(expiresAt);
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(env.ADMIN_SECRET), new TextEncoder().encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminRequest(request, env, now = Date.now()) {
  if (!hasAdminSecret(env)) return false;
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE}=`));
  if (!cookie) return false;
  const token = cookie.slice(ADMIN_COOKIE.length + 1);
  const [expiresAt, encodedSignature, extra] = token.split(".");
  if (!expiresAt || !encodedSignature || extra !== undefined || !/^\d+$/.test(expiresAt) || Number(expiresAt) <= Math.floor(now / 1000)) return false;
  try {
    return await crypto.subtle.verify(
      "HMAC",
      await hmacKey(env.ADMIN_SECRET),
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(expiresAt),
    );
  } catch {
    return false;
  }
}

export function adminCookie(request, token, maxAge = ADMIN_SESSION_SECONDS) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${token}; Path=/api/v1/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export async function requireAdmin(request, env) {
  if (!hasAdminSecret(env)) return json(request, env, { error: "Admin authentication is not configured. Set ADMIN_SECRET (minimum 16 characters)." }, 503);
  if (!(await verifyAdminRequest(request, env))) return json(request, env, { error: "Administrator authentication required." }, 401);
  return null;
}

export function parseImages(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return parseJson(value, []);
  return [];
}

export function slugify(value) {
  return String(value || "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function validImageFile(file, maxBytes = 5 * 1024 * 1024) {
  return file instanceof File && file.size > 0 && file.size <= maxBytes && [
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif",
  ].includes(file.type);
}

export async function storeImage(env, file, prefix) {
  const bucket = env.ASSETS || env.IMAGES;
  const baseUrl = String(env.PUBLIC_ASSET_BASE_URL || "").replace(/\/$/, "");
  if (!bucket || !baseUrl) return { error: "Image storage is not configured. Bind an R2 bucket as ASSETS and set PUBLIC_ASSET_BASE_URL." };
  const extension = (file.name?.split(".").pop() || "img").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "img";
  const key = `${prefix}/${crypto.randomUUID()}.${extension}`;
  await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return { key, url: `${baseUrl}/${key}` };
}

export async function deleteStoredImage(env, imageUrl) {
  const bucket = env.ASSETS || env.IMAGES;
  const baseUrl = String(env.PUBLIC_ASSET_BASE_URL || "").replace(/\/$/, "");
  if (!bucket || !baseUrl || typeof imageUrl !== "string" || !imageUrl.startsWith(`${baseUrl}/`)) return;
  const key = imageUrl.slice(baseUrl.length + 1);
  if (key && !key.includes("..")) await bucket.delete(key);
}

export function internalError(request, env) {
  return json(request, env, { error: "An unexpected server error occurred." }, 500);
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}