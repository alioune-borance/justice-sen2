const BACKEND = "http://98.94.8.107:8090";

export default async function handler(req, res) {
  // On récupère le chemin après /api/ directement depuis l'URL de la requête
  const fullPath = req.url.split('?')[0]; // ex: /api/auth/login
  const targetPath = fullPath.startsWith('/api') ? fullPath : `/api${fullPath}`;
  
  const targetUrl = `${BACKEND}${targetPath}`;

  const options = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": req.headers["authorization"] || "",
      "Cookie": req.headers["cookie"] || "",
    }
  };

  if (req.body && ["POST", "PUT", "PATCH"].includes(req.method)) {
    // Vercel parse déjà le body en JSON si le header est présent
    options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const backendRes = await fetch(targetUrl, options);
    
    // Transmission des cookies du backend vers le navigateur
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) res.setHeader("set-cookie", setCookie);

    const body = await backendRes.text();
    res.status(backendRes.status).send(body);
  } catch (err) {
    res.status(502).json({ error: "Backend inaccessible", url: targetUrl });
  }
}