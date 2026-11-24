// Servidor de la tienda fuera de Vercel (respaldo en Render, o pruebas locales).
// Lee las rutas, redirecciones y cabeceras de vercel.json, así se comporta igual que en Vercel.
//
//   Local:   NUTRELL_DB=memory node tools/servidor.mjs   →  http://localhost:3000
//   Render:  npm start   (usa las variables REDIS_URL y WOMPI_* del servicio)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3000);
const PROD = !!process.env.RENDER || process.env.NODE_ENV === "production";
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };
const PUBLIC_DIRS = ["/assets/", "/admin/"];
const api = {};
for (const n of ["page", "store", "admin", "mayoristas"]) api[n] = (await import(path.join(ROOT, "api", n + ".js"))).default;

// ---------- Reglas de vercel.json ----------
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
function compile(src) {
  const names = [];
  let re = "";
  for (const part of src.split(/(:[a-zA-Z_]\w*(?:\([^)]*\))?)/)) {
    const m = /^:([a-zA-Z_]\w*)(?:\(([^)]*)\))?$/.exec(part);
    if (m) { names.push(m[1]); re += `(${m[2] || "[^/]+"})`; }
    else re += part.replace(/\\\./g, "\u0000").replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\u0000/g, "\\.").replace(/\\\(\.\\\*\\\)/g, "(.*)");
  }
  return { re: new RegExp(`^${re}$`), names };
}
const rules = (list) => (list || []).map((r) => ({ ...r, ...compile(r.source) }));
const REDIRECTS = rules(cfg.redirects), REWRITES = rules(cfg.rewrites), HEADERS = rules(cfg.headers);
const apply = (dest, names, m) => names.reduce((s, n, i) => s.split(`:${n}`).join(encodeURIComponent(m[i + 1])), dest);

// ---------- Caché en memoria de páginas (equivale al CDN de Vercel) ----------
const cache = new Map();
function cached(key) { const c = cache.get(key); if (c && c.exp > Date.now()) return c; if (c) cache.delete(key); return null; }

function send(req, res, status, headers, body) {
  const type = String(headers["Content-Type"] || headers["content-type"] || "");
  const gz = body.length > 1024 && /text|javascript|json|xml|svg/.test(type) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  if (gz) { body = zlib.gzipSync(body); headers["Content-Encoding"] = "gzip"; headers["Vary"] = "Accept-Encoding"; }
  headers["Content-Length"] = body.length;
  res.writeHead(status, headers); res.end(req.method === "HEAD" ? undefined : body);
}

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, "http://x");
    let p = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : u.pathname;
    if (p === "/healthz") { res.writeHead(200, { "Content-Type": "text/plain" }); res.end("ok"); return; }
    // En Render, forzar HTTPS
    if (PROD && req.headers["x-forwarded-proto"] === "http") { res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` }); res.end(); return; }
    // Cabeceras de vercel.json
    const extra = {};
    for (const h of HEADERS) if (h.re.test(p)) for (const { key, value } of h.headers) extra[key] = value;
    // Redirecciones
    for (const r of REDIRECTS) { const m = r.re.exec(p); if (m) { res.writeHead(r.permanent ? 308 : 307, { Location: apply(r.destination, r.names, m) + u.search }); res.end(); return; } }
    // Reescrituras (la primera que coincida)
    let target = u;
    for (const r of REWRITES) {
      const m = r.re.exec(p);
      if (m) { const d = apply(r.destination, r.names, m); target = new URL(d + (u.search ? (d.includes("?") ? "&" : "?") + u.search.slice(1) : ""), "http://x"); break; }
    }
    const am = target.pathname.match(/^\/api\/(page|store|admin|mayoristas)$/);
    if (am) {
      req.url = target.pathname + target.search;
      const key = am[1] === "page" && req.method === "GET" ? req.url : null;
      const hit = key && cached(key);
      if (hit) return send(req, res, hit.status, { ...hit.headers, ...extra, "X-Cache": "HIT" }, hit.body);
      // Captura la respuesta para comprimirla y guardarla en caché
      const chunks = []; let status = 200; const hdrs = {};
      const fake = {
        get statusCode() { return status; }, set statusCode(v) { status = v; },
        setHeader: (k, v) => { hdrs[k] = v; }, getHeader: (k) => hdrs[k],
        writeHead: (s, h) => { status = s; Object.assign(hdrs, h || {}); return fake; },
        write: (c) => { chunks.push(Buffer.from(c)); return true; },
        end: (c) => { if (c) chunks.push(Buffer.from(c)); fake._done(); },
      };
      await new Promise((resolve, reject) => { fake._done = resolve; Promise.resolve(api[am[1]](req, fake)).catch(reject); });
      const body = Buffer.concat(chunks);
      const cc = String(hdrs["Cache-Control"] || "");
      const ttl = /s-maxage=(\d+)/.exec(cc);
      if (key && status === 200 && /public/.test(cc) && ttl) {
        cache.set(key, { status, headers: { ...hdrs }, body, exp: Date.now() + Number(ttl[1]) * 1000 });
        if (cache.size > 500) cache.delete(cache.keys().next().value);
      }
      return send(req, res, status, { ...hdrs, ...extra }, body);
    }
    // Archivos estáticos
    const rel = decodeURIComponent(target.pathname);
    const file = path.join(ROOT, rel);
    const allowed = PUBLIC_DIRS.some((d) => rel.startsWith(d)) || rel === "/admin/index.html";
    if (!allowed || !file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      req.url = "/api/page?r=product&slug=no-existe";
      return api.page(req, res);
    }
    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    return send(req, res, 200, { "Content-Type": type, ...extra }, fs.readFileSync(file));
  } catch (e) {
    console.error(e);
    if (!res.headersSent) { res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Error del servidor"); }
  }
}).listen(PORT, "0.0.0.0", () => console.log(`Nutrell en el puerto ${PORT}${PROD ? " (producción)" : ""}`));
