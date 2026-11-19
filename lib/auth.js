// Acceso al panel.
// Clave: la que se guarde desde el panel (Ajustes → Seguridad). Si no hay, usa ADMIN_PASSWORD
// de Vercel, y si tampoco existe, la clave inicial 123456 (cámbiala apenas entres).
import crypto from "node:crypto";
import { cookies } from "./http.js";
import { cmd, dbConfigured } from "./db.js";

const COOKIE = "nt_admin";
const DAYS = 7;
const KEY_PASS = "nutrell:clave";
const KEY_SECRET = "nutrell:secreto";
export const DEFAULT_PASSWORD = "123456";

let secretMemo = null;
async function secret() {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET;
  if (secretMemo) return secretMemo;
  if (dbConfigured()) {
    let s = await cmd("GET", KEY_SECRET);
    if (!s) { s = crypto.randomBytes(32).toString("hex"); await cmd("SET", KEY_SECRET, s); s = (await cmd("GET", KEY_SECRET)) || s; }
    return (secretMemo = s);
  }
  // Sin base de datos el panel solo puede leer el catálogo público; secreto por instancia.
  return (secretMemo = crypto.randomBytes(32).toString("hex"));
}
async function sign(v) { return crypto.createHmac("sha256", await secret()).update(v).digest("base64url"); }

function hash(pw, salt = crypto.randomBytes(16).toString("hex")) { return salt + ":" + crypto.scryptSync(pw, salt, 32).toString("hex"); }
function eq(a, b) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); }

export async function passwordInfo() {
  const stored = dbConfigured() ? await cmd("GET", KEY_PASS).catch(() => null) : null;
  return { custom: !!stored || !!process.env.ADMIN_PASSWORD, stored };
}

export async function checkPassword(pw) {
  if (typeof pw !== "string" || !pw) return false;
  const { stored } = await passwordInfo();
  if (stored) { const [salt] = stored.split(":"); return eq(hash(pw, salt), stored); }
  const real = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  return eq(crypto.createHash("sha256").update(pw).digest("hex"), crypto.createHash("sha256").update(real).digest("hex"));
}

export async function setPassword(pw) { await cmd("SET", KEY_PASS, hash(pw)); }

export async function sessionCookie(req) {
  const exp = String(Date.now() + DAYS * 864e5);
  const secure = String(req.headers["x-forwarded-proto"] || "").includes("https") ? "; Secure" : "";
  return `${COOKIE}=${exp}.${await sign(exp)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${DAYS * 86400}${secure}`;
}
export function clearCookie() { return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`; }

export async function isAdmin(req) {
  const v = cookies(req)[COOKIE];
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return eq(sig, await sign(exp));
}
