export default async function handler(req, res) {
  const BACKEND = "http://98.94.8.107:8090";
  
  // 1. On récupère uniquement le chemin sans les paramètres ?path=...
  // req.url ressemble à "/api/auth/login?path=auth%2Flogin"
  let purePath = req.url.split('?')[0]; 

  // 2. Sécurité : On s'assure qu'il y a bien un slash à la fin si absent
  if (!purePath.endsWith('/')) {
    purePath += '/';
  }

  // 3. On construit l'URL finale
  // targetUrl deviendra : http://98.94.8.107:8090/api/auth/login/
  const targetUrl = `${BACKEND}${purePath}`;

  console.log("--- PROXY LOG START ---");
  console.log("Method:", req.method);
  console.log("Targeting:", targetUrl);

  const options = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      // On transmet les credentials si présents
      "Authorization": req.headers["authorization"] || "",
      "Cookie": req.headers["cookie"] || "",
    }
  };

  // 4. Gestion du Body pour les méthodes d'écriture
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const backendRes = await fetch(targetUrl, options);
    const data = await backendRes.text();

    console.log("Backend Status:", backendRes.status);
    
    // On propage le content-type du backend (ex: application/json)
    const contentType = backendRes.headers.get("content-type");
    if (contentType) res.setHeader("content-type", contentType);

    return res.status(backendRes.status).send(data);
  } catch (err) {
    console.error("Proxy Error:", err.message);
    return res.status(502).json({ error: "Proxy Error", details: err.message });
  }
}