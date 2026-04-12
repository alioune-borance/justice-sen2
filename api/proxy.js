export default async function handler(req, res) {
    const BACKEND_URL = "http://98.94.8.107:8090";

    // 1. On récupère le chemin complet (ex: /api/auth/login/)
    // req.url contient déjà tout ce qui suit le domaine
    const path = req.url;

    // 2. Construction de l'URL cible
    // On s'assure qu'il n'y a pas de double slash si BACKEND_URL finit par /
    const targetUrl = `${BACKEND_URL.replace(/\/$/, '')}${path}`;

    console.log(`DEBUG: Proxying ${req.method} request to: ${targetUrl}`);

    // 3. Préparation des headers
    const headers = {
        "Content-Type": "application/json",
    };

    // On transfère l'autorisation et les cookies s'ils existent
    if (req.headers["authorization"]) headers["authorization"] = req.headers["authorization"];
    if (req.headers["cookie"]) headers["cookie"] = req.headers["cookie"];

    // 4. Configuration de la requête de transfert
    const options = {
        method: req.method,
        headers: headers,
    };

    // 5. Gestion du corps (Body) pour POST, PUT, PATCH
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
        // Vercel parse automatiquement le body. On doit le re-transformer en string.
        options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    try {
        const backendRes = await fetch(targetUrl, options);
        const data = await backendRes.text(); // On récupère en texte pour éviter les erreurs de parsing

        // 6. Transmission des headers de réponse importants (comme les cookies)
        const setCookie = backendRes.headers.get("set-cookie");
        if (setCookie) res.setHeader("set-cookie", setCookie);
        
        const contentType = backendRes.headers.get("content-type");
        if (contentType) res.setHeader("content-type", contentType);

        // 7. Envoi de la réponse au front-end
        return res.status(backendRes.status).send(data);

    } catch (error) {
        console.error("PROXY ERROR:", error);
        return res.status(502).json({ 
            error: "Le proxy n'a pas pu contacter le backend", 
            details: error.message,
            attemptedUrl: targetUrl 
        });
    }
}