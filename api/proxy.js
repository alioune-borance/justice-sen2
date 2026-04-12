export default async function handler(req, res) {
  const BACKEND = "http://98.94.8.107:8090";
  
  // On récupère tout ce qui est après le domaine (ex: /api/auth/login/)
  const fullPath = req.url;

  console.log("--- PROXY LOG START ---");
  console.log("Method:", req.method);
  console.log("Full Path:", fullPath);
  
  const targetUrl = `${BACKEND}${fullPath}`;
  console.log("Targeting:", targetUrl);

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

    console.log("Backend Status:", backendRes.status);
    
    return res.status(backendRes.status).send(data);
  } catch (err) {
    console.error("Proxy Error:", err.message);
    return res.status(502).json({ error: "Proxy Error", message: err.message });
  }
}