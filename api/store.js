// API pública de la tienda: pedidos, pagos con Wompi, visitas e imágenes subidas.
import { createOrder, getOrder, payParams, applyTransaction } from "../lib/catalog.js";
import { wompiConfig, fetchTransaction, validEvent } from "../lib/wompi.js";
import { cmd, dbConfigured, K, rateLimit } from "../lib/db.js";
import { query, body, ip, send } from "../lib/http.js";

const today = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10); // hora Colombia
const origin = (req) => {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const proto = String(req.headers["x-forwarded-proto"] || (host.startsWith("localhost") ? "http" : "https")).split(",")[0].trim();
  return `${proto}://${host}`;
};
const summary = (o) => ({ numero: o.numero, total: o.total, subtotal: o.subtotal, descuento: o.descuento, envio: o.envio, envioPorConfirmar: o.envioPorConfirmar, pago: o.pago, estado: o.estado, metodoPago: o.metodoPago, wompi: o.wompi ? { status: o.wompi.status, metodo: o.wompi.metodo } : null, items: o.items.map((i) => ({ nombre: i.nombre, unidades: i.unidades, cantidad: i.cantidad, total: i.total, imagen: i.imagen })) });

export default async function handler(req, res) {
  const a = query(req).a;
  try {
    if (a === "order" && req.method === "POST") {
      if (!dbConfigured()) return send(res, 503, { error: "NO_DB" });
      if (!(await rateLimit("pedido:" + ip(req), 10, 600))) return send(res, 429, { error: "Demasiados pedidos seguidos. Intenta en unos minutos." });
      const data = await body(req);
      const o = await createOrder(data);
      const out = { ok: true, ...summary(o) };
      if (o.online) out.pay = await payParams(o, origin(req));
      return send(res, 200, out);
    }
    if (a === "pay" && req.method === "POST") {
      if (!(await rateLimit("pago:" + ip(req), 20, 600))) return send(res, 429, { error: "Demasiados intentos. Espera unos minutos." });
      const { numero, telefono } = await body(req);
      const o = await getOrder(numero);
      if (!o || !o.online || String(o.cliente.telefono).replace(/\D/g, "").slice(-7) !== String(telefono || "").replace(/\D/g, "").slice(-7)) return send(res, 404, { error: "Pedido no encontrado." });
      return send(res, 200, { ok: true, ...summary(o), pay: await payParams(o, origin(req)) });
    }
    if (a === "verify") {
      const id = String(query(req).id || "").replace(/[^A-Za-z0-9-]/g, "");
      if (!id) return send(res, 400, { error: "Falta la transacción." });
      const cfg = await wompiConfig();
      if (!cfg.publicKey) return send(res, 400, { error: "Pagos en línea no configurados." });
      const tx = await fetchTransaction(cfg, id);
      const o = await applyTransaction(tx);
      if (!o) return send(res, 404, { error: "No encontramos el pedido de este pago.", status: tx.status });
      return send(res, 200, { ok: true, status: tx.status, metodo: o.wompi?.metodo, mensaje: tx.status_message || "", ...summary(o) });
    }
    if (a === "wompi" && req.method === "POST") {
      // Eventos de Wompi (URL a configurar en Wompi: /webhooks/wompi)
      const ev = await body(req);
      const cfg = await wompiConfig({ fresh: true });
      if (!cfg.events || !validEvent(ev, cfg.events)) return send(res, 401, { error: "Firma inválida" });
      if (ev.event === "transaction.updated" && ev.data?.transaction) await applyTransaction(ev.data.transaction);
      return send(res, 200, { ok: true });
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
