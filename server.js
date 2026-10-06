const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
let submissions = [];
const sseClients = [];
const visitors = new Map();

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function getActiveVisitors() { return visitors.size; }

function cleanStaleVisitors() {
  const now = Date.now();
  for (const [id, ts] of visitors) {
    if (now - ts > 15000) visitors.delete(id);
  }
}
setInterval(() => {
  cleanStaleVisitors();
  broadcast({ type: "visitors", activeVisitors: getActiveVisitors() });
}, 5000);

function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => res.write(msg));
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // SSE endpoint for admin
  if (req.url === "/api/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(`data: ${JSON.stringify({ type: "init", submissions, activeVisitors: getActiveVisitors() })}\n\n`);
    sseClients.push(res);
    req.on("close", () => {
      const i = sseClients.indexOf(res);
      if (i !== -1) sseClients.splice(i, 1);
    });
    return;
  }

  // Track visitor - assigns a visitor ID
  if (req.url === "/api/visit") {
    const vid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    visitors.set(vid, Date.now());
    broadcast({ type: "visitors", activeVisitors: getActiveVisitors() });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, vid }));
    return;
  }

  // Heartbeat - visitor sends this every 10s to stay "active"
  if (req.url === "/api/heartbeat" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { vid } = JSON.parse(body);
        if (vid && visitors.has(vid)) {
          visitors.set(vid, Date.now());
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      }
    });
    return;
  }

  // Visitor leave
  if (req.url === "/api/leave" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { vid } = JSON.parse(body);
        if (vid) visitors.delete(vid);
      } catch {}
      broadcast({ type: "visitors", activeVisitors: getActiveVisitors() });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // Form submission
  if (req.url === "/api/submit" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const entry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          locationCode: data.locationCode || "",
          violationNumber: data.violationNumber || "",
          lastName: data.lastName || "",
          officerName: data.officerName || "",
          officerNumber: data.officerNumber || "",
          ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"] || "",
        };
        submissions.unshift(entry);
        broadcast({ type: "submission", entry });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // Get all submissions
  if (req.url === "/api/submissions") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(submissions));
    return;
  }

  // Get active visitors count
  if (req.url === "/api/visitors") {
    cleanStaleVisitors();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ activeVisitors: getActiveVisitors() }));
    return;
  }

  // Static files
  let filePath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin panel at /admin.html`);
});
