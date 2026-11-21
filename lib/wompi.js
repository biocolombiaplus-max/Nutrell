// Integración con Wompi (Bancolombia): tarjetas, PSE, Nequi y Bancolombia.
// Las llaves se configuran en el panel (Configuración → Pagos en línea) o con variables de entorno en Vercel:
//   WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET, WOMPI_EVENTS_SECRET  (estas tienen prioridad)
import crypto from "node:crypto";
import { cmd, dbConfigured } from "./db.js";

const KEY = "nutrell:wompi";
let memo = { at: 0, data: null };

export async function wompiConfig({ fresh = false } = {}) {
  if (!fresh && memo.data && Date.now() - memo.at < 10000) return memo.data;
  let saved = {};
  if (dbConfigured()) { try { saved = JSON.parse((await cmd("GET", KEY)) || "{}"); } catch {} }
  const env = process.env;
  const cfg = {
    publicKey: env.WOMPI_PUBLIC_KEY || saved.publicKey || "",
    integrity: env.WOMPI_INTEGRITY_SECRET || saved.integrity || "",
    events: env.WOMPI_EVENTS_SECRET || saved.events || "",
    activo: saved.activo !== false,
    fromEnv: !!env.WOMPI_PUBLIC_KEY,
  };
  cfg.enabled = cfg.activo && /^pub_(test|prod)_/.test(cfg.publicKey) && !!cfg.integrity;
  cfg.test = cfg.publicKey.startsWith("pub_test_");
  memo = { at: Date.now(), data: cfg };
  return cfg;
}

export async function saveWompi(input) {
  const cur = JSON.parse((await cmd("GET", KEY)) || "{}");
  const clean = (v) => String(v || "").trim();
  if (clean(input.publicKey)) {
    if (!/^pub_(test|prod)_[A-Za-z0-9]+$/.test(clean(input.publicKey))) throw Object.assign(new Error("La llave pública debe empezar por pub_test_ o pub_prod_."), { status: 400 });
    cur.publicKey = clean(input.publicKey);
  }
  if (clean(input.integrity)) cur.integrity = clean(input.integrity);
  if (clean(input.events)) cur.events = clean(input.events);
  if (typeof input.activo === "boolean") cur.activo = input.activo;
  const env = (s, pre) => (s && s.startsWith(pre + "test_") ? "test" : s && s.startsWith(pre + "prod_") ? "prod" : null);
  const modes = [env(cur.publicKey, "pub_"), cur.integrity && (cur.integrity.startsWith("test_") ? "test" : cur.integrity.startsWith("prod_") ? "prod" : null), cur.events && (cur.events.startsWith("test_") ? "test" : cur.events.startsWith("prod_") ? "prod" : null)].filter(Boolean);
  if (new Set(modes).size > 1) throw Object.assign(new Error("Mezclaste llaves de pruebas y de producción. Usa todas del mismo ambiente."), { status: 400 });
  await cmd("SET", KEY, JSON.stringify(cur));
  memo = { at: 0, data: null };
  return publicWompi(await wompiConfig({ fresh: true }));
}

export function publicWompi(cfg) {
  const mask = (s) => (s ? s.slice(0, Math.min(14, s.length - 4)) + "••••" + s.slice(-4) : "");
  return { publicKey: cfg.publicKey, integrity: mask(cfg.integrity), events: mask(cfg.events), hasIntegrity: !!cfg.integrity, hasEvents: !!cfg.events, enabled: cfg.enabled, activo: cfg.activo, test: cfg.test, fromEnv: cfg.fromEnv };
}

export const apiBase = (cfg) => process.env.WOMPI_API_BASE || (cfg.test ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1");
export const integritySignature = (reference, cents, currency, secret) => crypto.createHash("sha256").update(`${reference}${cents}${currency}${secret}`).digest("hex");

export async function fetchTransaction(cfg, id) {
  const r = await fetch(`${apiBase(cfg)}/transactions/${encodeURIComponent(id)}`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw Object.assign(new Error("No pudimos consultar el pago en Wompi."), { status: 502 });
  return (await r.json()).data;
}

// Verifica la firma de los eventos (webhooks) que envía Wompi
export function validEvent(body, secret) {
  try {
    const props = body.signature.properties;
    const vals = props.map((p) => p.split(".").reduce((o, k) => o?.[k], body.data)).join("");
    const sum = crypto.createHash("sha256").update(`${vals}${body.timestamp}${secret}`).digest("hex");
    const a = Buffer.from(sum), b = Buffer.from(String(body.signature.checksum).toLowerCase());
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}
