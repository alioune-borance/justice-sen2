const BACKEND_URL = "http://98.94.8.107:8090";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  const backendUrl = `${BACKEND_URL}${req.url}`;

  const headers = {
    "Content-Type": "application/json",
  };

  if (req.headers["authorization"]) {
    headers["authorization"] = req.headers["authorization"];
  }
  if (req.headers["cookie"]) {
    headers["cookie"] = req.headers["cookie"];
  }

  const options = {
    method: req.method,
    headers,
  };

  if (req.body && ["POST", "PUT", "PATCH"].includes(req.method)) {
    options.body = JSON.stringify(req.body);
  }

  try {
    const backendRes = await fetch(backendUrl, options);

    // Transmettre les cookies (refresh token)
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) res.setHeader("set-cookie", setCookie);

    const contentType = backendRes.headers.get("content-type");
    if (contentType) res.setHeader("content-type", contentType);

    const body = await backendRes.text();
    res.status(backendRes.status).send(body);
  } catch (err) {
    res.status(502).json({ error: "Backend inaccessible", details: err.message });
  }
}
