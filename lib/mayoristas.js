// Programa de mayoristas: solicitudes, aprobación, acceso al portal, precios por nivel y pedidos.
import crypto from "node:crypto";
import { cmd, pipeline, K } from "./db.js";
import { cookies } from "./http.js";
import { sign, hash, eq } from "./auth.js";
import { getCatalog, saveCatalog, bySlug, listOrders, payParams } from "./catalog.js";
import { wompiConfig } from "./wompi.js";

const KM = {
  one: (id) => `nutrell:mayorista:${id}`,
  all: "nutrell:mayoristas",
  email: (e) => `nutrell:mayorista-email:${e}`,
};
const COOKIE = "nt_may";
const DAYS = 30;
const str = (v, n = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const normEmail = (e) => str(e, 120).toLowerCase();
const err = (msg, status = 400) => Object.assign(new Error(msg), { status });

export const ESTADOS_MAY = ["pendiente", "aprobado", "rechazado", "inactivo"];

// ---------- Datos ----------
export async function getMay(id) { const r = await cmd("GET", KM.one(id)); return r ? JSON.parse(r) : null; }
async function putMay(m) { await cmd("SET", KM.one(m.id), JSON.stringify(m)); }
export async function listMay() {
  const ids = await cmd("ZREVRANGE", KM.all, "0", "-1");
  if (!ids || !ids.length) return [];
  const raws = await cmd("MGET", ...ids.map(KM.one));
  return raws.filter(Boolean).map((r) => JSON.parse(r));
}
export function publicMay(m) { if (!m) return null; const { passHash, ...rest } = m; return rest; }

export function nivelDe(cfg, m) { return cfg.niveles.find((n) => n.id === m.nivel) || cfg.niveles[0]; }
export function descuentoDe(cfg, m) {
  const d = m.descuento !== null && m.descuento !== undefined && m.descuento !== "" ? Number(m.descuento) : Number(nivelDe(cfg, m).descuento);
  return Math.max(0, Math.min(90, d || 0));
}
export function minimoDe(cfg, m) {
  return m.minimo !== null && m.minimo !== undefined && m.minimo !== "" ? Number(m.minimo) : Number(nivelDe(cfg, m).minimo || 0);
}
export function precioMayorista(p, pct) {
  const base = Number(p.precioMayorista) > 0 ? Number(p.precioMayorista) : p.precio;
  return Math.round(base * (1 - pct / 100));
}

// ---------- Registro (solicitud) ----------
export async function registrar(input) {
  const email = normEmail(input.email);
  const m = {
    id: crypto.randomBytes(6).toString("hex"),
    estado: "pendiente",
    fecha: new Date().toISOString(),
    empresa: str(input.empresa, 120), nit: str(input.nit, 30), tipo: str(input.tipo, 80),
    contacto: str(input.contacto, 120), cargo: str(input.cargo, 80),
    telefono: str(input.telefono, 30), email,
    ciudad: str(input.ciudad, 80), departamento: str(input.departamento, 80), direccion: str(input.direccion, 200),
    canales: Array.isArray(input.canales) ? input.canales.map((x) => str(x, 40)).slice(0, 8) : [],
    volumen: str(input.volumen, 60), sitio: str(input.sitio, 160), mensaje: str(input.mensaje, 800),
    nivel: "", descuento: null, minimo: null,
    credito: { activo: false, dias: 30, cupo: 0 },
    notas: "", ultimoAcceso: null,
    historial: [{ fecha: new Date().toISOString(), texto: "Solicitud recibida desde la página de mayoristas" }],
  };
  if (!m.empresa || !m.contacto || !m.ciudad || !m.tipo) throw err("Completa el nombre del negocio, contacto, tipo de negocio y ciudad.");
  if (m.telefono.replace(/\D/g, "").length < 7) throw err("Revisa el número de celular.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw err("Escribe un correo válido. Será tu usuario para ingresar.");
  if (typeof input.password !== "string" || input.password.length < 8) throw err("La contraseña debe tener al menos 8 caracteres.");
  const exists = await cmd("GET", KM.email(email));
  if (exists) throw err("Ya existe una solicitud con este correo. Si ya fuiste aprobado, ingresa al portal.", 409);
  m.passHash = hash(input.password);
  const cat = await getCatalog();
  m.nivel = cat.mayoristas.nivelInicial || cat.mayoristas.niveles[0].id;
  await pipeline([["SET", KM.one(m.id), JSON.stringify(m)], ["SET", KM.email(email), m.id], ["ZADD", KM.all, String(Date.now()), m.id]]);
  return m;
}

// ---------- Sesión del mayorista ----------
export async function login(email, password) {
  const id = await cmd("GET", KM.email(normEmail(email)));
  const m = id ? await getMay(id) : null;
  if (!m || !m.passHash || typeof password !== "string") throw err("Correo o contraseña incorrectos.", 401);
  const [salt] = m.passHash.split(":");
  if (!eq(hash(password, salt), m.passHash)) throw err("Correo o contraseña incorrectos.", 401);
  if (m.estado === "pendiente") throw err("Tu solicitud está en revisión. Te avisaremos por WhatsApp o correo cuando sea aprobada.", 403);
  if (m.estado !== "aprobado") throw err("Tu cuenta de mayorista no está activa. Escríbenos para más información.", 403);
  m.ultimoAcceso = new Date().toISOString();
  await putMay(m);
  return m;
}
export async function sessionCookie(req, m) {
  const exp = String(Date.now() + DAYS * 864e5);
  const v = `${m.id}.${exp}`;
  const secure = String(req.headers["x-forwarded-proto"] || "").includes("https") ? "; Secure" : "";
  return `${COOKIE}=${v}.${await sign("may|" + v)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
export async function currentMay(req) {
  const v = cookies(req)[COOKIE]; if (!v) return null;
  const [id, exp, sig] = v.split(".");
  if (!id || !exp || !sig || Number(exp) < Date.now()) return null;
  if (!eq(sig, await sign(`may|${id}.${exp}`))) return null;
  const m = await getMay(id);
  return m && m.estado === "aprobado" ? m : null;
}

// ---------- Portal: catálogo con precios del mayorista ----------
export async function portalData(m) {
  const c = await getCatalog();
  const cfg = c.mayoristas, pct = descuentoDe(cfg, m), nivel = nivelDe(cfg, m);
  const w = await wompiConfig().catch(() => ({ enabled: false }));
  const productos = c.productos.filter((p) => p.activo !== false).map((p) => ({
    id: p.slug, nombre: p.nombre, variante: [p.tamano, p.sabor].filter(Boolean).join(" · "), imagen: p.imagenes.mini || p.imagenes.principal,
    categoria: (c.categorias.find((x) => x.id === p.categoria) || {}).nombre || "", publico: p.precio, precio: precioMayorista(p, pct),
    stock: p.stock === null || p.stock === undefined || p.stock === "" ? null : Number(p.stock),
  }));
  const orders = (await listOrders()).filter((o) => o.mayorista?.id === m.id).map((o) => ({
    numero: o.numero, fecha: o.fecha, estado: o.estado, pago: o.pago, total: o.total, metodoPago: o.metodoPago, online: !!o.online,
    items: o.items.map((i) => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, total: i.total })), guia: o.guia, transportadora: o.transportadora,
  }));
  const metodos = [];
  if (cfg.metodos.online && w.enabled) metodos.push({ id: "online", nombre: "Pago en línea", detalle: "Tarjeta, PSE, Nequi o Bancolombia (Wompi)" });
  if (c.sitio.nequiActivo && c.sitio.nequiNumero) metodos.push({ id: "nequi", nombre: "Nequi", detalle: `Transfiere al ${String(c.sitio.nequiNumero).replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3")} a nombre de ${c.sitio.nequiTitular} y envía el comprobante por WhatsApp` });
  if (cfg.metodos.transferencia) metodos.push({ id: "transferencia", nombre: "Transferencia bancaria", detalle: cfg.datosTransferencia });
  if (cfg.metodos.credito && m.credito?.activo) metodos.push({ id: "credito", nombre: `Crédito a ${m.credito.dias || 30} días`, detalle: m.credito.cupo ? `Cupo aprobado: $${Number(m.credito.cupo).toLocaleString("es-CO")}` : "Según tu acuerdo comercial" });
  return {
    mayorista: publicMay(m), nivel: { nombre: nivel.nombre, descuento: pct }, minimo: minimoDe(cfg, m), productos, pedidos: orders, metodos,
    whatsapp: c.sitio.whatsapp, envioGratisDesde: c.sitio.envioGratisDesde,
  };
}

// ---------- Pedido mayorista ----------
export async function crearPedido(m, input, origin) {
  const c = await getCatalog({ fresh: true });
  const cfg = c.mayoristas, pct = descuentoDe(cfg, m), nivel = nivelDe(cfg, m);
  const raw = Array.isArray(input.items) ? input.items.slice(0, 60) : [];
  const items = [], uso = {};
  for (const it of raw) {
    const p = bySlug(c, it.id); const qty = Math.min(5000, Math.max(0, Math.round(Number(it.qty) || 0)));
    if (!p || p.activo === false || !qty) continue;
    uso[p.slug] = (uso[p.slug] || 0) + qty;
    const precio = precioMayorista(p, pct);
    items.push({ id: p.slug, nombre: p.nombre, variante: [p.tamano, p.sabor].filter(Boolean).join(" · "), unidades: 1, cantidad: qty, precio, total: precio * qty, imagen: p.imagenes.mini });
  }
  if (!items.length) throw err("Agrega al menos un producto a tu pedido.");
  for (const [slug, n] of Object.entries(uso)) {
    const p = bySlug(c, slug);
    if (p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) < n) throw err(`Solo hay ${p.stock} unidades disponibles de ${p.nombre}.`, 409);
  }
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const minimo = minimoDe(cfg, m);
  if (subtotal < minimo) throw err(`El pedido mínimo para tu nivel es $${minimo.toLocaleString("es-CO")}. Te faltan $${(minimo - subtotal).toLocaleString("es-CO")}.`);
  const metodo = ["online", "transferencia", "credito", "nequi"].includes(input.metodo) ? input.metodo : "transferencia";
  if (metodo === "nequi" && !(c.sitio.nequiActivo && c.sitio.nequiNumero)) throw err("Elige otro método de pago.");
  if (metodo === "online") { const w = await wompiConfig(); if (!cfg.metodos.online || !w.enabled) throw err("El pago en línea no está disponible. Elige otro método."); }
  if (metodo === "transferencia" && !cfg.metodos.transferencia) throw err("Elige otro método de pago.");
  if (metodo === "credito") {
    if (!cfg.metodos.credito || !m.credito?.activo) throw err("No tienes crédito habilitado.");
    if (Number(m.credito.cupo) > 0) {
      const usado = (await listOrders()).filter((o) => o.mayorista?.id === m.id && o.metodoPago.startsWith("Crédito") && o.pago === "pendiente" && o.estado !== "cancelado").reduce((s, o) => s + o.total, 0);
      if (usado + subtotal > Number(m.credito.cupo)) throw err(`Este pedido supera tu cupo de crédito disponible ($${Math.max(0, m.credito.cupo - usado).toLocaleString("es-CO")}).`);
    }
  }
  const metodoPago = metodo === "online" ? "Pago en línea (Wompi)" : metodo === "credito" ? `Crédito ${m.credito.dias || 30} días` : metodo === "nequi" ? "Nequi directo" : "Transferencia bancaria";
  const n = await cmd("INCR", K.seq);
  const numero = 1000 + Number(n), fecha = new Date().toISOString();
  const order = {
    id: String(numero), numero, fecha, estado: "nuevo", pago: "pendiente", metodoPago, canal: "mayorista",
    mayorista: { id: m.id, empresa: m.empresa, nit: m.nit, nivel: nivel.nombre, descuento: pct },
    cliente: { nombre: `${m.contacto} · ${m.empresa}`, telefono: m.telefono, email: m.email, ciudad: str(input.ciudad, 80) || m.ciudad, departamento: m.departamento, direccion: str(input.direccion, 200) || m.direccion, notas: str(input.notas, 600) },
    items, subtotal, descuento: 0, cupon: "", envio: 0, envioPorConfirmar: true, total: subtotal,
    online: metodo === "online", refs: [], wompi: null, guia: "", transportadora: "", notaInterna: "",
    historial: [{ fecha, texto: `Pedido mayorista desde el portal · ${nivel.nombre} (${pct}% de descuento) · ${metodoPago}` }],
  };
  await pipeline([["SET", K.order(order.id), JSON.stringify(order)], ["ZADD", K.orders, String(Date.now()), order.id]]);
  let changed = false;
  for (const [slug, used] of Object.entries(uso)) {
    const p = bySlug(c, slug);
    if (p.stock !== null && p.stock !== undefined && p.stock !== "") { p.stock = Math.max(0, Number(p.stock) - used); changed = true; }
  }
  if (changed) await saveCatalog(c);
  m.historial = [...(m.historial || []), { fecha, texto: `Pedido #${numero} por $${subtotal.toLocaleString("es-CO")}` }].slice(-100);
  await putMay(m);
  const out = { ok: true, numero, total: subtotal, metodoPago };
  if (order.online) out.pay = await payParams(order, origin);
  return out;
}

// ---------- Administración ----------
export async function updateMay(id, patch) {
  const m = await getMay(id); if (!m) throw err("Mayorista no encontrado", 404);
  const now = new Date().toISOString(), log = (t) => (m.historial = [...(m.historial || []), { fecha: now, texto: t }].slice(-100));
  if (patch.estado && ESTADOS_MAY.includes(patch.estado) && patch.estado !== m.estado) { log(`Estado: ${m.estado} → ${patch.estado}`); m.estado = patch.estado; if (patch.estado === "aprobado") m.aprobado = now; }
  if (typeof patch.nivel === "string" && patch.nivel !== m.nivel) { log(`Nivel: ${m.nivel || "—"} → ${patch.nivel}`); m.nivel = patch.nivel; }
  for (const k of ["descuento", "minimo"]) if (k in patch) { const v = patch[k] === "" || patch[k] === null ? null : Math.max(0, Number(patch[k]) || 0); if (v !== m[k]) { m[k] = v; log(k === "descuento" ? `Descuento personalizado: ${v === null ? "según nivel" : v + "%"}` : `Pedido mínimo personalizado: ${v === null ? "según nivel" : "$" + v.toLocaleString("es-CO")}`); } }
  if (patch.credito && typeof patch.credito === "object") { m.credito = { activo: !!patch.credito.activo, dias: Math.max(0, Number(patch.credito.dias) || 30), cupo: Math.max(0, Number(patch.credito.cupo) || 0) }; log(`Crédito: ${m.credito.activo ? `activo · ${m.credito.dias} días · cupo $${m.credito.cupo.toLocaleString("es-CO")}` : "inactivo"}`); }
  for (const k of ["notas", "empresa", "nit", "tipo", "contacto", "cargo", "telefono", "ciudad", "departamento", "direccion"]) if (typeof patch[k] === "string") m[k] = str(patch[k], k === "notas" ? 2000 : 200);
  if (typeof patch.password === "string" && patch.password) { if (patch.password.length < 8) throw err("La nueva contraseña debe tener al menos 8 caracteres."); m.passHash = hash(patch.password); log("Contraseña restablecida por el administrador"); }
  await putMay(m);
  return publicMay(m);
}
export async function deleteMay(id) {
  const m = await getMay(id); if (!m) return;
  await pipeline([["DEL", KM.one(id)], ["DEL", KM.email(m.email)], ["ZREM", KM.all, id]]);
}
