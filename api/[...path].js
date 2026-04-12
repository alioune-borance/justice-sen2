export default async function handler(req, res) {
  const BACKEND_URL = "http://98.94.8.107:8090";

  // req.query.path est un tableau grâce au nom du fichier [...path].js
  // Si on appelle /api/auth/login, segments sera ["auth", "login"]
  const segments = req.query.path || [];
  const targetPath = "/" + segments.join("/");

  // On reconstruit l'URL cible (on ajoute un slash final si nécessaire selon ton API)
  const targetUrl = `${BACKEND_URL}${targetPath}${req.url.endsWith('/') ? '/' : ''}`;

  console.log(`Proxying to: ${targetUrl}`);

  const options = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": req.headers["authorization"] || "",
      "Cookie": req.headers["cookie"] || "",
    }
  };

  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const backendRes = await fetch(targetUrl, options);
    const data = await backendRes.text();

    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) res.setHeader("set-cookie", setCookie);

    return res.status(backendRes.status).send(data);
  } catch (error) {
    return res.status(502).json({ error: "Backend injoignable", url: targetUrl });
  }
}