// API pública de la tienda: crear pedidos, contar visitas y servir imágenes subidas.
import { createOrder } from "../lib/catalog.js";
import { cmd, dbConfigured, K, rateLimit } from "../lib/db.js";
import { query, body, ip, send } from "../lib/http.js";

const today = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10); // hora Colombia

export default async function handler(req, res) {
  const a = query(req).a;
  try {
    if (a === "order" && req.method === "POST") {
      if (!dbConfigured()) return send(res, 503, { error: "NO_DB" });
      if (!(await rateLimit("pedido:" + ip(req), 8, 600))) return send(res, 429, { error: "Demasiados pedidos seguidos. Intenta en unos minutos." });
      const o = await createOrder(await body(req));
      return send(res, 200, { ok: true, numero: o.numero, total: o.total, subtotal: o.subtotal, descuento: o.descuento, envio: o.envio, envioPorConfirmar: o.envioPorConfirmar, items: o.items.map((i) => ({ nombre: i.nombre, unidades: i.unidades, cantidad: i.cantidad, total: i.total })), metodoPago: o.metodoPago });
    }
    if (a === "track" && req.method === "POST") {
      if (dbConfigured()) await cmd("INCR", K.pv(today()));
      return send(res, 204, "");
    }
    if (a === "img") {
      const id = String(query(req).id || "").replace(/[^a-z0-9-]/gi, "");
      const raw = id && dbConfigured() ? await cmd("GET", K.img(id)) : null;
      if (!raw) return send(res, 404, "No encontrada", { "Content-Type": "text/plain" });
      const { type, data } = JSON.parse(raw);
      return send(res, 200, Buffer.from(data, "base64"), { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" });
    }
    return send(res, 404, { error: "Ruta no encontrada" });
  } catch (e) {
    console.error(e);
    return send(res, e.status || 500, { error: e.status ? e.message : "No pudimos procesar la solicitud." });
  }
}
