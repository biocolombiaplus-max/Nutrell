// Base de datos Redis. Funciona con cualquiera de las dos opciones de Vercel Storage:
//  · Upstash for Redis   → API REST (KV_REST_API_URL / KV_REST_API_TOKEN)
//  · Redis (Redis Cloud) → conexión directa con REDIS_URL (redis:// o rediss://)
// Las variables se detectan solas, con o sin prefijo personalizado.
// En local: NUTRELL_DB=memory usa una base en memoria (solo para pruebas).
import net from "node:net";
import tls from "node:tls";

function findCreds() {
  const env = process.env;
  const pairs = [["KV_REST_API_URL", "KV_REST_API_TOKEN"], ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]];
  for (const [u, t] of pairs) if (env[u] && env[t]) return { url: env[u], token: env[t] };
  for (const k of Object.keys(env)) {
    let m = k.match(/^(.*)REST_API_URL$/);
    if (m && env[m[1] + "REST_API_TOKEN"]) return { url: env[k], token: env[m[1] + "REST_API_TOKEN"] };
    m = k.match(/^(.*)REDIS_REST_URL$/);
    if (m && env[m[1] + "REDIS_REST_TOKEN"]) return { url: env[k], token: env[m[1] + "REDIS_REST_TOKEN"] };
  }
  return null;
}
function findRedisUrl() {
  const env = process.env;
  const ok = (v) => typeof v === "string" && /^rediss?:\/\//.test(v.trim());
  for (const k of ["REDIS_URL", "KV_URL", "UPSTASH_REDIS_URL"]) if (ok(env[k])) return env[k].trim();
  for (const k of Object.keys(env)) if (/(REDIS_URL|KV_URL)$/.test(k) && ok(env[k])) return env[k].trim();
  // Cualquier variable cuyo valor sea una dirección redis:// (ej. STORAGE_URL con prefijo personalizado)
  for (const k of Object.keys(env).sort()) if (/URL$/.test(k) && ok(env[k])) return env[k].trim();
  return null;
}
export function dbMode() {
  if (process.env.NUTRELL_DB === "memory") return "memory";
  if (findCreds()) return "rest";
  if (findRedisUrl()) return "tcp";
  return "none";
}

// ---------- Cliente Redis directo (protocolo RESP, sin dependencias) ----------
function encode(args) {
  const parts = [Buffer.from(`*${args.length}\r\n`)];
  for (const a of args) { const b = Buffer.from(String(a), "utf8"); parts.push(Buffer.from(`$${b.length}\r\n`), b, Buffer.from("\r\n")); }
  return Buffer.concat(parts);
}
function parse(buf, i) {
  if (i >= buf.length) return null;
  const end = buf.indexOf("\r\n", i);
  if (end < 0) return null;
  const t = String.fromCharCode(buf[i]), line = buf.toString("utf8", i + 1, end);
  if (t === "+") return [line, end + 2];
  if (t === "-") return [new Error(line), end + 2];
  if (t === ":") return [Number(line), end + 2];
  if (t === "$") {
    const n = Number(line); if (n < 0) return [null, end + 2];
    if (buf.length < end + 2 + n + 2) return null;
    return [buf.toString("utf8", end + 2, end + 2 + n), end + 2 + n + 2];
  }
  if (t === "*") {
    const n = Number(line); if (n < 0) return [null, end + 2];
    const arr = []; let p = end + 2;
    for (let k = 0; k < n; k++) { const r = parse(buf, p); if (!r) return null; arr.push(r[0]); p = r[1]; }
    return [arr, p];
  }
  throw new Error("Respuesta de Redis no válida");
}
function tcpClient(url) {
  const g = globalThis;
  if (g.__nutrellRedis && !g.__nutrellRedis.dead && g.__nutrellRedis.url === url) return g.__nutrellRedis;
  const u = new URL(url);
  const opts = { host: u.hostname, port: Number(u.port || 6379) };
  const sock = u.protocol === "rediss:" ? tls.connect({ ...opts, servername: u.hostname }) : net.connect(opts);
  const c = { url, sock, buf: Buffer.alloc(0), queue: [], dead: false };
  const fail = (err) => { if (c.dead) return; c.dead = true; for (const q of c.queue.splice(0)) q.reject(err); try { sock.destroy(); } catch {} };
  sock.setNoDelay(true);
  sock.setTimeout(10000, () => fail(new Error("La base de datos no respondió a tiempo")));
  sock.on("error", (e) => fail(new Error("No se pudo conectar a la base de datos: " + e.message)));
  sock.on("close", () => fail(new Error("Conexión con la base de datos cerrada")));
  sock.on("data", (d) => {
    c.buf = c.buf.length ? Buffer.concat([c.buf, d]) : d;
    let p = 0, r;
    while (c.queue.length && (r = parse(c.buf, p))) { p = r[1]; c.queue.shift().resolve(r[0]); }
    c.buf = c.buf.subarray(p);
  });
  c.send = (cmds) => {
    if (c.dead) return Promise.reject(new Error("Conexión con la base de datos cerrada"));
    const ps = cmds.map(() => new Promise((resolve, reject) => c.queue.push({ resolve, reject })));
    sock.write(Buffer.concat(cmds.map(encode)));
    return Promise.all(ps);
  };
  const pre = [];
  const user = decodeURIComponent(u.username || ""), pass = decodeURIComponent(u.password || "");
  if (pass) pre.push(user && user !== "default" ? ["AUTH", user, pass] : ["AUTH", pass]);
  const dbn = Number((u.pathname || "").slice(1)); if (dbn) pre.push(["SELECT", dbn]);
  c.ready = pre.length
    ? c.send(pre).then((r) => { const e = r.find((x) => x instanceof Error); if (e) { fail(e); throw new Error("La base de datos rechazó la clave: " + e.message); } })
    : Promise.resolve();
  g.__nutrellRedis = c;
  return c;
}
async function tcpPipeline(cmds) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const c = tcpClient(findRedisUrl());
    try {
      await c.ready;
      const out = await c.send(cmds);
      return out.map((x) => { if (x instanceof Error) throw x; return x; });
    } catch (e) {
      if (!c.dead || attempt === 1) throw e; // reintenta una vez si la conexión estaba vencida
    }
  }
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

export function dbConfigured() { return dbMode() !== "none"; }

export async function pipeline(cmds) {
  const mode = dbMode();
  if (mode === "memory") return cmds.map(memCmd);
  if (mode === "tcp") return tcpPipeline(cmds);
  const cr = findCreds();
  if (!cr) throw Object.assign(new Error("Base de datos no conectada"), { code: "NO_DB" });
  const r = await fetch(cr.url.replace(/\/$/, "") + "/pipeline", {
    method: "POST", headers: { Authorization: `Bearer ${cr.token}`, "Content-Type": "application/json" }, body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error(r.status === 401 ? "La base de datos rechazó la llave de acceso (revisa la conexión en Vercel → Storage)." : "Error de base de datos: " + r.status);
  const out = await r.json();
  return out.map((x) => { if (x.error) throw new Error(x.error); return x.result; });
}
export async function cmd(...args) { return (await pipeline([args]))[0]; }

// Diagnóstico para el panel: qué base se detectó y si responde
export async function dbHealth() {
  const mode = dbMode();
  if (mode === "none") return { mode, ok: false, error: "No se encontró ninguna base de datos conectada al proyecto." };
  try { const t0 = Date.now(); const r = await cmd("PING"); return { mode, ok: r === "PONG", ms: Date.now() - t0 }; }
  catch (e) { return { mode, ok: false, error: e.message }; }
}

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
