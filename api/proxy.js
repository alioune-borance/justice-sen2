export default async function handler(req, res) {
  const BACKEND = "http://98.94.8.107:8090";
  
  // 1. On récupère le chemin pur SANS les paramètres query (?path=...)
  const urlParts = req.url.split('?');
  const purePath = urlParts[0]; // Ceci donne "/api/auth/login"

  // 2. On retire le préfixe "/api" pour le backend (Ajuste ici si ton backend ATTEND /api)
  // Si ton backend attend http://98.94.8.107:8090/auth/login, garde la ligne suivante :
  const backendPath = purePath.replace(/^\/api/, ''); 
  
  // 3. Reconstruction de l'URL cible
  const targetUrl = `${BACKEND}${backendPath}`;

  console.log("--- PROXY LOG START ---");
  console.log("Method:", req.method);
  console.log("Original URL:", req.url);
  console.log("Cleaned Target:", targetUrl);

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

    console.log("Backend Response Status:", backendRes.status);
    
    // On renvoie exactement ce que le backend a dit
    return res.status(backendRes.status).send(data);
  } catch (err) {
    console.error("Proxy Fetch Error:", err.message);
    return res.status(502).json({ error: "Proxy Error", message: err.message });
  }
}