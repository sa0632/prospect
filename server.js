require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 3000;

// Load all the api handlers
const search = require("./api/functions/search");
const auth = require("./api/functions/auth");
const authCallback = require("./api/functions/auth-callback");
const gmailDraft = require("./api/functions/gmail-draft");
const generateEmail = require("./api/functions/generate-email");
const sendDirect = require("./api/functions/send-direct");
const gmailInbox = require("./api/functions/gmail-inbox");
const gmailMessage = require("./api/functions/gmail-message");
const gmailMarkRead = require("./api/functions/gmail-mark-read");

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // ── CORS headers so the browser doesn't block requests ──
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // ── API routes ──────────────────────────────────────────
  if (pathname === "/api/search") {
    const event = { queryStringParameters: parsed.query };
    const result = await search.handler(event);
    res.writeHead(result.statusCode, { "Content-Type": "application/json" });
    res.end(result.body);
    return;
  }

  if (pathname === "/api/auth") {
    const result = await auth.handler();
    res.writeHead(result.statusCode, result.headers || {});
    res.end(result.body || "");
    return;
  }

  if (pathname === "/api/auth-callback") {
    const event = { queryStringParameters: parsed.query };
    const result = await authCallback.handler(event);
    res.writeHead(result.statusCode, result.headers || {});
    res.end(result.body || "");
    return;
  }

  if (pathname === "/api/gmail-draft") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      const event = { httpMethod: "POST", body };
      const result = await gmailDraft.handler(event);
      res.writeHead(result.statusCode, { "Content-Type": "application/json" });
      res.end(result.body);
    });
    return;
  }

  if (pathname === "/api/generate-email") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      const event = { httpMethod: "POST", body };
      const result = await generateEmail.handler(event);
      res.writeHead(result.statusCode, { "Content-Type": "application/json" });
      res.end(result.body);
    });
    return;
  }

  if (pathname === "/api/send-direct") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      const event = { httpMethod: "POST", body };
      const result = await sendDirect.handler(event);
      res.writeHead(result.statusCode, { "Content-Type": "application/json" });
      res.end(result.body);
    });
    return;
  }

  if (pathname === "/api/gmail-inbox") {
    const event = { queryStringParameters: parsed.query };
    const result = await gmailInbox.handler(event);
    res.writeHead(result.statusCode, { "Content-Type": "application/json" });
    res.end(result.body);
    return;
  }

  if (pathname === "/api/gmail-message") {
    const event = { queryStringParameters: parsed.query };
    const result = await gmailMessage.handler(event);
    res.writeHead(result.statusCode, { "Content-Type": "application/json" });
    res.end(result.body);
    return;
  }

  if (pathname === "/api/gmail-mark-read") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      const event = { httpMethod: "POST", body };
      const result = await gmailMarkRead.handler(event);
      res.writeHead(result.statusCode, { "Content-Type": "application/json" });
      res.end(result.body);
    });
    return;
  }

  // ── Serve static files (index.html, css, etc.) ─────────
  let filePath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    const types = {
      ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
      ".download": "application/javascript", ".json": "application/json",
      ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon",
      ".svg": "image/svg+xml", ".woff": "font/woff", ".woff2": "font/woff2"
    };
    res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Prospect is running!`);
  console.log(`👉 Open this in your browser: http://localhost:${PORT}\n`);
});