const BACKEND = "http://98.94.8.107:8090";

export default async function handler(req, res) {
  // req.query.path est un tableau : ["auth", "login"]
  const segments = req.query.path || [];
  const targetPath = "/api/" + segments.join("/") + "/";
  const targetUrl = BACKEND + targetPath;

  const headers = { "Content-Type": "application/json" };
  if (req.headers["authorization"]) {
    headers["authorization"] = req.headers["authorization"];
  }
  if (req.headers["cookie"]) {
    headers["cookie"] = req.headers["cookie"];
  }

  const options = { method: req.method, headers };

  if (req.body && ["POST", "PUT", "PATCH"].includes(req.method)) {
    options.body = JSON.stringify(req.body);
  }

  try {
    const backendRes = await fetch(targetUrl, options);

    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) res.setHeader("set-cookie", setCookie);

    const contentType = backendRes.headers.get("content-type") || "application/json";
    res.setHeader("content-type", contentType);

    const body = await backendRes.text();
    res.status(backendRes.status).send(body);
  } catch (err) {
    res.status(502).json({ error: "Backend inaccessible", details: err.message });
  }
}
