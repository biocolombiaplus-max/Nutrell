// API del portal de mayoristas: solicitud, ingreso, catálogo con precios del nivel y pedidos.
import { registrar, login, sessionCookie, clearCookie, currentMay, portalData, crearPedido } from "../lib/mayoristas.js";
import { getOrder, payParams } from "../lib/catalog.js";
import { dbConfigured, rateLimit } from "../lib/db.js";
import { query, body, ip, send } from "../lib/http.js";

const origin = (req) => {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const proto = String(req.headers["x-forwarded-proto"] || (host.startsWith("localhost") ? "http" : "https")).split(",")[0].trim();
  return `${proto}://${host}`;
};

export default async function handler(req, res) {
  const a = query(req).a;
  try {
    if (!dbConfigured()) return send(res, 503, { error: "El portal de mayoristas no está disponible en este momento." });
    if (a === "registro" && req.method === "POST") {
      if (!(await rateLimit("may-reg:" + ip(req), 5, 3600))) return send(res, 429, { error: "Demasiadas solicitudes. Intenta más tarde." });
      await registrar(await body(req));
      return send(res, 200, { ok: true });
    }
    if (a === "login" && req.method === "POST") {
      if (!(await rateLimit("may-login:" + ip(req), 10, 900))) return send(res, 429, { error: "Demasiados intentos. Espera 15 minutos." });
      const { email, password } = await body(req);
      const m = await login(email, password);
      return send(res, 200, { ok: true }, { "Set-Cookie": await sessionCookie(req, m) });
    }
    if (a === "logout") return send(res, 200, { ok: true }, { "Set-Cookie": clearCookie() });

    const m = await currentMay(req);
    if (!m) return send(res, 401, { error: "Ingresa con tu cuenta de mayorista." });
    if (a === "me") return send(res, 200, await portalData(m));
    if (a === "pedido" && req.method === "POST") {
      if (!(await rateLimit("may-ped:" + m.id, 20, 3600))) return send(res, 429, { error: "Demasiados pedidos seguidos." });
      return send(res, 200, await crearPedido(m, await body(req), origin(req)));
    }
    if (a === "pagar" && req.method === "POST") {
      const { numero } = await body(req);
      const o = await getOrder(numero);
      if (!o || o.mayorista?.id !== m.id || !o.online) return send(res, 404, { error: "Pedido no encontrado." });
      return send(res, 200, { ok: true, pay: await payParams(o, origin(req)) });
    }
    return send(res, 404, { error: "Ruta no encontrada" });
  } catch (e) {
    console.error(e);
    return send(res, e.status || 500, { error: e.status ? e.message : "No pudimos procesar la solicitud." });
  }
}
