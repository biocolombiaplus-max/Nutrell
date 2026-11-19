// Utilidades HTTP que funcionan igual en Vercel y en el servidor local.
export function query(req) {
  if (req.query && typeof req.query === "object") return req.query;
  return Object.fromEntries(new URL(req.url, "http://x").searchParams);
}

export async function body(req) {
  if (req.method === "GET" || req.method === "HEAD") return {};
  try {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === "string") return JSON.parse(req.body || "{}");
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8") || "{}");
  } catch { return {}; }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 6e6) throw new Error("Solicitud demasiado grande"); chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return {}; }
}

export function cookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((p) => { const i = p.indexOf("="); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}

export function ip(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "x").split(",")[0].trim();
}

export function send(res, status, data, headers = {}) {
  res.statusCode = status;
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (typeof data === "string" || Buffer.isBuffer(data)) { res.end(data); return; }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (!headers["Cache-Control"]) res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}
