// API del panel administrativo. Todas las acciones (salvo estado y login) requieren sesión.
import crypto from "node:crypto";
import { getCatalog, saveCatalog, listOrders, updateOrder, deleteOrder, normalize } from "../lib/catalog.js";
import seed from "../lib/seed.js";
import { pipeline, cmd, dbConfigured, dbHealth, K, rateLimit } from "../lib/db.js";
import { wompiConfig, saveWompi, publicWompi } from "../lib/wompi.js";
import { passwordInfo, checkPassword, setPassword, sessionCookie, clearCookie, isAdmin } from "../lib/auth.js";
import { query, body, ip, send } from "../lib/http.js";

const day = (d) => new Date(d.getTime() - 5 * 3600e3).toISOString().slice(0, 10);

export default async function handler(req, res) {
  const a = query(req).a;
  try {
    if (a === "status") {
      const health = await dbHealth();
      const info = health.ok ? await passwordInfo().catch(() => ({ custom: false })) : { custom: false };
      const admin = await isAdmin(req).catch(() => false);
      return send(res, 200, { db: health.ok, admin, defaultPassword: !info.custom, dbInfo: { mode: health.mode, ok: health.ok, ...(admin ? { error: health.error, ms: health.ms } : {}) } });
    }
    if (a === "login" && req.method === "POST") {
      if (!(await rateLimit("login:" + ip(req), 8, 900))) return send(res, 429, { error: "Demasiados intentos. Espera 15 minutos." });
      const { password } = await body(req);
      if (!(await checkPassword(password))) return send(res, 401, { error: "Contraseña incorrecta." });
      return send(res, 200, { ok: true }, { "Set-Cookie": await sessionCookie(req) });
    }
    if (a === "logout") return send(res, 200, { ok: true }, { "Set-Cookie": clearCookie() });

    if (!(await isAdmin(req))) return send(res, 401, { error: "Sesión expirada. Ingresa de nuevo." });
    const needDb = () => { if (!dbConfigured()) throw Object.assign(new Error("Conecta la base de datos (Upstash Redis) en Vercel para guardar cambios."), { status: 503 }); };

    switch (a) {
      case "password": {
        needDb();
        const { actual, nueva } = await body(req);
        if (!(await checkPassword(actual))) return send(res, 400, { error: "La clave actual no es correcta." });
        if (typeof nueva !== "string" || nueva.length < 8) return send(res, 400, { error: "La nueva clave debe tener al menos 8 caracteres." });
        await setPassword(nueva);
        return send(res, 200, { ok: true });
      }
      case "wompi":
        return send(res, 200, publicWompi(await wompiConfig({ fresh: true })));
      case "wompi-save": {
        needDb();
        return send(res, 200, await saveWompi(await body(req)));
      }
      case "catalog":
        return send(res, 200, await getCatalog({ fresh: true }));
      case "save": {
        needDb();
        const data = await body(req);
        if (!data || !Array.isArray(data.productos)) return send(res, 400, { error: "Datos inválidos." });
        const slugs = data.productos.map((p) => p.slug);
        if (slugs.some((s) => !/^[a-z0-9-]{2,60}$/.test(s || ""))) return send(res, 400, { error: "Cada producto necesita una URL válida (solo minúsculas, números y guiones)." });
        if (new Set(slugs).size !== slugs.length) return send(res, 400, { error: "Hay dos productos con la misma URL." });
        if (["admin", "api", "assets", "img", "sitemap", "robots", "producto", "pedido", "webhooks"].some((r) => slugs.includes(r))) return send(res, 400, { error: "Esa URL está reservada. Usa otra." });
        return send(res, 200, await saveCatalog(data));
      }
      case "reset": {
        needDb();
        return send(res, 200, await saveCatalog(normalize(JSON.parse(JSON.stringify(seed)))));
      }
      case "orders":
        if (!dbConfigured()) return send(res, 200, []);
        return send(res, 200, await listOrders());
      case "order": {
        needDb();
        const { id, ...patch } = await body(req);
        return send(res, 200, await updateOrder(String(id), patch));
      }
      case "order-delete": {
        needDb();
        const { id } = await body(req);
        await deleteOrder(String(id));
        return send(res, 200, { ok: true });
      }
      case "visits": {
        if (!dbConfigured()) return send(res, 200, {});
        const days = Math.min(365, Number(query(req).days) || 90);
        const keys = Array.from({ length: days }, (_, i) => day(new Date(Date.now() - i * 864e5)));
        const vals = await cmd("MGET", ...keys.map(K.pv));
        return send(res, 200, Object.fromEntries(keys.map((k, i) => [k, Number(vals[i] || 0)])));
      }
      case "upload": {
        needDb();
        const { dataUrl } = await body(req);
        const m = /^data:(image\/(?:webp|png|jpeg|avif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || "");
        if (!m) return send(res, 400, { error: "Formato de imagen no válido." });
        if (m[2].length > 1.4e6) return send(res, 400, { error: "La imagen es muy pesada. Usa una de menos de 1 MB." });
        const id = crypto.randomBytes(9).toString("hex") + "." + m[1].split("/")[1];
        await pipeline([["SET", K.img(id.split(".")[0]), JSON.stringify({ type: m[1], data: m[2] })]]);
        return send(res, 200, { url: "/img/" + id.split(".")[0] });
      }
      default:
        return send(res, 404, { error: "Acción no encontrada" });
    }
  } catch (e) {
    console.error(e);
    return send(res, e.status || 500, { error: e.status ? e.message : "Error del servidor: " + e.message });
  }
}
