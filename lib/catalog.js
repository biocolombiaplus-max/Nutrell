import seed from "./seed.js";
import { cmd, pipeline, dbConfigured, K } from "./db.js";
import crypto from "node:crypto";
import { wompiConfig, integritySignature } from "./wompi.js";

let memo = { at: 0, data: null };

// Campaña especial (Black Friday). Editable en el panel → Descuentos.
export const CAMPANA_DEFAULT = {
  activo: true, nombre: "Black Friday", titulo: "Black Friday Nutrell",
  texto: "Los mejores precios del año en toda la tienda. Solo por pocos días.",
  codigo: "BLACKFRIDAY", porcentaje: 20, fin: "2026-11-30T23:59:59-05:00",
};
export function campanaActiva(c) {
  const k = c.campana;
  if (!k || !k.activo || !k.codigo || !(Number(k.porcentaje) > 0)) return null;
  if (k.fin && new Date(k.fin).getTime() < Date.now()) return null;
  return k;
}
// Cupones vigentes, incluido el de la campaña activa
export function allCoupons(c) {
  const list = c.cupones.filter((x) => x.activo);
  const k = campanaActiva(c);
  if (k && !list.some((x) => String(x.codigo).toUpperCase() === String(k.codigo).toUpperCase())) list.push({ codigo: k.codigo, porcentaje: Number(k.porcentaje), minimo: 0, activo: true });
  return list;
}
// "Ritual" pasó a llamarse "Combo"
const toCombo = (t) => typeof t !== "string" ? t : t.replace(/Rituales/g, "Combos").replace(/rituales/g, "combos").replace(/Ritual/g, "Combo").replace(/ritual/g, "combo");

// Servicio de maquila (editable en el panel → Mayoristas → Maquila → Editar página)
export const MAQUILA_DEFAULT = {
  "activo": true,
  "imagen": "/assets/img/banners/maquila.webp",
  "etiqueta": "Servicio de maquila · Marca blanca",
  "titulo": "Tu marca de suplementos,",
  "destacado": "fabricada por expertos.",
  "texto": "Te acompañamos de la idea al producto terminado: formulamos, fabricamos, envasamos y etiquetamos con tu marca, con los estándares con los que creamos cada producto Nutrell.",
  "tarjetaTitulo": "Marca blanca",
  "tarjetaTexto": "Polvos · líquidos · sobres",
  "cifras": [
    {
      "valor": "3",
      "texto": "formatos de producto"
    },
    {
      "valor": "5",
      "texto": "etapas acompañadas"
    },
    {
      "valor": "100%",
      "texto": "con tu marca"
    }
  ],
  "beneficios": [
    {
      "titulo": "Fórmulas que funcionan",
      "texto": "Desarrollamos productos que ya conocemos en el mercado: colágenos, superalimentos, fibras y bebidas."
    },
    {
      "titulo": "Sabores que se disfrutan",
      "texto": "Fórmulas endulzadas con stevia y con sabores pensados para que tu cliente repita."
    },
    {
      "titulo": "Calidad constante",
      "texto": "Los mismos procesos y controles con los que fabricamos la línea Nutrell."
    },
    {
      "titulo": "Asesor dedicado",
      "texto": "Un acompañante de tu proyecto en cada etapa, de la muestra a la entrega."
    }
  ],
  "seccionTitulo": "Creamos",
  "seccionDestacado": "tu propia marca",
  "seccionCierre": "de suplementos",
  "seccionTexto": "Llevamos tu idea de la fórmula al producto terminado: desarrollo, fabricación, envasado y etiquetado con tu marca, con la misma calidad con la que hacemos Nutrell.",
  "servicios": [
    {
      "titulo": "Desarrollo de fórmula",
      "texto": "Diseñamos o ajustamos tu fórmula según el objetivo, el sabor y el público de tu marca."
    },
    {
      "titulo": "Fabricación",
      "texto": "Producimos polvos para bebida instantánea, bebidas líquidas y sobres individuales."
    },
    {
      "titulo": "Envase y etiquetado",
      "texto": "Tarros, frascos y sobres con tu marca. Te acompañamos en el diseño de la etiqueta."
    },
    {
      "titulo": "Acompañamiento",
      "texto": "Orientación en los requisitos del producto y entregas programadas a tu bodega."
    }
  ],
  "formatos": [
    "Polvos · tarro",
    "Líquidos · frasco",
    "Sobres individuales",
    "Colágenos",
    "Superalimentos",
    "Fibras"
  ],
  "proceso": [
    "Brief",
    "Fórmula",
    "Muestras",
    "Producción",
    "Entrega"
  ],
  "formTitulo": "Cotiza tu producto",
  "formTexto": "Cuéntanos qué quieres fabricar. Un asesor de maquila te contacta para revisar tu proyecto, cantidades y tiempos.",
  "opcionesProducto": [
    "Colágeno",
    "Proteína / batido",
    "Superalimentos (maca, espirulina…)",
    "Bebida líquida / tónico",
    "Fibra / digestivo",
    "Otro"
  ],
  "opcionesFormato": [
    "Polvo en tarro",
    "Líquido en frasco",
    "Sobres",
    "Aún no lo sé"
  ],
  "opcionesCantidad": [
    "Menos de 500 unidades",
    "500 – 2.000 unidades",
    "2.000 – 10.000 unidades",
    "Más de 10.000 unidades"
  ],
  "faq": [
    {
      "pregunta": "¿Qué cantidad mínima necesito para fabricar?",
      "respuesta": "Depende del producto y del formato. Cuéntanos tu proyecto en el formulario y te damos las opciones de cantidades y precios."
    },
    {
      "pregunta": "¿Pueden crear la fórmula desde cero?",
      "respuesta": "Sí. Podemos desarrollar una fórmula nueva según tu objetivo, tu público y el sabor que buscas, o ajustar una fórmula que ya tengas."
    },
    {
      "pregunta": "¿El producto sale con mi marca?",
      "respuesta": "Sí. El producto se envasa y etiqueta con tu marca. También te acompañamos en el diseño de la etiqueta."
    },
    {
      "pregunta": "¿Cuánto tarda el proceso?",
      "respuesta": "Los tiempos dependen del desarrollo, las muestras y el volumen. En la cotización te damos un cronograma estimado de cada etapa."
    },
    {
      "pregunta": "¿Qué formatos pueden fabricar?",
      "respuesta": "Mezclas en polvo para bebida instantánea en tarro, bebidas líquidas en frasco y sobres individuales."
    }
  ],
  "seoTitulo": "Maquila de suplementos y marca blanca en Colombia | Nutrell",
  "seoDescripcion": "Fabricamos tu propia marca de suplementos: desarrollo de fórmula, fabricación de polvos, líquidos y sobres, envasado y etiquetado. Cotiza tu proyecto con Nutrell."
};

// Programa de mayoristas (editable en el panel → Mayoristas → Configurar programa)
export const MAYORISTAS_DEFAULT = {
  activo: true,
  ...{"destacado": "en tu negocio.", "beneficios": [{"titulo": "Precios exclusivos", "texto": "Descuentos de hasta {descuento}% sobre el precio público, según tu nivel."}, {"titulo": "Asesor comercial", "texto": "Acompañamiento directo por WhatsApp para tus pedidos y tu rotación."}, {"titulo": "Material de venta", "texto": "Fotos, fichas y contenidos para tus redes y tu punto de venta."}, {"titulo": "Portal de pedidos 24/7", "texto": "Pide cuando quieras, paga en línea y consulta el estado de tus despachos."}], "pasos": [{"titulo": "Envía tu solicitud", "texto": "Cuéntanos sobre tu negocio y crea tu contraseña de acceso."}, {"titulo": "Te aprobamos", "texto": "Revisamos tu perfil y te asignamos tu nivel y tus precios."}, {"titulo": "Haz tus pedidos", "texto": "Ingresa al portal, pide por cantidades y paga como prefieras."}], "requisitos": ["Negocio formal o en proceso de formalización", "Punto de venta físico o canal digital activo", "Compromiso con el pedido mínimo de tu nivel"], "canales": ["Tienda física", "Instagram / Facebook", "WhatsApp", "Página web", "Marketplace", "Consultorio", "Venta directa"], "faq": [{"pregunta": "¿Quiénes pueden ser mayoristas Nutrell?", "respuesta": "Tiendas naturistas, droguerías, gimnasios, consultorios y profesionales de la salud, spas, distribuidores y emprendedores que vendan nuestros productos."}, {"pregunta": "¿Cuánto tarda la aprobación?", "respuesta": "Revisamos cada solicitud y te respondemos normalmente en 24 a 48 horas hábiles por WhatsApp o correo."}, {"pregunta": "¿Cómo hago mis pedidos?", "respuesta": "Una vez aprobado, ingresas al portal mayorista con tu correo y contraseña, ves tus precios exclusivos, armas el pedido por cantidades y lo pagas en línea, por transferencia o con crédito si lo tienes habilitado."}, {"pregunta": "¿Hay pedido mínimo?", "respuesta": "Sí, cada nivel tiene un pedido mínimo. Entre más compras, mejor es tu nivel y tu descuento."}, {"pregunta": "¿Cómo es el envío?", "respuesta": "Despachamos a toda Colombia. El valor del envío se confirma según la ciudad y el volumen del pedido."}]},
  titulo: "Distribuye Nutrell",
  texto: "Lleva nuestras fórmulas premium a tu tienda naturista, droguería, gimnasio o consultorio, con precios exclusivos y acompañamiento comercial.",
  niveles: [
    { id: "tienda", nombre: "Tienda", descuento: 20, minimo: 300000, descripcion: "Tiendas naturistas, droguerías y emprendedores" },
    { id: "distribuidor", nombre: "Distribuidor", descuento: 25, minimo: 800000, descripcion: "Distribuidores regionales y cadenas pequeñas" },
    { id: "oro", nombre: "Distribuidor Oro", descuento: 30, minimo: 2000000, descripcion: "Alto volumen y distribución exclusiva por zona" },
  ],
  nivelInicial: "tienda",
  metodos: { online: true, transferencia: true, credito: true },
  datosTransferencia: "Te enviaremos los datos de la cuenta por WhatsApp al confirmar tu pedido.",
  tiposNegocio: ["Tienda naturista", "Droguería / farmacia", "Gimnasio / centro deportivo", "Consultorio / IPS / profesional de la salud", "Spa / estética", "Distribuidor", "Supermercado / minimercado", "Venta por catálogo / redes", "Otro"],
};
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
  if (!c.sitio.whatsapp || c.sitio.whatsapp === "573000000000") c.sitio.whatsapp = s.sitio.whatsapp;
  if (!c.sitio.email) c.sitio.email = s.sitio.email;
  if (!Array.isArray(c.sitio.lineas) || !c.sitio.lineas.length) c.sitio.lineas = s.sitio.lineas;
  c.contenido = { ...s.contenido, ...(c.contenido || {}) };
  c.contenido.hero = { ...s.contenido.hero, ...(c.contenido.hero || {}) };
  c.contenido.hero.slides = (Array.isArray(c.contenido.hero.slides) ? c.contenido.hero.slides : s.contenido.hero.slides).filter((x) => x && x.imagen);
  c.contenido.club = { ...s.contenido.club, ...(c.contenido.club || {}) };
  c.contenido.seo = { ...s.contenido.seo, ...(c.contenido.seo || {}) };
  c.contenido.coleccion = { ...s.contenido.coleccion, ...(c.contenido.coleccion || {}) };
  for (const k of ["anuncios", "promesa", "resenas", "faq"]) if (!Array.isArray(c.contenido[k])) c.contenido[k] = s.contenido[k];
  c.cupones = Array.isArray(c.cupones) ? c.cupones : [];
  c.metodosPago = Array.isArray(c.metodosPago) && c.metodosPago.length ? c.metodosPago : s.metodosPago;
  c.categorias = Array.isArray(c.categorias) && c.categorias.length ? c.categorias : s.categorias;
  c.rituales = (Array.isArray(c.rituales) ? c.rituales : []).map((r) => ({ ...r, nombre: toCombo(r.nombre), frase: toCombo(r.frase) }));
  for (const k of ["promesa", "faq", "resenas"]) c.contenido[k] = c.contenido[k].map((x) => Object.fromEntries(Object.entries(x).map(([a, b]) => [a, toCombo(b)])));
  c.campana = { ...CAMPANA_DEFAULT, ...(c.campana || {}) };
  c.mayoristas = { ...MAYORISTAS_DEFAULT, ...(c.mayoristas || {}) };
  if (!Array.isArray(c.mayoristas.niveles) || !c.mayoristas.niveles.length) c.mayoristas.niveles = MAYORISTAS_DEFAULT.niveles;
  for (const k of ["beneficios", "pasos", "requisitos", "canales", "faq", "tiposNegocio"]) if (!Array.isArray(c.mayoristas[k])) c.mayoristas[k] = MAYORISTAS_DEFAULT[k];
  c.maquila = { ...MAQUILA_DEFAULT, ...(c.maquila || {}) };
  for (const k of Object.keys(MAQUILA_DEFAULT)) if (Array.isArray(MAQUILA_DEFAULT[k]) && !Array.isArray(c.maquila[k])) c.maquila[k] = MAQUILA_DEFAULT[k];
  c.productos = (Array.isArray(c.productos) ? c.productos : []).filter((p) => p && p.slug).map((p) => ({
    activo: true, stock: null, etiqueta: "", tamano: "", sabor: "", formato: "Polvo", h1: [p.nombre || "", ""],
    packs: [{ unidades: 1, descuento: 0, texto: "" }], tema: { acento: "#c9a24b", suave: "#efe4cc", oscuro: "#1a1712" },
    imagenes: {}, resumen: "", subtitulo: "", seoTitulo: "", seoDescripcion: "", descripcion: [], destacados: [], cifra: ["", ""],
    ingredientes: [], libreDe: [], pasos: [], advertencias: "", faq: [], ...p,
    precio: Math.max(0, Math.round(Number(p.precio) || 0)), antes: Math.max(0, Math.round(Number(p.antes) || 0)),
  }));
  for (const p of c.productos) {
    p.packs = p.packs.map((x) => ({ ...x, texto: typeof x.texto === "string" ? x.texto.replace(/ritual/g, "rutina") : x.texto }));
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
    wompi: !!c._wompi?.enabled, wompiTest: !!c._wompi?.test,
    config: { whatsapp: c.sitio.whatsapp, freeShippingFrom: c.sitio.envioGratisDesde, shippingCost: c.sitio.costoEnvio, promoEnds: c.sitio.finOferta, payments: c.metodosPago },
    campaign: (() => { const k = campanaActiva(c); return k ? { name: k.nombre, code: String(k.codigo).toUpperCase(), pct: Number(k.porcentaje), ends: k.fin } : null; })(),
    nequi: c.sitio.nequiActivo && c.sitio.nequiNumero ? { number: c.sitio.nequiNumero, holder: c.sitio.nequiTitular } : null,
    coupons: allCoupons(c).map((x) => ({ code: String(x.codigo).toUpperCase(), pct: Number(x.porcentaje), min: Number(x.minimo || 0) })),
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
    const cp = allCoupons(c).find((x) => String(x.codigo).toUpperCase() === code);
    if (cp && subtotal >= Number(cp.minimo || 0)) { descuento = Math.round(subtotal * Number(cp.porcentaje) / 100); cupon = code; }
  }
  const envio = subtotal - descuento >= c.sitio.envioGratisDesde ? 0 : Number(c.sitio.costoEnvio || 0);
  const total = subtotal - descuento + envio;
  const online = !!input.online;
  if (online && !(await wompiConfig()).enabled) throw Object.assign(new Error("El pago en línea no está disponible en este momento. Elige otro método."), { status: 400 });
  const nequi = !online && input.metodoPago === "__nequi" && c.sitio.nequiActivo && c.sitio.nequiNumero;
  const metodoPago = online ? "Pago en línea (Wompi)" : nequi ? "Nequi directo" : c.metodosPago.includes(input.metodoPago) ? input.metodoPago : c.metodosPago[0];
  const n = await cmd("INCR", K.seq);
  const numero = 1000 + Number(n);
  const fecha = new Date().toISOString();
  const order = { id: String(numero), numero, fecha, estado: "nuevo", pago: "pendiente", metodoPago, cliente, items, subtotal, descuento, cupon, envio, envioPorConfirmar: envio === 0 && subtotal - descuento < c.sitio.envioGratisDesde, total, online, refs: [], wompi: null, guia: "", transportadora: "", notaInterna: "", historial: [{ fecha, texto: online ? "Pedido creado · esperando pago en línea" : "Pedido creado en la tienda online" }] };
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
  if (patch.pago && ["pendiente", "pagado", "rechazado", "reembolsado"].includes(patch.pago) && patch.pago !== o.pago) { o.historial.push({ fecha: now, texto: `Pago: ${o.pago} → ${patch.pago}` }); o.pago = patch.pago; }
  for (const k of ["guia", "transportadora", "notaInterna"]) if (typeof patch[k] === "string" && patch[k] !== o[k]) { o[k] = str(patch[k], 1000); if (k !== "notaInterna") o.historial.push({ fecha: now, texto: `${k === "guia" ? "Guía" : "Transportadora"}: ${o[k]}` }); }
  if (typeof patch.envio === "number" && patch.envio >= 0 && patch.envio !== o.envio) { o.envio = Math.round(patch.envio); o.envioPorConfirmar = false; o.total = o.subtotal - o.descuento + o.envio; o.historial.push({ fecha: now, texto: `Envío ajustado a $${o.envio.toLocaleString("es-CO")}` }); }
  if (typeof patch.comentario === "string" && patch.comentario.trim()) o.historial.push({ fecha: now, texto: str(patch.comentario, 500), nota: true });
  await cmd("SET", K.order(id), JSON.stringify(o));
  return o;
}

export async function deleteOrder(id) { await pipeline([["DEL", K.order(id)], ["ZREM", K.orders, id]]); }

export async function getOrder(id) { const raw = await cmd("GET", K.order(String(id))); return raw ? JSON.parse(raw) : null; }
export async function putOrder(o) { await cmd("SET", K.order(o.id), JSON.stringify(o)); }

// Parámetros firmados para abrir el checkout de Wompi (una referencia nueva por intento)
export async function payParams(o, origin) {
  const cfg = await wompiConfig();
  if (!cfg.enabled) throw Object.assign(new Error("El pago en línea no está configurado."), { status: 400 });
  if (o.pago === "pagado") throw Object.assign(new Error("Este pedido ya está pagado."), { status: 409 });
  if (o.estado === "cancelado") throw Object.assign(new Error("Este pedido fue cancelado."), { status: 409 });
  const reference = `NUT${o.numero}-${crypto.randomBytes(4).toString("hex")}`;
  const amountInCents = Math.round(o.total * 100);
  o.refs = [...(o.refs || []), reference].slice(-20);
  await putOrder(o);
  const phone = String(o.cliente.telefono || "").replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "");
  return {
    publicKey: cfg.publicKey, currency: "COP", amountInCents, reference,
    signature: { integrity: integritySignature(reference, amountInCents, "COP", cfg.integrity) },
    redirectUrl: origin + "/pedido",
    customerData: { fullName: o.cliente.nombre, phoneNumber: phone, phoneNumberPrefix: "+57", ...(o.cliente.email ? { email: o.cliente.email } : {}) },
    shippingAddress: { addressLine1: o.cliente.direccion.slice(0, 100) || "N/A", city: o.cliente.ciudad || "N/A", region: o.cliente.departamento || o.cliente.ciudad || "N/A", country: "CO", phoneNumber: phone || "3000000000" },
    test: cfg.test,
  };
}

const STATUS = { APPROVED: "pagado", DECLINED: "rechazado", VOIDED: "rechazado", ERROR: "rechazado" };
const METODO = { CARD: "Tarjeta", PSE: "PSE", NEQUI: "Nequi", BANCOLOMBIA_TRANSFER: "Botón Bancolombia", BANCOLOMBIA_QR: "QR Bancolombia", BANCOLOMBIA_COLLECT: "Corresponsal Bancolombia", DAVIPLATA: "Daviplata", PCOL: "Puntos Colombia" };

// Aplica una transacción de Wompi (ya verificada) al pedido correspondiente
export async function applyTransaction(tx) {
  const m = /^NUT(\d+)-/.exec(tx?.reference || "");
  if (!m) return null;
  const o = await getOrder(m[1]);
  if (!o || !(o.refs || []).includes(tx.reference)) return null;
  const okAmount = Number(tx.amount_in_cents) === Math.round(o.total * 100) && tx.currency === "COP";
  const now = new Date().toISOString();
  const metodo = METODO[tx.payment_method_type] || tx.payment_method_type || "";
  const prev = o.wompi?.id === tx.id ? o.wompi.status : null;
  // Nunca bajar un pedido ya pagado por un intento posterior fallido
  if (o.pago === "pagado" && o.wompi?.id !== tx.id) return o;
  o.wompi = { id: tx.id, status: tx.status, metodo, referencia: tx.reference, fecha: tx.finalized_at || tx.created_at || now };
  if (prev !== tx.status) {
    if (tx.status === "APPROVED" && !okAmount) {
      o.historial.push({ fecha: now, texto: `⚠ Pago aprobado en Wompi pero el monto no coincide (${tx.amount_in_cents / 100}). Revisar.` });
    } else if (STATUS[tx.status]) {
      const nuevo = STATUS[tx.status];
      o.historial.push({ fecha: now, texto: tx.status === "APPROVED" ? `Pago aprobado en Wompi · ${metodo} · transacción ${tx.id}` : `Pago ${tx.status === "DECLINED" ? "rechazado" : "no completado"} en Wompi · ${metodo}${tx.status_message ? " · " + tx.status_message : ""}` });
      if (!(o.pago === "pagado" && nuevo !== "pagado")) o.pago = nuevo;
      if (tx.status === "APPROVED" && o.estado === "nuevo") { o.estado = "confirmado"; o.historial.push({ fecha: now, texto: "Estado: nuevo → confirmado (pago en línea)" }); }
    } else if (tx.status === "PENDING") {
      o.historial.push({ fecha: now, texto: `Pago en proceso en Wompi · ${metodo}` });
    }
  }
  await putOrder(o);
  return o;
}
