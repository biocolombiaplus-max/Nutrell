// Base de datos: Upstash Redis (vía API REST, sin dependencias).
// En Vercel se conecta desde Storage → Upstash for Redis. Las variables se detectan solas.
// En local: NUTRELL_DB=memory usa una base en memoria (solo para pruebas).

function findCreds() {
  const env = process.env;
  const pairs = [["KV_REST_API_URL", "KV_REST_API_TOKEN"], ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]];
  for (const [u, t] of pairs) if (env[u] && env[t]) return { url: env[u], token: env[t] };
  // Prefijos personalizados (ej. STORAGE_KV_REST_API_URL)
  for (const k of Object.keys(env)) {
    let m = k.match(/^(.*)REST_API_URL$/);
    if (m && env[m[1] + "REST_API_TOKEN"]) return { url: env[k], token: env[m[1] + "REST_API_TOKEN"] };
    m = k.match(/^(.*)REDIS_REST_URL$/);
    if (m && env[m[1] + "REDIS_REST_TOKEN"]) return { url: env[k], token: env[m[1] + "REDIS_REST_TOKEN"] };
  }
  return null;
}

// ---------- Memoria (local) ----------
const mem = globalThis.__nutrellMem || (globalThis.__nutrellMem = { kv: new Map(), z: new Map(), exp: new Map() });
function memCmd([c, ...a]) {
  c = c.toUpperCase();
  const now = Date.now();
  for (const [k, t] of mem.exp) if (t < now) { mem.kv.delete(k); mem.exp.delete(k); }
  switch (c) {
    case "GET": return mem.kv.has(a[0]) ? mem.kv.get(a[0]) : null;
    case "SET": mem.kv.set(a[0], String(a[1])); return "OK";
    case "DEL": return a.reduce((n, k) => n + (mem.kv.delete(k) | mem.z.delete(k)), 0);
    case "INCR": case "INCRBY": { const v = Number(mem.kv.get(a[0]) || 0) + Number(c === "INCR" ? 1 : a[1]); mem.kv.set(a[0], String(v)); return v; }
    case "EXPIRE": mem.exp.set(a[0], now + Number(a[1]) * 1000); return 1;
    case "MGET": return a.map((k) => (mem.kv.has(k) ? mem.kv.get(k) : null));
    case "ZADD": { const z = mem.z.get(a[0]) || new Map(); z.set(a[2], Number(a[1])); mem.z.set(a[0], z); return 1; }
    case "ZREM": { const z = mem.z.get(a[0]); return z && z.delete(a[1]) ? 1 : 0; }
    case "ZCARD": return (mem.z.get(a[0]) || new Map()).size;
    case "ZREVRANGE": {
      const z = [...(mem.z.get(a[0]) || new Map())].sort((x, y) => y[1] - x[1]).map((x) => x[0]);
      const end = Number(a[2]) < 0 ? z.length : Number(a[2]) + 1; return z.slice(Number(a[1]), end);
    }
    case "PING": return "PONG";
    default: throw new Error("Comando no soportado en memoria: " + c);
  }
}

export function dbConfigured() { return process.env.NUTRELL_DB === "memory" || !!findCreds(); }

export async function pipeline(cmds) {
  if (process.env.NUTRELL_DB === "memory") return cmds.map(memCmd);
  const cr = findCreds();
  if (!cr) throw Object.assign(new Error("Base de datos no conectada"), { code: "NO_DB" });
  const r = await fetch(cr.url.replace(/\/$/, "") + "/pipeline", {
    method: "POST", headers: { Authorization: `Bearer ${cr.token}`, "Content-Type": "application/json" }, body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("Error de base de datos: " + r.status);
  const out = await r.json();
  return out.map((x) => { if (x.error) throw new Error(x.error); return x.result; });
}
export async function cmd(...args) { return (await pipeline([args]))[0]; }

export const K = {
  catalog: "nutrell:catalogo",
  orders: "nutrell:pedidos",
  order: (id) => `nutrell:pedido:${id}`,
  seq: "nutrell:secuencia",
  pv: (d) => `nutrell:visitas:${d}`,
  img: (id) => `nutrell:img:${id}`,
  rate: (k) => `nutrell:limite:${k}`,
};

// Límite simple de intentos por IP
export async function rateLimit(key, max, seconds) {
  if (!dbConfigured()) return true;
  try {
    const [n] = await pipeline([["INCR", K.rate(key)], ["EXPIRE", K.rate(key), String(seconds)]]);
    return n <= max;
  } catch { return true; }
}
