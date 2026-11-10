// Proxy Vercel : /api/* -> backend Django (réécriture définie dans vercel.json).
// Le navigateur ne parle qu'au domaine du front : les cookies (refresh, CSRF) restent same-origin.
//
// Variable d'environnement Vercel requise :
//   BACKEND_URL  origine du backend, de préférence en HTTPS (ex. https://api.exemple.sn)
// Côté backend : CSRF_TRUSTED_ORIGINS doit contenir l'origine du front, et USE_X_FORWARDED_PROTO=True
// si le backend doit considérer la requête d'origine comme HTTPS.

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "x-csrftoken",
];

const FORWARDED_RESPONSE_HEADERS = [
  "cache-control",
  "content-disposition",
  "content-type",
  "location",
  "retry-after",
  "vary",
  "www-authenticate",
];

// Corps brut (JSON, multipart, binaire) : req.body n'est jamais lu pour ne pas déclencher le parsing.
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function buildTargetUrl(req, backendUrl) {
  const incoming = new URL(req.url, "http://proxy.local");
  // Paramètre ajouté par la réécriture "/api/:path*" de vercel.json, inconnu du backend
  incoming.searchParams.delete("path");

  let pathname = incoming.pathname;
  // vercel.json retire le slash final ; les routes Django l'exigent (APPEND_SLASH=False)
  if (!pathname.endsWith("/")) pathname += "/";

  const search = incoming.searchParams.toString();
  return new URL(pathname + (search ? `?${search}` : ""), backendUrl);
}

export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ detail: "Proxy non configuré (BACKEND_URL manquant)." }));
  }

  const headers = {};
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers[name];
    if (value) headers[name] = Array.isArray(value) ? value.join(", ") : value;
  }
  headers["x-forwarded-proto"] = "https";
  if (req.headers.host) headers["x-forwarded-host"] = req.headers.host;
  const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
  if (clientIp) headers["x-forwarded-for"] = clientIp;

  const options = { method: req.method, headers, redirect: "manual" };
  if (!["GET", "HEAD"].includes(req.method)) {
    const body = await readRawBody(req);
    if (body.length > 0) options.body = body;
  }

  let backendRes;
  try {
    backendRes = await fetch(buildTargetUrl(req, backendUrl), options);
  } catch (err) {
    console.error("Proxy: backend injoignable:", err.message);
    res.statusCode = 502;
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ detail: "Serveur injoignable." }));
  }

  res.statusCode = backendRes.status;
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = backendRes.headers.get(name);
    if (value) res.setHeader(name, value);
  }
  // Plusieurs Set-Cookie possibles (refresh + CSRF) : ne pas les fusionner
  const cookies = backendRes.headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) res.setHeader("set-cookie", cookies);

  const payload = Buffer.from(await backendRes.arrayBuffer());
  return res.end(payload);
}
