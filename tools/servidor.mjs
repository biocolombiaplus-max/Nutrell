// Servidor local que imita a Vercel (rutas, API y archivos estáticos).
// Uso:  NUTRELL_DB=memory node tools/servidor.mjs   →  http://localhost:3000
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3000);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".svg": "image/svg+xml" };
const api = {};
for (const n of ["page", "store", "admin", "mayoristas"]) api[n] = (await import(path.join(ROOT, "api", n + ".js"))).default;

function rewrite(p) {
  if (p === "/") return "/api/page?r=index";
  if (p === "/sitemap.xml") return "/api/page?r=sitemap";
  if (p === "/robots.txt") return "/api/page?r=robots";
  if (p === "/pedido") return "/api/page?r=pedido";
  if (p === "/mayoristas") return "/api/page?r=mayoristas";
  if (p === "/mayoristas/portal") return "/api/page?r=portal";
  if (p === "/webhooks/wompi") return "/api/store?a=wompi";
  if (p === "/admin" || p === "/admin/") return "/admin/index.html";
  let m = p.match(/^\/img\/([a-z0-9-]+)$/i); if (m) return `/api/store?a=img&id=${m[1]}`;
  m = p.match(/^\/([a-z0-9-]+)$/); if (m && m[1] !== "api") return `/api/page?r=product&slug=${m[1]}`;
  return null;
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const r = rewrite(u.pathname);
  const target = r ? new URL(r + (r.includes("?") && u.search ? "&" + u.search.slice(1) : ""), "http://localhost") : u;
  const m = target.pathname.match(/^\/api\/(page|store|admin|mayoristas)$/);
  if (m) {
    req.url = target.pathname + target.search;
    try { await api[m[1]](req, res); } catch (e) { console.error(e); res.statusCode = 500; res.end("error"); }
    return;
  }
  const file = path.join(ROOT, decodeURIComponent(target.pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; res.end("No encontrado"); return; }
  res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Nutrell local en http://localhost:${PORT}`));
