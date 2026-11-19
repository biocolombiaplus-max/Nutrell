import seed from "./seed.js";
import { cmd, pipeline, dbConfigured, K } from "./db.js";

let memo = { at: 0, data: null };
const clone = (o) => JSON.parse(JSON.stringify(o));

export async function getCatalog({ fresh = false } = {}) {
  if (!fresh && memo.data && Date.now() - memo.at < 5000) return memo.data;
  let data = null;
  if (dbConfigured()) {
    try { const raw = await cmd("GET", K.catalog); if (raw) data = JSON.parse(raw); } catch (e) { console.error("catalogo:", e.message); }
  }
  data = normalize(data || clone(seed));
  memo = { at: Date.now(), data };
  return data;
}

export async function saveCatalog(data) {
  const clean = normalize(data);
  clean.actualizado = new Date().toISOString();
  await cmd("SET", K.catalog, JSON.stringify(clean));
  memo = { at: Date.now(), data: clean };
  return clean;
}

// Completa campos faltantes para que la tienda nunca se rompa
export function normalize(c) {
  const s = clone(seed);
  c.sitio = { ...s.sitio, ...(c.sitio || {}) };
  c.contenido = { ...s.contenido, ...(c.contenido || {}) };
  c.contenido.hero = { ...s.contenido.hero, ...(c.contenido.hero || {}) };
  c.contenido.club = { ...s.contenido.club, ...(c.contenido.club || {}) };
  c.contenido.seo = { ...s.contenido.seo, ...(c.contenido.seo || {}) };
  c.contenido.coleccion = { ...s.contenido.coleccion, ...(c.contenido.coleccion || {}) };
  for (const k of ["anuncios", "promesa", "resenas", "faq"]) if (!Array.isArray(c.contenido[k])) c.contenido[k] = s.contenido[k];
  c.cupones = Array.isArray(c.cupones) ? c.cupones : [];
  c.metodosPago = Array.isArray(c.metodosPago) && c.metodosPago.length ? c.metodosPago : s.metodosPago;
  c.categorias = Array.isArray(c.categorias) && c.categorias.length ? c.categorias : s.categorias;
  c.rituales = Array.isArray(c.rituales) ? c.rituales : [];
  c.productos = (Array.isArray(c.productos) ? c.productos : []).filter((p) => p && p.slug).map((p) => ({
    activo: true, stock: null, etiqueta: "", tamano: "", sabor: "", formato: "Polvo", h1: [p.nombre || "", ""],
    packs: [{ unidades: 1, descuento: 0, texto: "" }], tema: { acento: "#c9a24b", suave: "#efe4cc", oscuro: "#1a1712" },
    imagenes: {}, resumen: "", subtitulo: "", seoTitulo: "", seoDescripcion: "", descripcion: [], destacados: [], cifra: ["", ""],
    ingredientes: [], libreDe: [], pasos: [], advertencias: "", faq: [], ...p,
    precio: Math.max(0, Math.round(Number(p.precio) || 0)), antes: Math.max(0, Math.round(Number(p.antes) || 0)),
  }));
  for (const p of c.productos) {
    const im = p.imagenes || {};
    im.mini = im.mini || im.principal || ""; im.og = im.og || im.principal || "";
    p.imagenes = im;
    if (!p.packs.length || p.packs[0].unidades !== 1) p.packs.unshift({ unidades: 1, descuento: 0, texto: "" });
  }
  return c;
}

export const visibles = (c) => c.productos.filter((p) => p.activo !== false);
export const bySlug = (c, slug) => c.productos.find((p) => p.slug === slug);

export function packOff(p, units) { const pk = p.packs.find((x) => Number(x.unidades) === Number(units)); return pk ? Number(pk.descuento) / 100 : null; }
export function packPrice(p, units) { const off = packOff(p, units) || 0; return Math.round(p.precio * units * (1 - off)); }

// Datos públicos para el navegador (carrito, packs, cupones)
export function publicData(c) {
  return {
    config: { whatsapp: c.sitio.whatsapp, freeShippingFrom: c.sitio.envioGratisDesde, shippingCost: c.sitio.costoEnvio, promoEnds: c.sitio.finOferta, payments: c.metodosPago },
    coupons: c.cupones.filter((x) => x.activo).map((x) => ({ code: String(x.codigo).toUpperCase(), pct: Number(x.porcentaje), min: Number(x.minimo || 0) })),
    products: Object.fromEntries(c.productos.map((p) => [p.slug, {
      id: p.slug, name: p.nombre, variant: [p.tamano, p.sabor && `Sabor ${p.sabor.toLowerCase()}`].filter(Boolean).join(" · "),
      price: p.precio, compareAt: p.antes, image: p.imagenes.mini, url: "/" + p.slug, active: p.activo !== false,
      stock: p.stock === null || p.stock === undefined || p.stock === "" ? null : Number(p.stock),
      packs: Object.fromEntries(p.packs.map((x) => [String(x.unidades), Number(x.descuento) / 100])),
    }])),
  };
}

// ---------------------------------------------------------------- PEDIDOS
const ESTADOS = ["nuevo", "confirmado", "preparando", "enviado", "entregado", "cancelado"];
export { ESTADOS };
const str = (v, n = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

export async function createOrder(input) {
  const c = await getCatalog({ fresh: true });
  const cli = input.cliente || {};
  const cliente = { nombre: str(cli.nombre, 120), telefono: str(cli.telefono, 30), email: str(cli.email, 120), ciudad: str(cli.ciudad, 80), departamento: str(cli.departamento, 80), direccion: str(cli.direccion, 200), notas: str(cli.notas, 500) };
  if (!cliente.nombre || cliente.telefono.replace(/\D/g, "").length < 7 || !cliente.ciudad || !cliente.direccion) throw Object.assign(new Error("Completa nombre, celular, ciudad y dirección."), { status: 400 });
  const raw = Array.isArray(input.items) ? input.items.slice(0, 30) : [];
  const items = []; const stockUse = {};
  for (const it of raw) {
    const p = bySlug(c, it.id); const units = Number(it.units) || 1; const qty = Math.min(50, Math.max(1, Number(it.qty) || 1));
    if (!p || p.activo === false || packOff(p, units) === null) continue;
    stockUse[p.slug] = (stockUse[p.slug] || 0) + units * qty;
    const unit = packPrice(p, units);
    items.push({ id: p.slug, nombre: p.nombre, variante: [p.tamano, p.sabor].filter(Boolean).join(" · "), unidades: units, cantidad: qty, precio: unit, total: unit * qty, imagen: p.imagenes.mini });
  }
  if (!items.length) throw Object.assign(new Error("Tu carrito está vacío."), { status: 400 });
  for (const [slug, n] of Object.entries(stockUse)) {
    const p = bySlug(c, slug);
    if (p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) < n) throw Object.assign(new Error(`No hay suficientes unidades de ${p.nombre}. Disponibles: ${p.stock}.`), { status: 409 });
  }
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  let descuento = 0, cupon = "";
  const code = str(input.cupon, 40).toUpperCase();
  if (code) {
    const cp = c.cupones.find((x) => x.activo && String(x.codigo).toUpperCase() === code);
    if (cp && subtotal >= Number(cp.minimo || 0)) { descuento = Math.round(subtotal * Number(cp.porcentaje) / 100); cupon = code; }
  }
  const envio = subtotal - descuento >= c.sitio.envioGratisDesde ? 0 : Number(c.sitio.costoEnvio || 0);
  const total = subtotal - descuento + envio;
  const metodoPago = c.metodosPago.includes(input.metodoPago) ? input.metodoPago : c.metodosPago[0];
  const n = await cmd("INCR", K.seq);
  const numero = 1000 + Number(n);
  const fecha = new Date().toISOString();
  const order = { id: String(numero), numero, fecha, estado: "nuevo", pago: "pendiente", metodoPago, cliente, items, subtotal, descuento, cupon, envio, envioPorConfirmar: envio === 0 && subtotal - descuento < c.sitio.envioGratisDesde, total, guia: "", transportadora: "", notaInterna: "", historial: [{ fecha, texto: "Pedido creado en la tienda online" }] };
  const ops = [["SET", K.order(order.id), JSON.stringify(order)], ["ZADD", K.orders, String(Date.now()), order.id]];
  await pipeline(ops);
  // Descontar inventario
  let changed = false;
  for (const [slug, used] of Object.entries(stockUse)) {
    const p = bySlug(c, slug);
    if (p.stock !== null && p.stock !== undefined && p.stock !== "") { p.stock = Math.max(0, Number(p.stock) - used); changed = true; }
  }
  if (changed) await saveCatalog(c);
  return order;
}

export async function listOrders(limit = 2000) {
  const ids = await cmd("ZREVRANGE", K.orders, "0", String(limit - 1));
  if (!ids || !ids.length) return [];
  const raws = await cmd("MGET", ...ids.map(K.order));
  return raws.filter(Boolean).map((r) => JSON.parse(r));
}

export async function updateOrder(id, patch) {
  const raw = await cmd("GET", K.order(id));
  if (!raw) throw Object.assign(new Error("Pedido no encontrado"), { status: 404 });
  const o = JSON.parse(raw); const now = new Date().toISOString();
  if (patch.estado && ESTADOS.includes(patch.estado) && patch.estado !== o.estado) { o.historial.push({ fecha: now, texto: `Estado: ${o.estado} → ${patch.estado}` }); o.estado = patch.estado; }
  if (patch.pago && ["pendiente", "pagado", "reembolsado"].includes(patch.pago) && patch.pago !== o.pago) { o.historial.push({ fecha: now, texto: `Pago: ${o.pago} → ${patch.pago}` }); o.pago = patch.pago; }
  for (const k of ["guia", "transportadora", "notaInterna"]) if (typeof patch[k] === "string" && patch[k] !== o[k]) { o[k] = str(patch[k], 1000); if (k !== "notaInterna") o.historial.push({ fecha: now, texto: `${k === "guia" ? "Guía" : "Transportadora"}: ${o[k]}` }); }
  if (typeof patch.envio === "number" && patch.envio >= 0 && patch.envio !== o.envio) { o.envio = Math.round(patch.envio); o.envioPorConfirmar = false; o.total = o.subtotal - o.descuento + o.envio; o.historial.push({ fecha: now, texto: `Envío ajustado a $${o.envio.toLocaleString("es-CO")}` }); }
  if (typeof patch.comentario === "string" && patch.comentario.trim()) o.historial.push({ fecha: now, texto: str(patch.comentario, 500), nota: true });
  await cmd("SET", K.order(id), JSON.stringify(o));
  return o;
}

export async function deleteOrder(id) { await pipeline([["DEL", K.order(id)], ["ZREM", K.orders, id]]); }
