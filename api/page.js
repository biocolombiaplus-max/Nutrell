// Renderiza la tienda: inicio, productos, sitemap y robots.
import { getCatalog, bySlug } from "../lib/catalog.js";
import { renderIndex, renderProduct, render404, renderSitemap, renderRobots } from "../lib/render.js";
import { query, send } from "../lib/http.js";

const CACHE = "public, s-maxage=20, stale-while-revalidate=86400";

export default async function handler(req, res) {
  try {
    const q = query(req);
    const c = await getCatalog();
    const r = q.r || "index";
    if (r === "sitemap") return send(res, 200, renderSitemap(c), { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": CACHE });
    if (r === "robots") return send(res, 200, renderRobots(c), { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": CACHE });
    const html = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": CACHE };
    if (r === "index") return send(res, 200, renderIndex(c), html);
    const slug = String(q.slug || "").toLowerCase();
    const p = bySlug(c, slug);
    if (p && p.activo !== false) return send(res, 200, renderProduct(c, p), html);
    return send(res, 404, render404(c), html);
  } catch (e) {
    console.error(e);
    return send(res, 500, "<h1>Estamos actualizando la tienda</h1><p>Vuelve a intentar en unos segundos.</p>", { "Content-Type": "text/html; charset=utf-8" });
  }
}
