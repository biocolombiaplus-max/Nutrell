/* =========================================================
   NUTRELL ADMIN
   ========================================================= */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cop = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CO");
const copShort = (n) => n >= 1e6 ? "$" + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(".", ",") + " M" : n >= 1e3 ? "$" + Math.round(n / 1e3) + " mil" : cop(n);
const TZ = "America/Bogota";
const fDate = (d, o = { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) => new Date(d).toLocaleString("es-CO", { timeZone: TZ, ...o });
const dayKey = (d) => new Date(new Date(d).getTime() - 5 * 3600e3).toISOString().slice(0, 10);
const clone = (o) => JSON.parse(JSON.stringify(o));
const slugify = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const ICON = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
  orders: '<path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 016 0"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a5 5 0 013.5 6"/>',
  tag: '<path d="M3 12V4a1 1 0 011-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
  store: '<path d="M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0 2.7 2.7 0 005.3 0M10 20v-5h4v5"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
  out: '<path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  wa: '<path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-3.9-1L4 20z"/>',
  print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a2 2 0 012-2h14a2 2 0 012 2v6a1 1 0 01-1 1h-2M7 14h10v7H7z"/>',
  dl: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V4a1 1 0 00-1-1H4a1 1 0 00-1 1v11a1 1 0 001 1h4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
};
const ic = (n, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

const ESTADOS = [["nuevo", "Nuevo"], ["confirmado", "Confirmado"], ["preparando", "Preparando"], ["enviado", "Enviado"], ["entregado", "Entregado"], ["cancelado", "Cancelado"]];
const PAGOS = [["pendiente", "Pendiente"], ["pagado", "Pagado"], ["rechazado", "Rechazado"], ["reembolsado", "Reembolsado"]];
const lbl = (arr, k) => (arr.find((x) => x[0] === k) || [k, k])[1];
const badge = (k, arr = ESTADOS) => `<span class="badge b-${esc(k)}">${esc(lbl(arr, k))}</span>`;

/* ---------- Estado ---------- */
const S = { status: null, cat: null, saved: null, orders: [], visits: {}, range: 30, dirty: false, tab: "todos", q: "" };

async function api(a, data, method) {
  const r = await fetch(`/api/admin?a=${a}${method === "GET" && data ? "&" + new URLSearchParams(data) : ""}`, {
    method: method || (data ? "POST" : "GET"), headers: data && method !== "GET" ? { "Content-Type": "application/json" } : {},
    body: data && method !== "GET" ? JSON.stringify(data) : undefined, credentials: "same-origin",
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && a !== "login") { S.status.admin = false; renderAuth(); throw new Error(j.error || "Sesión expirada"); }
  if (!r.ok) throw new Error(j.error || "Error " + r.status);
  return j;
}

let toastT;
function toast(msg, err = false) {
  let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.toggle("err", err); t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2800);
}
function confirmBox(title, text, okLabel = "Confirmar", danger = false) {
  return new Promise((res) => {
    const m = document.createElement("div"); m.className = "modal-bg";
    m.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="acts"><button class="btn btn-line" data-n>Cancelar</button><button class="btn ${danger ? "btn-danger" : "btn-dark"}" data-y>${esc(okLabel)}</button></div></div>`;
    document.body.appendChild(m);
    const done = (v) => { m.remove(); res(v); };
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-n]")) done(false); if (e.target.closest("[data-y]")) done(true); });
  });
}

/* ---------- Arranque ---------- */
init();
async function init() {
  try { S.status = await (await fetch("/api/admin?a=status", { credentials: "same-origin" })).json(); }
  catch { S.status = { db: false, admin: false }; }
  if (!S.status.admin) return renderAuth();
  await boot();
}
function renderAuth() {
  $("#root").innerHTML = `<div class="auth"><form class="auth-card">
    <img src="/assets/img/nutrell-logo-light.png" alt="Nutrell">
    <h1>Panel administrativo</h1><p>Ingresa para gestionar tu tienda, pedidos y ventas.</p>
    <label>Contraseña<input type="password" name="password" autocomplete="current-password" autofocus required></label>
    <button class="btn btn-gold" type="submit">${ic("lock")}Ingresar</button>
    <div class="auth-err"></div>
    <p style="margin:18px 0 0;font-size:.8rem"><a href="/" style="color:var(--gold-2)">← Volver a la tienda</a></p>
  </form></div>`;
  $(".auth-card").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("button", e.target), err = $(".auth-err"); btn.disabled = true; err.textContent = "";
    try { await api("login", { password: e.target.password.value }); S.status.admin = true; await boot(); }
    catch (x) { err.textContent = x.message; btn.disabled = false; }
  });
}
async function boot() {
  $("#root").innerHTML = `<div class="content" style="display:grid;place-items:center;min-height:80vh;color:var(--muted)">Cargando tu tienda…</div>`;
  const [cat, orders, visits, status] = await Promise.all([api("catalog"), api("orders").catch(() => []), api("visits", { days: 365 }, "GET").catch(() => ({})), fetch("/api/admin?a=status").then((r) => r.json())]);
  S.cat = cat; S.saved = JSON.stringify(cat); S.orders = orders; S.ordersAt = Date.now(); S.visits = visits; S.status = status;
  shell(); route();
}
async function reloadOrders() { S.orders = await api("orders").catch(() => S.orders); S.ordersAt = Date.now(); }
// Pedidos en vivo: revisa cada 40 s y avisa cuando entra uno nuevo
setInterval(async () => {
  if (!S.cat || !S.status?.db || document.hidden) return;
  const before = new Set(S.orders.map((o) => o.id + o.pago + o.estado));
  const prevIds = new Set(S.orders.map((o) => o.id));
  await reloadOrders();
  const nuevos = S.orders.filter((o) => !prevIds.has(o.id));
  const changed = S.orders.some((o) => !before.has(o.id + o.pago + o.estado));
  updateNewCount();
  if (nuevos.length) toast(nuevos.length === 1 ? `Nuevo pedido #${nuevos[0].numero} · ${cop(nuevos[0].total)}` : `${nuevos.length} pedidos nuevos`);
  const sec = location.hash.split("/")[1] || "inicio";
  const typing = document.activeElement && document.activeElement.matches("input,textarea,select");
  if (changed && ["inicio", "pedidos", "clientes"].includes(sec) && !typing && !S.dirty) { const y = scrollY; route(); scrollTo(0, y); }
}, 40000);

/* ---------- Estructura ---------- */
const NAV = [["inicio", "Inicio", "home"], ["pedidos", "Pedidos", "orders"], ["productos", "Productos", "box"], ["clientes", "Clientes", "users"], ["descuentos", "Descuentos", "tag"],
  [null, "Canal de venta"], ["tienda", "Tienda online", "store"], ["colecciones", "Colecciones y rituales", "layers"], [null, ""], ["ajustes", "Configuración", "cog"]];
function shell() {
  $("#root").innerHTML = `<div class="app">
    <aside class="side">
      <a class="brand" href="#/inicio"><img src="/assets/img/nutrell-logo-light.png" alt="Nutrell"><span>Admin</span></a>
      ${NAV.map(([k, t, i]) => k ? `<a class="nav-i" href="#/${k}" data-nav="${k}">${ic(i)}${t}${k === "pedidos" ? '<span class="count" data-new-count hidden></span>' : ""}</a>` : t ? `<div class="nav-g">${t}</div>` : "").join("")}
      <div class="foot">
        <a class="nav-i" href="/" target="_blank" rel="noopener">${ic("ext")}Ver tienda</a>
        <button class="nav-i" data-logout>${ic("out")}Cerrar sesión</button>
      </div>
    </aside>
    <div class="scrim"></div>
    <div class="main">
      <header class="top">
        <button class="icon-b burger" aria-label="Menú">${ic("menu")}</button>
        <div class="search">${ic("search")}<input placeholder="Buscar pedidos, productos o clientes" aria-label="Buscar" data-gsearch><div class="search-res hidden"></div></div>
        <div class="right">
          <a class="btn btn-line btn-sm hide-m" href="/" target="_blank" rel="noopener">${ic("ext")}Ver tienda</a>
          <span class="avatar" title="Administrador">NU</span>
        </div>
      </header>
      <div class="savebar"><span>Cambios sin guardar</span><div class="actions"><button class="btn btn-line btn-sm" data-discard>Descartar</button><button class="btn btn-gold btn-sm" data-save>Guardar</button></div></div>
      <main class="content" id="view"></main>
    </div>
  </div>`;
  $(".burger").onclick = () => { $(".side").classList.add("open"); $(".scrim").classList.add("show"); };
  $(".scrim").onclick = closeSide;
  $("[data-logout]").onclick = async () => { await api("logout").catch(() => {}); location.hash = ""; S.status.admin = false; renderAuth(); };
  $("[data-save]").onclick = save;
  $("[data-discard]").onclick = () => { S.cat = JSON.parse(S.saved); markDirty(); route(); toast("Cambios descartados"); };
  initSearch();
  updateNewCount();
}
function closeSide() { $(".side")?.classList.remove("open"); $(".scrim")?.classList.remove("show"); }
function updateNewCount() { const n = S.orders.filter((o) => o.estado === "nuevo").length; const el = $("[data-new-count]"); if (el) { el.hidden = !n; el.textContent = n; } }

function markDirty() {
  S.dirty = JSON.stringify(S.cat) !== S.saved;
  $(".savebar")?.classList.toggle("show", S.dirty);
}
async function save() {
  const b = $("[data-save]"); b.disabled = true; b.textContent = "Guardando…";
  try { S.cat = await api("save", S.cat); S.saved = JSON.stringify(S.cat); markDirty(); toast("Cambios publicados en la tienda"); route(); }
  catch (e) { toast(e.message, true); }
  b.disabled = false; b.textContent = "Guardar";
}
window.addEventListener("beforeunload", (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ""; } });
window.addEventListener("hashchange", route);

function route() {
  if (!S.cat || !$("#view")) return;
  closeSide();
  const [, sec = "inicio", id] = location.hash.split("/");
  $$("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === sec));
  const v = $("#view");
  const banner = !S.status.db ? `<div class="banner">${ic("warn")}<div><b>Conecta la base de datos para empezar a vender y guardar cambios.</b><br>En Vercel: tu proyecto → <b>Storage</b> → <b>Create Database</b> → <b>Upstash for Redis</b> (plan gratis) → <b>Connect</b>. Luego vuelve a desplegar. Mientras tanto ves el catálogo inicial y los pedidos llegan solo por WhatsApp.</div></div>`
    : S.status.defaultPassword ? `<div class="banner">${ic("lock")}<div><b>Estás usando la clave inicial 123456.</b> Cualquiera que la adivine puede entrar a tu panel. <a href="#/ajustes" style="text-decoration:underline">Cámbiala ahora en Configuración → Seguridad</a>.</div></div>` : "";
  if (["inicio", "pedidos", "clientes"].includes(sec) && S.status.db && Date.now() - (S.ordersAt || 0) > 4000) { S.ordersAt = Date.now(); reloadOrders().then(() => { updateNewCount(); if ((location.hash.split("/")[1] || "inicio") === sec) { const y = scrollY; route(); scrollTo(0, y); } }); }
  const views = { inicio: vDashboard, pedidos: id ? () => vOrder(id) : vOrders, productos: id ? () => vProduct(id) : vProducts, clientes: vCustomers, descuentos: vDiscounts, tienda: vContent, colecciones: vCollections, ajustes: vSettings };
  v.innerHTML = banner + (views[sec] || vDashboard)();
  window.scrollTo(0, 0);
  after.forEach((f) => f(v)); after = [];
}
let after = [];
const later = (f) => after.push(f);

/* ---------- Enlaces de datos (inputs ↔ catálogo) ---------- */
function getPath(o, p) { return p.split(".").reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v) { const ks = p.split("."); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] ??= {}), o); t[last] = v; }
function bindInputs(root, base, onChange) {
  $$("[data-b]", root).forEach((el) => {
    const path = el.dataset.b;
    const cur = getPath(base(), path);
    if (el.type === "checkbox") el.checked = el.dataset.invert ? !cur : !!cur;
    else if (el.dataset.t === "lines") el.value = (cur || []).join("\n");
    else if (el.dataset.t === "paras") el.value = (cur || []).join("\n\n");
    else if (el.dataset.t === "dt") el.value = cur ? new Date(new Date(cur).getTime() - 5 * 3600e3).toISOString().slice(0, 16) : "";
    else el.value = cur ?? "";
    const ev = el.tagName === "SELECT" || el.type === "checkbox" || el.type === "color" ? "change" : "input";
    el.addEventListener(ev, () => {
      let v = el.value;
      if (el.type === "checkbox") v = el.dataset.invert ? !el.checked : el.checked;
      else if (el.dataset.t === "num") v = v === "" ? 0 : Number(v);
      else if (el.dataset.t === "numnull") v = v === "" ? null : Math.max(0, Math.round(Number(v)));
      else if (el.dataset.t === "lines") v = v.split("\n").map((x) => x.trim()).filter(Boolean);
      else if (el.dataset.t === "paras") v = v.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
      else if (el.dataset.t === "dt") v = v ? v + ":00-05:00" : "";
      setPath(base(), path, v);
      markDirty(); onChange && onChange(path, v, el);
    });
    if (el.type === "color") el.addEventListener("input", () => { setPath(base(), path, el.value); markDirty(); onChange && onChange(path, el.value, el); });
  });
}
const fld = (label, b, { type = "text", t = "", ph = "", help = "", max = 0, rows = 0, opts = null, attrs = "" } = {}) => {
  const counter = max ? `<em class="cnt" data-cnt="${max}"></em>` : "";
  let input;
  if (opts) input = `<select data-b="${b}" ${t ? `data-t="${t}"` : ""} ${attrs}>${opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select>`;
  else if (rows) input = `<textarea data-b="${b}" rows="${rows}" ${t ? `data-t="${t}"` : ""} placeholder="${esc(ph)}" ${attrs}></textarea>`;
  else input = `<input type="${type}" data-b="${b}" ${t ? `data-t="${t}"` : ""} placeholder="${esc(ph)}" ${attrs}>`;
  return `<label class="f"><span>${label}${counter}</span>${input}${help ? `<span class="help">${help}</span>` : ""}</label>`;
};
const money = (label, b, help = "") => `<label class="f"><span>${label}</span><div class="pre"><b>$</b><input type="number" min="0" step="100" data-b="${b}" data-t="num" inputmode="numeric"></div>${help ? `<span class="help">${help}</span>` : ""}</label>`;
const sw = (label, b, invert = false) => `<label class="sw"><input type="checkbox" data-b="${b}" ${invert ? 'data-invert="1"' : ""}><i></i>${label}</label>`;
function counters(root) {
  $$("[data-cnt]", root).forEach((c) => {
    const inp = c.closest(".f").querySelector("input,textarea"); const max = Number(c.dataset.cnt);
    const up = () => { c.textContent = `${inp.value.length}/${max}`; c.classList.toggle("over", inp.value.length > max); };
    up(); inp.addEventListener("input", up);
  });
}

// Repetidor de listas de objetos
function repeater(key, items, fields, { title = (i) => `#${i + 1}`, addLabel = "Agregar", blank = {} } = {}) {
  const body = items.map((it, i) => `<div class="rep-i" data-rep="${key}" data-i="${i}">
      <div class="hd">${esc(title(i, it))}<span class="mv"><button type="button" class="icon-b" data-mv="-1" aria-label="Subir">${ic("up")}</button><button type="button" class="icon-b" data-mv="1" aria-label="Bajar">${ic("down")}</button></span></div>
      <button type="button" class="icon-b rm" data-rm aria-label="Quitar">${ic("x")}</button>
      ${fields(i)}
    </div>`).join("");
  return `<div class="rep" data-rep-wrap="${key}">${body}<button type="button" class="add" data-add-rep="${key}" data-blank='${esc(JSON.stringify(blank))}'>${ic("plus")}${addLabel}</button></div>`;
}
function wireRepeaters(root, getArr, rerender) {
  root.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add-rep]");
    if (add) { getArr(add.dataset.addRep).push(JSON.parse(add.dataset.blank)); markDirty(); rerender(); return; }
    const item = e.target.closest("[data-rep]"); if (!item) return;
    const arr = getArr(item.dataset.rep), i = Number(item.dataset.i);
    if (e.target.closest("[data-rm]")) { arr.splice(i, 1); markDirty(); rerender(); }
    const mv = e.target.closest("[data-mv]");
    if (mv) { const j = i + Number(mv.dataset.mv); if (j >= 0 && j < arr.length) { [arr[i], arr[j]] = [arr[j], arr[i]]; markDirty(); rerender(); } }
  });
}

/* ---------- Métricas ---------- */
const valid = (o) => o.estado !== "cancelado";
function inRange(o, days, offset = 0) {
  const t = new Date(o.fecha).getTime(), end = Date.now() - offset * days * 864e5;
  return t <= end && t > end - days * 864e5;
}
function metrics(days, offset = 0) {
  const os = S.orders.filter((o) => inRange(o, days, offset));
  const ok = os.filter(valid);
  const sales = ok.reduce((s, o) => s + o.total, 0);
  let visits = 0;
  for (let i = 0; i < days; i++) visits += S.visits[dayKey(Date.now() - (i + offset * days) * 864e5)] || 0;
  return { sales, orders: ok.length, all: os.length, aov: ok.length ? sales / ok.length : 0, visits, conv: visits ? (ok.length / visits) * 100 : 0, list: ok };
}
function delta(a, b) {
  if (!b && !a) return `<span class="d flat">— sin cambios</span>`;
  if (!b) return `<span class="d up">▲ nuevo</span>`;
  const p = ((a - b) / b) * 100;
  return `<span class="d ${p > 0.5 ? "up" : p < -0.5 ? "down" : "flat"}">${p > 0.5 ? "▲" : p < -0.5 ? "▼" : "•"} ${Math.abs(p).toFixed(0)}% vs. periodo anterior</span>`;
}

/* ---------- INICIO ---------- */
function vDashboard() {
  const d = S.range, m = metrics(d), p = metrics(d, 1);
  const lowStock = S.cat.productos.filter((x) => x.stock !== null && x.stock !== "" && x.stock !== undefined && Number(x.stock) <= 10);
  const top = {}; m.list.forEach((o) => o.items.forEach((i) => { top[i.id] ??= { n: 0, v: 0, nombre: i.nombre, img: i.imagen }; top[i.id].n += i.unidades * i.cantidad; top[i.id].v += i.total; }));
  const topArr = Object.values(top).sort((a, b) => b.v - a.v).slice(0, 5);
  const cities = {}; m.list.forEach((o) => { const c = (o.cliente.ciudad || "—").trim(); cities[c] = (cities[c] || 0) + o.total; });
  const cityArr = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const byState = Object.fromEntries(ESTADOS.map(([k]) => [k, S.orders.filter((o) => o.estado === k).length]));
  const pend = S.orders.filter((o) => ["nuevo", "confirmado", "preparando"].includes(o.estado));
  const hour = Number(new Date().toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hour12: false }));
  later((v) => {
    $$("[data-range]", v).forEach((b) => b.onclick = () => { S.range = Number(b.dataset.range); route(); });
    drawChart($("#salesChart", v), d);
  });
  return `
  <div class="ph"><div><h1>${hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"}</h1><div class="sub">Así va tu tienda Nutrell.</div></div>
    <div class="actions"><div class="seg">${[[1, "Hoy"], [7, "7 días"], [30, "30 días"], [90, "90 días"]].map(([k, l]) => `<button data-range="${k}" class="${k === d ? "on" : ""}">${l}</button>`).join("")}</div></div></div>
  <div class="kpis">
    <div class="kpi hero"><div class="l">Ventas totales</div><div class="v">${cop(m.sales)}</div>${delta(m.sales, p.sales)}</div>
    <div class="kpi"><div class="l">Pedidos</div><div class="v">${m.orders}</div>${delta(m.orders, p.orders)}</div>
    <div class="kpi"><div class="l">Ticket promedio</div><div class="v">${cop(m.aov)}</div>${delta(m.aov, p.aov)}</div>
    <div class="kpi"><div class="l">Visitas</div><div class="v">${m.visits.toLocaleString("es-CO")}</div>${delta(m.visits, p.visits)}</div>
    <div class="kpi"><div class="l">Conversión</div><div class="v">${m.conv.toFixed(1).replace(".", ",")}%</div>${delta(m.conv, p.conv)}</div>
  </div>
  <div class="grid2">
    <div>
      <div class="card"><h2>Ventas por día <small>${d === 1 ? "Hoy" : `Últimos ${d} días`} · sin cancelados</small></h2><div class="chart" id="salesChart"></div></div>
      <div class="card"><h2>Últimos pedidos <small><a href="#/pedidos" style="color:var(--blue)">Ver todos</a></small></h2>${ordersTable(S.orders.slice(0, 6), true)}</div>
    </div>
    <div>
      <div class="card"><h2>Por atender</h2>
        <div class="mini-list">${ESTADOS.slice(0, 4).map(([k, l]) => `<a href="#/pedidos" data-go-tab="${k}" onclick="sessionStorage.setItem('nt-tab','${k}')"><span>${badge(k)}</span><b>${byState[k]}</b></a>`).join("")}</div>
        ${pend.length ? `<p class="muted" style="margin:10px 0 0;font-size:.82rem">Tienes ${pend.length} pedido${pend.length > 1 ? "s" : ""} en proceso.</p>` : ""}
      </div>
      <div class="card"><h2>Productos más vendidos</h2>${topArr.length ? `<div class="bars">${topArr.map((t) => `<div class="bar-row"><img src="${esc(t.img)}" alt=""><div><div class="nm">${esc(t.nombre)}</div><div class="track"><i style="width:${(t.v / topArr[0].v) * 100}%"></i></div></div><div class="vl">${copShort(t.v)}<small>${t.n} und.</small></div></div>`).join("")}</div>` : emptyS("chart", "Aún no hay ventas en este periodo.")}</div>
      <div class="card"><h2>Ciudades</h2>${cityArr.length ? `<div class="bars">${cityArr.map(([c, v]) => `<div class="bar-row" style="grid-template-columns:1fr auto"><div><div class="nm">${esc(c)}</div><div class="track"><i style="width:${(v / cityArr[0][1]) * 100}%"></i></div></div><div class="vl">${copShort(v)}</div></div>`).join("")}</div>` : emptyS("chart", "Sin datos todavía.")}</div>
      ${lowStock.length ? `<div class="card"><h2>${ic("warn")}Inventario bajo</h2><div class="mini-list">${lowStock.map((x) => `<a href="#/productos/${x.slug}"><span>${esc(x.nombre)}</span>${Number(x.stock) <= 0 ? '<span class="badge b-agotado">Agotado</span>' : `<span class="badge b-bajo">${x.stock} und.</span>`}</a>`).join("")}</div></div>` : ""}
    </div>
  </div>`;
}
const emptyS = (i, t) => `<div class="empty-s">${ic(i)}<span>${esc(t)}</span></div>`;

function drawChart(el, days) {
  if (!el) return;
  const n = days === 1 ? 24 : days;
  const pts = [];
  if (days === 1) {
    const today = dayKey(Date.now());
    for (let h = 0; h < 24; h++) pts.push({ k: `${h}:00`, v: 0 });
    S.orders.filter(valid).filter((o) => dayKey(o.fecha) === today).forEach((o) => { const h = Number(new Date(o.fecha).toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hour12: false })) % 24; pts[h].v += o.total; });
  } else {
    const map = {}; S.orders.filter(valid).forEach((o) => { const k = dayKey(o.fecha); map[k] = (map[k] || 0) + o.total; });
    for (let i = n - 1; i >= 0; i--) { const k = dayKey(Date.now() - i * 864e5); pts.push({ k, v: map[k] || 0 }); }
  }
  const W = el.clientWidth || 600, H = el.clientHeight || 260, pl = 56, pr = 12, pt = 14, pb = 28;
  const max = Math.max(...pts.map((p) => p.v), 1);
  const step = niceStep(max / 4); const top = Math.ceil(max / step) * step || step;
  const x = (i) => pl + (i * (W - pl - pr)) / Math.max(1, pts.length - 1);
  const y = (v) => pt + (1 - v / top) * (H - pt - pb);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const area = `${line}L${x(pts.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const ticks = []; for (let v = 0; v <= top + 1; v += step) ticks.push(v);
  const every = Math.ceil(pts.length / 6);
  const fmtX = (k) => days === 1 ? k : new Date(k + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  const total = pts.reduce((s, p) => s + p.v, 0);
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ventas por ${days === 1 ? "hora" : "día"}: total ${cop(total)}">
    ${ticks.map((v) => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(13,13,14,.07)"/><text x="${pl - 10}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#9a9aa1">${v >= 1e6 ? (v / 1e6).toLocaleString("es-CO") + " M" : v >= 1e3 ? Math.round(v / 1e3) + " mil" : v}</text>`).join("")}
    ${pts.map((p, i) => i % every === 0 || i === pts.length - 1 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="#9a9aa1">${esc(fmtX(p.k))}</text>` : "").join("")}
    <path d="${area}" fill="#a3792a" fill-opacity=".1"/>
    <path d="${line}" fill="none" stroke="#a3792a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <line class="xh" x1="0" x2="0" y1="${pt}" y2="${y(0)}" stroke="rgba(13,13,14,.25)" visibility="hidden"/>
    <circle class="dot" r="5" fill="#a3792a" stroke="#fff" stroke-width="2" visibility="hidden"/>
    <rect x="${pl}" y="0" width="${W - pl - pr}" height="${H}" fill="transparent" class="hit"/>
  </svg><div class="tip" hidden></div>`;
  const svg = $("svg", el), tip = $(".tip", el), xh = $(".xh", el), dot = $(".dot", el);
  const move = (cx) => {
    const r = svg.getBoundingClientRect(); const sx = ((cx - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(pts.length - 1, Math.round(((sx - pl) / (W - pl - pr)) * (pts.length - 1))));
    xh.setAttribute("x1", x(i)); xh.setAttribute("x2", x(i)); xh.setAttribute("visibility", "visible");
    dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(pts[i].v)); dot.setAttribute("visibility", "visible");
    tip.hidden = false; tip.innerHTML = `${esc(days === 1 ? pts[i].k : new Date(pts[i].k + "T12:00:00").toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "long" }))}<b>${cop(pts[i].v)}</b>`;
    tip.style.left = (x(i) / W) * r.width + "px"; tip.style.top = (y(pts[i].v) / H) * r.height + "px";
  };
  const hide = () => { tip.hidden = true; xh.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); };
  $(".hit", el).addEventListener("pointermove", (e) => move(e.clientX));
  $(".hit", el).addEventListener("pointerleave", hide);
}
function niceStep(v) { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }

/* ---------- PEDIDOS ---------- */
function ordersTable(list, compact = false) {
  if (!list.length) return emptyS("orders", S.status.db ? "Aún no hay pedidos. Cuando un cliente compre, aparecerá aquí." : "Conecta la base de datos para recibir pedidos aquí.");
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th>${compact ? "" : "<th>Ciudad</th><th>Pago</th>"}<th>Estado</th><th class="r">Total</th></tr></thead><tbody>
    ${list.map((o) => `<tr data-href="#/pedidos/${o.id}"><td class="num">#${o.numero}</td><td class="muted">${fDate(o.fecha, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td><td><b>${esc(o.cliente.nombre)}</b><br><small class="muted">${esc(o.cliente.telefono)}</small></td>${compact ? "" : `<td>${esc(o.cliente.ciudad)}</td><td>${badge(o.pago, PAGOS)}</td>`}<td>${badge(o.estado)}</td><td class="r num">${cop(o.total)}</td></tr>`).join("")}
  </tbody></table></div>`;
}
document.addEventListener("click", (e) => { const tr = e.target.closest("tr[data-href]"); if (tr) location.hash = tr.dataset.href; });

function vOrders() {
  const saved = sessionStorage.getItem("nt-tab"); if (saved) { S.tab = saved; sessionStorage.removeItem("nt-tab"); }
  const q = S.q.toLowerCase();
  const digits = q.replace(/\D/g, "");
  const filtered = S.orders.filter((o) => (S.tab === "todos" || o.estado === S.tab) && (!q || `#${o.numero} ${o.cliente.nombre} ${o.cliente.ciudad} ${o.cliente.email}`.toLowerCase().includes(q) || (digits.length > 3 && o.cliente.telefono.replace(/\D/g, "").includes(digits))));
  later((v) => {
    $$("[data-tab]", v).forEach((b) => b.onclick = () => { S.tab = b.dataset.tab; route(); });
    const inp = $("[data-oq]", v); inp.value = S.q; inp.oninput = () => { S.q = inp.value; clearTimeout(inp._t); inp._t = setTimeout(() => { const pos = inp.selectionStart; route(); const n = $("[data-oq]"); n.focus(); n.setSelectionRange(pos, pos); }, 250); };
    $("[data-export]", v).onclick = () => exportOrders(filtered);
    $("[data-refresh]", v).onclick = async () => { await reloadOrders(); updateNewCount(); route(); toast("Pedidos actualizados"); };
  });
  return `<div class="ph"><div><h1>Pedidos</h1><div class="sub">${S.orders.length} pedidos en total</div></div>
    <div class="actions"><button class="btn btn-line" data-refresh>Actualizar</button><button class="btn btn-line" data-export>${ic("dl")}Exportar</button></div></div>
  <div class="card">
    <div class="tabs">${[["todos", "Todos"], ...ESTADOS].map(([k, l]) => `<button data-tab="${k}" class="${S.tab === k ? "on" : ""}">${l}<span>${k === "todos" ? S.orders.length : S.orders.filter((o) => o.estado === k).length}</span></button>`).join("")}</div>
    <div class="toolbar"><div class="search">${ic("search")}<input data-oq placeholder="Buscar por número, cliente, celular o ciudad"></div></div>
    ${ordersTable(filtered)}
  </div>`;
}
function exportOrders(list) {
  const rows = [["Pedido", "Fecha", "Estado", "Pago", "Método", "Cliente", "Celular", "Correo", "Ciudad", "Departamento", "Dirección", "Productos", "Subtotal", "Descuento", "Cupón", "Envío", "Total", "Transportadora", "Guía"]];
  list.forEach((o) => rows.push([o.numero, fDate(o.fecha), lbl(ESTADOS, o.estado), lbl(PAGOS, o.pago), o.metodoPago, o.cliente.nombre, o.cliente.telefono, o.cliente.email, o.cliente.ciudad, o.cliente.departamento, o.cliente.direccion,
    o.items.map((i) => `${i.cantidad} x ${i.nombre}${i.unidades > 1 ? ` (x${i.unidades})` : ""}`).join(" | "), o.subtotal, o.descuento, o.cupon, o.envio, o.total, o.transportadora, o.guia]));
  download(`pedidos-nutrell-${dayKey(Date.now())}.csv`, rows);
}
function download(name, rows) {
  const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = name; a.click();
}
const waNum = (t) => { let d = String(t || "").replace(/\D/g, ""); if (d.length === 10 && d.startsWith("3")) d = "57" + d; return d; };

function vOrder(id) {
  const o = S.orders.find((x) => x.id === id);
  if (!o) return `<div class="ph"><a class="back" href="#/pedidos">${ic("back")}</a><h1>Pedido no encontrado</h1></div>`;
  const c = o.cliente;
  const msg = `Hola ${c.nombre.split(" ")[0]}, te escribimos de Nutrell sobre tu pedido #${o.numero} por ${cop(o.total)}.`;
  later((v) => {
    const patch = async (data, okMsg) => {
      try { const n = await api("order", { id: o.id, ...data }); Object.assign(o, n); updateNewCount(); route(); toast(okMsg); } catch (e) { toast(e.message, true); }
    };
    $("[data-estado]", v).onchange = (e) => patch({ estado: e.target.value }, "Estado actualizado");
    $("[data-pago]", v).onchange = (e) => patch({ pago: e.target.value }, "Pago actualizado");
    $("[data-ship-form]", v).onsubmit = (e) => { e.preventDefault(); const f = e.target; patch({ transportadora: f.transportadora.value, guia: f.guia.value }, "Datos de envío guardados"); };
    $("[data-note-form]", v).onsubmit = (e) => { e.preventDefault(); const f = e.target; patch({ notaInterna: f.nota.value }, "Nota guardada"); };
    $("[data-comment-form]", v).onsubmit = (e) => { e.preventDefault(); const t = e.target.comentario.value.trim(); if (t) patch({ comentario: t }, "Comentario agregado"); };
    const env = $("[data-envio-form]", v); if (env) env.onsubmit = (e) => { e.preventDefault(); patch({ envio: Number(e.target.envio.value) || 0 }, "Envío actualizado"); };
    $("[data-print]", v).onclick = () => print();
    $("[data-del]", v).onclick = async () => {
      if (!(await confirmBox(`¿Eliminar el pedido #${o.numero}?`, "Esta acción no se puede deshacer. Si solo quieres anularlo, cámbialo a Cancelado.", "Eliminar", true))) return;
      try { await api("order-delete", { id: o.id }); S.orders = S.orders.filter((x) => x !== o); updateNewCount(); location.hash = "#/pedidos"; toast("Pedido eliminado"); } catch (e) { toast(e.message, true); }
    };
  });
  return `<div class="ph"><a class="back no-print" href="#/pedidos" aria-label="Volver">${ic("back")}</a>
    <div><h1>Pedido #${o.numero} ${badge(o.estado)} ${badge(o.pago, PAGOS)}</h1><div class="sub">${fDate(o.fecha)} · Tienda online</div></div>
    <div class="actions no-print"><a class="btn btn-line" target="_blank" rel="noopener" href="https://wa.me/${waNum(c.telefono)}?text=${encodeURIComponent(msg)}">${ic("wa")}Escribir al cliente</a><button class="btn btn-line" data-print>${ic("print")}Imprimir</button></div></div>
  <div class="grid2">
    <div>
      <div class="card"><h2>Productos <small>${((n) => `${n} ${n === 1 ? "unidad" : "unidades"}`)(o.items.reduce((s, i) => s + i.cantidad * i.unidades, 0))}</small></h2>
        ${o.items.map((i) => `<div class="oi"><img src="${esc(i.imagen)}" alt=""><div><b>${esc(i.nombre)}</b><small>${esc(i.variante || "")}${i.unidades > 1 ? ` · Pack x${i.unidades}` : ""} · ${cop(i.precio)} × ${i.cantidad}</small></div><b>${cop(i.total)}</b></div>`).join("")}
        <div class="sumt">
          <div><span class="muted">Subtotal</span><span>${cop(o.subtotal)}</span></div>
          ${o.descuento ? `<div><span class="muted">Descuento ${o.cupon ? `(${esc(o.cupon)})` : ""}</span><span style="color:var(--ok)">−${cop(o.descuento)}</span></div>` : ""}
          <div><span class="muted">Envío</span><span>${o.envioPorConfirmar ? '<span class="badge b-pendiente">Por confirmar</span>' : o.envio ? cop(o.envio) : "Gratis"}</span></div>
          ${o.envioPorConfirmar ? `<form class="no-print" data-envio-form style="display:flex;gap:8px;justify-content:flex-end"><div class="f" style="margin:0;width:160px"><div class="pre"><b>$</b><input name="envio" type="number" min="0" step="500" placeholder="Valor envío"></div></div><button class="btn btn-dark btn-sm">Fijar envío</button></form>` : ""}
          <div class="t"><span>Total</span><span>${cop(o.total)}</span></div>
          <div><span class="muted">Método de pago</span><span>${esc(o.metodoPago)}</span></div>
        </div>
      </div>
      <div class="card"><h2>Historial</h2>
        <form class="no-print" data-comment-form style="display:flex;gap:8px;margin-bottom:16px"><input class="inp" name="comentario" placeholder="Agregar un comentario interno"><button class="btn btn-dark">Agregar</button></form>
        <div class="tl">${[...o.historial].reverse().map((h) => `<div class="${h.nota ? "note" : ""}"><div>${esc(h.texto)}<small>${fDate(h.fecha)}</small></div></div>`).join("")}</div>
      </div>
    </div>
    <div>
      <div class="card no-print"><h2>Gestión</h2>
        <label class="f"><span>Estado del pedido</span><select data-estado>${ESTADOS.map(([k, l]) => `<option value="${k}"${o.estado === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="f" style="margin:0"><span>Estado del pago</span><select data-pago>${PAGOS.map(([k, l]) => `<option value="${k}"${o.pago === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      </div>
      ${o.online ? `<div class="card"><h2>Pago en línea · Wompi</h2>${o.wompi ? `<div class="kv">
          <span>${badge(o.wompi.status === "APPROVED" ? "pagado" : o.wompi.status === "PENDING" ? "pendiente" : "rechazado", PAGOS)} <b style="margin-left:6px">${esc(o.wompi.metodo || "")}</b></span>
          <span class="muted">Transacción: <b style="color:var(--text)">${esc(o.wompi.id)}</b></span>
          <span class="muted">Referencia: ${esc(o.wompi.referencia)}</span>
          <span class="muted">${fDate(o.wompi.fecha)}</span></div>` : `<p class="muted" style="margin:0">El cliente aún no ha completado el pago. Puedes escribirle para ayudarle.</p>`}</div>` : ""}
      <div class="card"><h2>Cliente</h2>
        <div class="kv"><b>${esc(c.nombre)}</b><a href="https://wa.me/${waNum(c.telefono)}" target="_blank" rel="noopener">${esc(c.telefono)}</a>${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ""}<span class="muted">${S.orders.filter((x) => waNum(x.cliente.telefono) === waNum(c.telefono)).length} pedido(s)</span></div>
        <h3 style="margin-top:18px">Dirección de envío</h3>
        <div class="kv"><span>${esc(c.direccion)}</span><span>${esc(c.ciudad)}${c.departamento ? ", " + esc(c.departamento) : ""}</span></div>
        ${c.notas ? `<h3 style="margin-top:18px">Notas del cliente</h3><p style="margin:0" class="muted">${esc(c.notas)}</p>` : ""}
      </div>
      <form class="card no-print" data-ship-form><h2>Envío</h2>
        <label class="f"><span>Transportadora</span><input name="transportadora" value="${esc(o.transportadora)}" placeholder="Servientrega, Interrapidísimo…"></label>
        <label class="f"><span>Número de guía</span><input name="guia" value="${esc(o.guia)}"></label>
        <button class="btn btn-dark btn-sm">Guardar envío</button>
      </form>
      <form class="card no-print" data-note-form><h2>Nota interna</h2>
        <label class="f"><textarea name="nota" rows="3" placeholder="Solo la ve tu equipo">${esc(o.notaInterna)}</textarea></label>
        <button class="btn btn-line btn-sm">Guardar nota</button>
      </form>
      <div class="card no-print"><button class="btn btn-danger btn-sm" data-del>${ic("trash")}Eliminar pedido</button></div>
    </div>
  </div>`;
}

/* ---------- PRODUCTOS ---------- */
const stockBadge = (p) => p.stock === null || p.stock === "" || p.stock === undefined ? '<span class="muted">No controlado</span>' : Number(p.stock) <= 0 ? '<span class="badge b-agotado">Agotado</span>' : Number(p.stock) <= 10 ? `<span class="badge b-bajo">${p.stock} en stock</span>` : `${p.stock} en stock`;
function soldMap() { const m = {}; S.orders.filter(valid).forEach((o) => o.items.forEach((i) => { m[i.id] = (m[i.id] || 0) + i.unidades * i.cantidad; })); return m; }
function vProducts() {
  const sold = soldMap();
  const P = S.cat.productos;
  later((v) => {
    $("[data-new]", v).onclick = () => { location.hash = "#/productos/nuevo"; };
    $$("[data-pmv]", v).forEach((b) => b.onclick = (e) => { e.stopPropagation(); const i = Number(b.dataset.i), j = i + Number(b.dataset.pmv); if (j < 0 || j >= P.length) return; [P[i], P[j]] = [P[j], P[i]]; markDirty(); route(); });
  });
  return `<div class="ph"><div><h1>Productos</h1><div class="sub">${P.length} productos · el orden aquí es el orden en la tienda</div></div>
    <div class="actions"><button class="btn btn-gold" data-new>${ic("plus")}Agregar producto</button></div></div>
  <div class="card"><div class="tbl-wrap" style="margin-top:-20px"><table class="tbl"><thead><tr><th>Producto</th><th>Estado</th><th>Inventario</th><th>Categoría</th><th class="r">Precio</th><th class="r">Vendidos</th><th></th></tr></thead><tbody>
    ${P.map((p, i) => `<tr data-href="#/productos/${p.slug}"><td><div class="pn"><img class="pimg" src="${esc(p.imagenes.mini || p.imagenes.principal)}" alt="">${esc(p.nombre)}<small>${esc([p.tamano, p.sabor].filter(Boolean).join(" · "))}</small></div></td>
      <td>${p.activo !== false ? '<span class="badge b-activo">Activo</span>' : '<span class="badge b-borrador">Borrador</span>'}</td><td>${stockBadge(p)}</td>
      <td>${esc((S.cat.categorias.find((c) => c.id === p.categoria) || {}).nombre || "—")}</td><td class="r num">${cop(p.precio)}${p.antes > p.precio ? `<br><small class="muted" style="text-decoration:line-through;font-weight:500">${cop(p.antes)}</small>` : ""}</td>
      <td class="r">${sold[p.slug] || 0}</td><td class="r" style="white-space:nowrap"><button class="icon-b" data-pmv="-1" data-i="${i}" aria-label="Subir">${ic("up")}</button><button class="icon-b" data-pmv="1" data-i="${i}" aria-label="Bajar">${ic("down")}</button></td></tr>`).join("")}
  </tbody></table></div></div>`;
}

function newProduct() {
  const base = { slug: "", activo: false, stock: null, nombre: "", h1: ["", ""], categoria: S.cat.categorias[0]?.id || "", etiqueta: "Nuevo", tamano: "", sabor: "", formato: "Polvo", precio: 0, antes: 0,
    packs: [{ unidades: 1, descuento: 0, texto: "Para empezar tu ritual" }, { unidades: 2, descuento: 10, texto: "Ahorra 10%" }, { unidades: 3, descuento: 15, texto: "Envío gratis" }],
    tema: { acento: "#c9a24b", suave: "#efe4cc", oscuro: "#1a1712" }, imagenes: { principal: "", mini: "", foto: "", d1: "", d2: "", og: "" },
    resumen: "", subtitulo: "", seoTitulo: "", seoDescripcion: "", descripcion: [], destacados: [], cifra: ["", ""], ingredientes: [], libreDe: [], pasos: [], advertencias: "Suplemento dietario. Consulta a tu médico si estás en embarazo, lactancia o tienes alguna condición de salud.", faq: [] };
  return base;
}
let draft = null;
function vProduct(slug) {
  let p;
  if (slug === "nuevo") { if (!draft) draft = newProduct(); p = draft; }
  else { draft = null; p = S.cat.productos.find((x) => x.slug === slug); }
  if (!p) return `<div class="ph"><a class="back" href="#/productos">${ic("back")}</a><h1>Producto no encontrado</h1></div>`;
  const isNew = slug === "nuevo";
  const sold = soldMap()[p.slug] || 0;
  const rerender = () => { const y = scrollY; route(); scrollTo(0, y); };
  later((v) => {
    bindInputs(v, () => p, (path, val, el) => {
      if (path === "nombre" && isNew && !p._slugTouched) { p.slug = slugify(val); const s = $("[data-b=slug]", v); if (s) s.value = p.slug; }
      if (path === "slug") { p._slugTouched = true; }
      if (path.startsWith("tema")) { const tp = $(".theme-prev", v); tp.style.background = `radial-gradient(120% 100% at 50% 100%, ${p.tema.suave}, #f6f3ec 75%)`; $$(".slot", v).forEach((s) => s.style.setProperty("--soft", p.tema.suave)); }
      if (path.startsWith("seo") || path === "slug" || path === "nombre") serp();
      if (path === "stockOn") {}
    });
    counters(v);
    const stockOn = $("[data-stock-on]", v), stockIn = $("[data-b=stock]", v);
    stockOn.checked = p.stock !== null && p.stock !== undefined && p.stock !== "";
    stockIn.closest(".f").hidden = !stockOn.checked;
    stockOn.onchange = () => { p.stock = stockOn.checked ? (Number(stockIn.value) || 0) : null; stockIn.value = p.stock ?? ""; stockIn.closest(".f").hidden = !stockOn.checked; markDirty(); };
    const serp = () => { $(".serp .u", v).textContent = `${S.cat.sitio.url.replace(/^https?:\/\//, "")} › ${p.slug}`; $(".serp .t", v).textContent = p.seoTitulo || p.nombre || "Título del producto"; $(".serp .d", v).textContent = p.seoDescripcion || p.resumen || "Descripción para Google"; };
    serp();
    wireRepeaters(v, (k) => p[k], rerender);
    wireImages(v, p);
    chipsInput($("[data-chips=libreDe]", v), p, "libreDe");
    const cr = $("[data-create]", v);
    if (cr) cr.onclick = () => {
      if (!p.nombre.trim()) return toast("Escribe el nombre del producto", true);
      p.slug = slugify(p.slug || p.nombre);
      if (!p.slug) return toast("La URL no es válida", true);
      if (S.cat.productos.some((x) => x.slug === p.slug)) return toast("Ya existe un producto con esa URL", true);
      if (!p.h1[0]) p.h1 = [p.nombre, ""];
      delete p._slugTouched;
      S.cat.productos.push(p); draft = null; markDirty(); location.hash = "#/productos/" + p.slug; toast("Producto creado. Recuerda Guardar para publicarlo.");
    };
    const dup = $("[data-dup]", v);
    if (dup) dup.onclick = () => { const c = clone(p); c.nombre += " (copia)"; let s = p.slug + "-copia", n = 2; while (S.cat.productos.some((x) => x.slug === s)) s = `${p.slug}-copia-${n++}`; c.slug = s; c.activo = false; S.cat.productos.push(c); markDirty(); location.hash = "#/productos/" + s; toast("Producto duplicado como borrador"); };
    const del = $("[data-delp]", v);
    if (del) del.onclick = async () => { if (!(await confirmBox(`¿Eliminar ${p.nombre}?`, "Se quitará de la tienda al guardar. Los pedidos anteriores no se modifican.", "Eliminar", true))) return; S.cat.productos = S.cat.productos.filter((x) => x !== p); markDirty(); location.hash = "#/productos"; toast("Producto eliminado. Guarda para aplicar."); };
  });
  const cats = S.cat.categorias.map((c) => [c.id, c.nombre]);
  return `<div class="ph"><a class="back" href="#/productos" aria-label="Volver">${ic("back")}</a>
    <div><h1>${esc(p.nombre || "Nuevo producto")}</h1><div class="sub">${isNew ? "Completa la información y crea el producto" : `${p.activo !== false ? "Activo en la tienda" : "Borrador (oculto)"} · ${sold} unidades vendidas`}</div></div>
    <div class="actions">${isNew ? `<button class="btn btn-gold" data-create>${ic("plus")}Crear producto</button>` : `<a class="btn btn-line" href="/${esc(p.slug)}" target="_blank" rel="noopener">${ic("ext")}Ver en tienda</a><button class="btn btn-line" data-dup>${ic("copy")}Duplicar</button>`}</div></div>
  <div class="grid2">
    <div>
      <div class="card"><h2>Información principal</h2>
        ${fld("Nombre del producto", "nombre", { ph: "Ej. Colágeno Marino con Péptidos" })}
        <div class="row2">${fld("Título grande (parte 1)", "h1.0", { ph: "Colágeno Marino" })}${fld("Título grande (parte dorada)", "h1.1", { ph: "con Péptidos" })}</div>
        ${fld("Subtítulo", "subtitulo", { ph: "Mezcla en polvo para bebida instantánea · 1000 g" })}
        ${fld("Resumen corto (tarjetas)", "resumen", { max: 90, ph: "Una línea que venda el producto" })}
        ${fld("Descripción", "descripcion", { rows: 7, t: "paras", help: "Separa los párrafos con una línea en blanco. Usa **texto** para negrita." })}
      </div>
      <div class="card"><h2>Imágenes</h2><p class="hint">La principal se ve mejor con fondo transparente (PNG). Se optimizan automáticamente.</p>
        <div class="imgs-grid">${[["principal", "Principal"], ["foto", "Foto"], ["d1", "Detalle 1"], ["d2", "Detalle 2"]].map(([k, l]) => slot(p, k, l)).join("")}</div>
        <input type="file" accept="image/*" hidden data-file>
      </div>
      <div class="card"><h2>Precio</h2>
        <div class="row2">${money("Precio de venta", "precio")}${money("Precio antes (tachado)", "antes", "Déjalo en 0 si no hay descuento")}</div>
        <h3 style="margin-top:6px">Packs y descuentos por volumen</h3>
        ${repeater("packs", p.packs, (i) => `<div class="row3">${fld("Unidades", `packs.${i}.unidades`, { type: "number", t: "num", attrs: 'min="1"' })}${fld("Descuento %", `packs.${i}.descuento`, { type: "number", t: "num", attrs: 'min="0" max="90"' })}${fld("Texto", `packs.${i}.texto`)}</div>`, { title: (i, it) => `Pack ${i + 1}${it.unidades ? ` · ${it.unidades} und.` : ""}`, addLabel: "Agregar pack", blank: { unidades: 6, descuento: 10, texto: "" } })}
      </div>
      <div class="card"><h2>Inventario</h2>
        <label class="sw" style="margin-bottom:14px"><input type="checkbox" data-stock-on><i></i>Controlar inventario</label>
        ${fld("Unidades disponibles", "stock", { type: "number", t: "numnull", attrs: 'min="0"', help: "Se descuenta automáticamente con cada pedido. En 0 se muestra como Agotado." })}
      </div>
      <div class="card"><h2>Ficha del producto</h2>
        <div class="row3">${fld("Tamaño", "tamano", { ph: "1000 g" })}${fld("Sabor", "sabor", { ph: "Uva" })}${fld("Formato", "formato", { opts: [["Polvo", "Polvo (tarro)"], ["Líquido", "Líquido (frasco)"], ["Sobre", "Sobre"], ["Cápsulas", "Cápsulas"]] })}</div>
        <div class="row2">${fld("Cifra destacada", "cifra.0", { ph: "20.000 mg" })}${fld("Texto de la cifra", "cifra.1", { ph: "de colágeno por porción" })}</div>
        ${fld("Beneficios destacados (uno por línea)", "destacados", { rows: 4, t: "lines" })}
        <label class="f"><span>Libre de</span><div class="chips-in" data-chips="libreDe"></div><span class="help">Escribe y presiona Enter. Ej.: Soya, Gluten</span></label>
      </div>
      <div class="card"><h2>Ingredientes</h2>
        ${repeater("ingredientes", p.ingredientes, (i) => `<div class="row2">${fld("Nombre", `ingredientes.${i}.nombre`)}${fld("Etiqueta", `ingredientes.${i}.tag`, { ph: "Vitamina, Botánico…" })}</div>${fld("Descripción", `ingredientes.${i}.texto`)}`, { title: (i, it) => it.nombre || `Ingrediente ${i + 1}`, addLabel: "Agregar ingrediente", blank: { nombre: "", tag: "", texto: "" } })}
      </div>
      <div class="card"><h2>Modo de uso</h2>
        ${repeater("pasos", p.pasos, (i) => `${fld("Título", `pasos.${i}.titulo`)}${fld("Texto", `pasos.${i}.texto`)}`, { title: (i) => `Paso ${i + 1}`, addLabel: "Agregar paso", blank: { titulo: "", texto: "" } })}
        <div style="margin-top:14px">${fld("Advertencias", "advertencias", { rows: 3 })}</div>
      </div>
      <div class="card"><h2>Preguntas frecuentes</h2>
        ${repeater("faq", p.faq, (i) => `${fld("Pregunta", `faq.${i}.pregunta`)}${fld("Respuesta", `faq.${i}.respuesta`, { rows: 2 })}`, { title: (i) => `Pregunta ${i + 1}`, addLabel: "Agregar pregunta", blank: { pregunta: "", respuesta: "" } })}
      </div>
      <div class="card"><h2>SEO · Vista previa en Google</h2>
        <div class="serp"><div class="u"></div><div class="t"></div><div class="d"></div></div>
        ${fld("Título para Google", "seoTitulo", { max: 65 })}
        ${fld("Descripción para Google", "seoDescripcion", { rows: 3, max: 160 })}
      </div>
    </div>
    <div>
      <div class="card"><h2>Estado</h2>${sw("Visible en la tienda", "activo")}</div>
      <div class="card"><h2>Organización</h2>
        ${fld("Categoría", "categoria", { opts: cats })}
        ${fld("Etiqueta en la foto", "etiqueta", { ph: "Más vendido, Nuevo…" })}
        ${fld("URL del producto", "slug", { help: `${esc(S.cat.sitio.url.replace(/^https?:\/\//, ""))}/<b>${esc(p.slug || "url")}</b>`, attrs: isNew ? "" : "readonly title='La URL no se cambia para no perder posicionamiento en Google'" })}
      </div>
      <div class="card"><h2>Colores de la página</h2>
        <div class="colors"><label class="color">Acento<input type="color" data-b="tema.acento"></label><label class="color">Fondo suave<input type="color" data-b="tema.suave"></label><label class="color">Oscuro<input type="color" data-b="tema.oscuro"></label></div>
        <div class="theme-prev" style="background:radial-gradient(120% 100% at 50% 100%, ${esc(p.tema.suave)}, #f6f3ec 75%)">${p.imagenes.mini || p.imagenes.principal ? `<img src="${esc(p.imagenes.mini || p.imagenes.principal)}" alt="">` : ""}</div>
      </div>
      ${isNew ? "" : `<div class="card"><button class="btn btn-danger btn-sm" data-delp>${ic("trash")}Eliminar producto</button></div>`}
    </div>
  </div>`;
}
function slot(p, k, l) {
  const src = p.imagenes[k];
  return `<div class="slot${k === "foto" ? " photo" : ""}" data-slot="${k}" style="--soft:${esc(p.tema.suave)}" role="button" tabindex="0" aria-label="Cambiar imagen ${l}">
    ${src ? `<img src="${esc(src)}" alt=""><button type="button" class="x" data-clear="${k}" aria-label="Quitar">${ic("x")}</button>` : `<div class="ph-in">${ic("img")}Subir imagen</div>`}
    <span class="lbl">${l}</span></div>`;
}
function wireImages(v, p) {
  const file = $("[data-file]", v); let target = null;
  v.addEventListener("click", (e) => {
    const clr = e.target.closest("[data-clear]");
    if (clr) { e.stopPropagation(); p.imagenes[clr.dataset.clear] = ""; if (clr.dataset.clear === "principal") { p.imagenes.mini = ""; p.imagenes.og = ""; } markDirty(); route(); return; }
    const s = e.target.closest("[data-slot]"); if (s) { target = s; file.value = ""; file.click(); }
  });
  v.addEventListener("keydown", (e) => { const s = e.target.closest("[data-slot]"); if (s && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); target = s; file.click(); } });
  file.onchange = async () => {
    const f = file.files[0]; if (!f || !target) return;
    const k = target.dataset.slot; target.classList.add("busy");
    try {
      const big = await resize(f, k === "foto" ? 1200 : 1100);
      const up = await api("upload", { dataUrl: big });
      p.imagenes[k] = up.url;
      if (k === "principal") { const sm = await resize(f, 520); p.imagenes.mini = (await api("upload", { dataUrl: sm })).url; p.imagenes.og = up.url; }
      markDirty(); route(); toast("Imagen subida. Guarda para publicarla.");
    } catch (e) { toast(e.message, true); target.classList.remove("busy"); }
  };
}
function resize(file, max) {
  return new Promise((res, rej) => {
    const img = new Image(); img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      let q = 0.86, out = c.toDataURL("image/webp", q);
      if (!out.startsWith("data:image/webp")) out = c.toDataURL("image/png");
      while (out.length > 1.3e6 && q > 0.5) { q -= 0.1; out = c.toDataURL("image/webp", q); }
      URL.revokeObjectURL(img.src); res(out);
    };
    img.onerror = () => rej(new Error("No se pudo leer la imagen")); img.src = URL.createObjectURL(file);
  });
}
function chipsInput(el, obj, key) {
  if (!el) return;
  const draw = () => {
    el.innerHTML = (obj[key] || []).map((t, i) => `<span>${esc(t)}<button type="button" data-ci="${i}" aria-label="Quitar">×</button></span>`).join("") + `<input placeholder="Agregar…">`;
    const inp = $("input", el);
    inp.onkeydown = (e) => { if ((e.key === "Enter" || e.key === ",") && inp.value.trim()) { e.preventDefault(); (obj[key] ||= []).push(inp.value.trim()); markDirty(); draw(); $("input", el).focus(); } if (e.key === "Backspace" && !inp.value && obj[key]?.length) { obj[key].pop(); markDirty(); draw(); $("input", el).focus(); } };
  };
  el.onclick = (e) => { const b = e.target.closest("[data-ci]"); if (b) { obj[key].splice(Number(b.dataset.ci), 1); markDirty(); draw(); } };
  draw();
}

/* ---------- CLIENTES ---------- */
function vCustomers() {
  const map = {};
  S.orders.forEach((o) => {
    const k = waNum(o.cliente.telefono) || o.cliente.nombre;
    map[k] ??= { nombre: o.cliente.nombre, tel: o.cliente.telefono, email: o.cliente.email, ciudad: o.cliente.ciudad, pedidos: 0, total: 0, ultimo: o.fecha };
    const c = map[k]; c.pedidos++; if (valid(o)) c.total += o.total; if (o.fecha > c.ultimo) c.ultimo = o.fecha;
  });
  const list = Object.values(map).sort((a, b) => b.total - a.total);
  const q = (S.cq || "").toLowerCase();
  const fl = list.filter((c) => !q || `${c.nombre} ${c.tel} ${c.ciudad} ${c.email}`.toLowerCase().includes(q));
  later((v) => {
    const inp = $("[data-cq]", v); inp.value = S.cq || ""; inp.oninput = () => { S.cq = inp.value; clearTimeout(inp._t); inp._t = setTimeout(() => { const pos = inp.selectionStart; route(); const n = $("[data-cq]"); n.focus(); n.setSelectionRange(pos, pos); }, 250); };
    $("[data-cexp]", v).onclick = () => download(`clientes-nutrell-${dayKey(Date.now())}.csv`, [["Nombre", "Celular", "Correo", "Ciudad", "Pedidos", "Total comprado", "Último pedido"], ...fl.map((c) => [c.nombre, c.tel, c.email, c.ciudad, c.pedidos, c.total, fDate(c.ultimo)])]);
    $$("[data-cust]", v).forEach((tr) => tr.onclick = () => { S.q = tr.dataset.cust; S.tab = "todos"; location.hash = "#/pedidos"; });
  });
  const recurrent = list.filter((c) => c.pedidos > 1).length;
  return `<div class="ph"><div><h1>Clientes</h1><div class="sub">${list.length} clientes · ${recurrent} recurrentes</div></div><div class="actions"><button class="btn btn-line" data-cexp>${ic("dl")}Exportar</button></div></div>
  <div class="card"><div class="toolbar" style="padding-top:0"><div class="search">${ic("search")}<input data-cq placeholder="Buscar cliente"></div></div>
  ${fl.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cliente</th><th>Ciudad</th><th>Pedidos</th><th>Último pedido</th><th class="r">Total comprado</th></tr></thead><tbody>
    ${fl.map((c) => `<tr data-cust="${esc(c.tel)}"><td><div class="pn"><span class="avatar" style="width:38px;height:38px">${esc(c.nombre.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase())}</span><div>${esc(c.nombre)}<small>${esc(c.tel)}${c.email ? " · " + esc(c.email) : ""}</small></div></div></td><td>${esc(c.ciudad)}</td><td>${c.pedidos}${c.pedidos > 1 ? ' <span class="badge b-activo">Recurrente</span>' : ""}</td><td class="muted">${fDate(c.ultimo, { day: "numeric", month: "short", year: "numeric" })}</td><td class="r num">${cop(c.total)}</td></tr>`).join("")}
  </tbody></table></div>` : emptyS("users", "Tus clientes aparecerán aquí con su historial de compras.")}</div>`;
}

/* ---------- DESCUENTOS ---------- */
function vDiscounts() {
  const used = {}; S.orders.filter(valid).forEach((o) => { if (o.cupon) { used[o.cupon] ??= { n: 0, v: 0 }; used[o.cupon].n++; used[o.cupon].v += o.descuento; } });
  later((v) => { bindInputs(v, () => S.cat); wireRepeaters(v, (k) => S.cat[k], route); });
  return `<div class="ph"><div><h1>Descuentos</h1><div class="sub">Códigos que tus clientes aplican al finalizar la compra</div></div></div>
  <div class="card">${repeater("cupones", S.cat.cupones, (i) => `<div class="row3">${fld("Código", `cupones.${i}.codigo`, { attrs: 'style="text-transform:uppercase"' })}${fld("Descuento %", `cupones.${i}.porcentaje`, { type: "number", t: "num", attrs: 'min="1" max="90"' })}${money("Compra mínima", `cupones.${i}.minimo`)}</div>${sw("Activo", `cupones.${i}.activo`)}`,
    { title: (i, c) => `${c.codigo || "Nuevo código"}${used[String(c.codigo).toUpperCase()] ? ` · usado ${used[String(c.codigo).toUpperCase()].n} veces (${cop(used[String(c.codigo).toUpperCase()].v)})` : ""}`, addLabel: "Crear código de descuento", blank: { codigo: "", porcentaje: 10, minimo: 0, activo: true } })}</div>`;
}

/* ---------- TIENDA ONLINE (contenido) ---------- */
function vContent() {
  const c = S.cat.contenido;
  const prods = S.cat.productos.map((p) => [p.slug, p.nombre]);
  later((v) => {
    bindInputs(v, () => S.cat); counters(v);
    wireRepeaters(v, (k) => getPath(S.cat, k), () => { const y = scrollY; route(); scrollTo(0, y); });
    const serp = () => { $(".serp .t", v).textContent = c.seo.titulo; $(".serp .d", v).textContent = c.seo.descripcion; };
    serp(); $$("[data-b^='contenido.seo']", v).forEach((i) => i.addEventListener("input", serp));
  });
  return `<div class="ph"><div><h1>Tienda online</h1><div class="sub">Edita los textos e imágenes de la página de inicio</div></div><div class="actions"><a class="btn btn-line" href="/" target="_blank" rel="noopener">${ic("ext")}Ver tienda</a></div></div>
  <div class="grid2"><div>
    <div class="card"><h2>Barra de anuncios</h2><p class="hint">Hasta 3 mensajes que rotan arriba de la tienda. Usa **texto** para resaltar en dorado.</p>
      ${[0, 1, 2].map((i) => fld(`Mensaje ${i + 1}`, `contenido.anuncios.${i}`)).join("")}</div>
    <div class="card"><h2>Portada</h2>
      ${fld("Texto pequeño superior", "contenido.hero.etiqueta")}
      <div class="row2">${fld("Título", "contenido.hero.titulo")}${fld("Título (parte dorada)", "contenido.hero.destacado")}</div>
      ${fld("Texto", "contenido.hero.texto", { rows: 3 })}
      <div class="row2">${fld("Botón principal", "contenido.hero.boton1")}${fld("Botón secundario", "contenido.hero.boton2")}</div>
      <h3>Cifras</h3>${[0, 1, 2].map((i) => `<div class="row2">${fld(`Cifra ${i + 1}`, `contenido.hero.cifras.${i}.valor`)}${fld("Texto", `contenido.hero.cifras.${i}.texto`)}</div>`).join("")}
      ${fld("Sello dorado (deja vacío para ocultar)", "contenido.hero.sello", { ph: "-15%" })}
    </div>
    <div class="card"><h2>Colección</h2><div class="row2">${fld("Título", "contenido.coleccion.titulo")}${fld("Título (parte dorada)", "contenido.coleccion.destacado")}</div>${fld("Texto", "contenido.coleccion.texto", { rows: 2 })}
      ${fld("Producto estrella", "contenido.destacado", { opts: prods })}</div>
    <div class="card"><h2>La promesa Nutrell</h2>${[0, 1, 2, 3].map((i) => `<div class="row2">${fld(`Título ${i + 1}`, `contenido.promesa.${i}.titulo`)}${fld("Texto", `contenido.promesa.${i}.texto`)}</div>`).join("")}</div>
    <div class="card"><h2>Reseñas de clientes</h2><p class="hint">Publica solo reseñas reales de tus clientes. Las que vienen de ejemplo están ocultas.</p>
      ${repeater("contenido.resenas", c.resenas, (i) => `<div class="row2">${fld("Nombre", `contenido.resenas.${i}.nombre`)}${fld("Estrellas", `contenido.resenas.${i}.estrellas`, { opts: [[5, "★★★★★"], [4, "★★★★"], [3, "★★★"]], t: "num" })}</div>${fld("Reseña", `contenido.resenas.${i}.texto`, { rows: 2 })}${sw("Visible en la tienda", `contenido.resenas.${i}.visible`)}`, { title: (i, r) => r.nombre || `Reseña ${i + 1}`, addLabel: "Agregar reseña", blank: { nombre: "", texto: "", estrellas: 5, visible: true } })}</div>
    <div class="card"><h2>Preguntas frecuentes</h2>
      ${repeater("contenido.faq", c.faq, (i) => `${fld("Pregunta", `contenido.faq.${i}.pregunta`)}${fld("Respuesta", `contenido.faq.${i}.respuesta`, { rows: 2 })}`, { title: (i) => `Pregunta ${i + 1}`, addLabel: "Agregar pregunta", blank: { pregunta: "", respuesta: "" } })}</div>
  </div><div>
    <div class="card"><h2>Club y newsletter</h2>${fld("Título", "contenido.club.titulo")}${fld("Texto", "contenido.club.texto", { rows: 3 })}${fld("Código que se muestra", "contenido.club.codigo", { help: "Créalo también en Descuentos para que funcione." })}</div>
    <div class="card"><h2>SEO de la página de inicio</h2><div class="serp"><div class="u">${esc(S.cat.sitio.url.replace(/^https?:\/\//, ""))}</div><div class="t"></div><div class="d"></div></div>
      ${fld("Título", "contenido.seo.titulo", { max: 65 })}${fld("Descripción", "contenido.seo.descripcion", { rows: 4, max: 160 })}</div>
    <div class="card"><h2>Aviso legal</h2>${fld("Texto del pie de página", "contenido.aviso", { rows: 5 })}</div>
  </div></div>`;
}

/* ---------- COLECCIONES Y RITUALES ---------- */
function vCollections() {
  const prods = S.cat.productos;
  later((v) => {
    bindInputs(v, () => S.cat);
    wireRepeaters(v, (k) => S.cat[k], () => { const y = scrollY; route(); scrollTo(0, y); });
    $$("[data-rit]", v).forEach((cb) => cb.onchange = () => { const r = S.cat.rituales[Number(cb.dataset.rit)]; r.productos = $$(`[data-rit="${cb.dataset.rit}"]:checked`, v).map((x) => x.value); markDirty(); });
  });
  return `<div class="ph"><div><h1>Colecciones y rituales</h1><div class="sub">Categorías por objetivo y combos de productos</div></div></div>
  <div class="cols cols-2">
    <div class="card"><h2>Categorías (objetivos)</h2><p class="hint">Agrupan los productos en "Compra por objetivo" y en los filtros.</p>
      ${repeater("categorias", S.cat.categorias, (i) => `<div class="row2">${fld("Nombre", `categorias.${i}.nombre`)}${fld("Código", `categorias.${i}.id`, { help: "Sin espacios. Ej.: belleza" })}</div>${fld("Frase", `categorias.${i}.frase`)}<span class="help muted">${prods.filter((p) => p.categoria === S.cat.categorias[i].id).length} productos</span>`, { title: (i, c) => c.nombre || "Categoría", addLabel: "Agregar categoría", blank: { id: "nueva", nombre: "Nueva categoría", frase: "" } })}</div>
    <div class="card"><h2>Rituales (combos)</h2><p class="hint">Se agregan completos al carrito con un clic.</p>
      ${repeater("rituales", S.cat.rituales, (i) => `${fld("Nombre", `rituales.${i}.nombre`)}${fld("Frase", `rituales.${i}.frase`)}<div class="checks">${prods.map((p) => `<label><input type="checkbox" value="${esc(p.slug)}" data-rit="${i}"${S.cat.rituales[i].productos.includes(p.slug) ? " checked" : ""}>${esc(p.nombre)}</label>`).join("")}</div>`, { title: (i, r) => r.nombre || "Ritual", addLabel: "Agregar ritual", blank: { nombre: "Nuevo ritual", frase: "", productos: [] } })}</div>
  </div>`;
}

/* ---------- AJUSTES ---------- */
function vSettings() {
  later((v) => {
    bindInputs(v, () => S.cat);
    chipsInput($("[data-chips=pagos]", v), S.cat, "metodosPago");
    $("[data-backup]", v).onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(S.cat, null, 2)], { type: "application/json" })); a.download = `respaldo-nutrell-${dayKey(Date.now())}.json`; a.click(); };
    $("[data-restore]", v).onclick = () => $("[data-restore-file]", v).click();
    $("[data-restore-file]", v).onchange = async (e) => { try { const d = JSON.parse(await e.target.files[0].text()); if (!Array.isArray(d.productos)) throw 0; S.cat = d; markDirty(); route(); toast("Respaldo cargado. Revisa y guarda para publicarlo."); } catch { toast("El archivo no es un respaldo válido", true); } };
    $("[data-reset]", v).onclick = async () => { if (!(await confirmBox("¿Restaurar el catálogo inicial?", "Se reemplazarán productos, textos y precios por los originales. Los pedidos no se borran.", "Restaurar", true))) return; try { S.cat = await api("reset", {}); S.saved = JSON.stringify(S.cat); markDirty(); route(); toast("Catálogo restaurado"); } catch (x) { toast(x.message, true); } };
    const wf = $("[data-wompi]", v);
    const hook = location.origin + "/webhooks/wompi";
    $("[data-w-url]", v).value = hook;
    $("[data-w-copy]", v).onclick = () => { navigator.clipboard?.writeText(hook); toast("URL copiada"); };
    const paintW = (w) => {
      wf.publicKey.value = w.publicKey || ""; wf.activo.checked = w.activo !== false;
      $("[data-w-int]", v).textContent = w.hasIntegrity ? "Guardado: " + w.integrity : "Sin configurar";
      $("[data-w-ev]", v).textContent = w.hasEvents ? "Guardado: " + w.events : "Sin configurar";
      $("[data-w-state]", v).innerHTML = w.enabled ? (w.test ? '<span class="badge b-pendiente">Modo pruebas</span>' : '<span class="badge b-activo">Activo · producción</span>') : '<span class="badge b-borrador">Inactivo</span>';
      if (w.fromEnv) $(".hint", wf).innerHTML += "<br><b>Las llaves vienen de las variables de entorno de Vercel y tienen prioridad.</b>";
    };
    api("wompi").then(paintW).catch(() => {});
    wf.onsubmit = async (e) => {
      e.preventDefault();
      try { const w = await api("wompi-save", { publicKey: wf.publicKey.value, integrity: wf.integrity.value, events: wf.events.value, activo: wf.activo.checked }); wf.integrity.value = ""; wf.events.value = ""; paintW(w); toast(w.enabled ? "Wompi conectado" : "Llaves guardadas. Falta el secreto de integridad para activar los pagos."); }
      catch (x) { toast(x.message, true); }
    };
    $("[data-pw]", v).onsubmit = async (e) => { e.preventDefault(); const f = e.target; if (f.nueva.value !== f.repetir.value) return toast("Las claves nuevas no coinciden", true); try { await api("password", { actual: f.actual.value, nueva: f.nueva.value }); f.reset(); S.status.defaultPassword = false; toast("Clave actualizada"); route(); } catch (x) { toast(x.message, true); } };
  });
  return `<div class="ph"><div><h1>Configuración</h1><div class="sub">Datos de la tienda, envíos, pagos y seguridad</div></div></div>
  <div class="grid2"><div>
    <div class="card"><h2>Datos de la tienda</h2>
      <div class="row2">${fld("Nombre", "sitio.nombre")}${fld("Dirección web", "sitio.url", { help: "Se usa para Google y redes sociales." })}</div>
      <div class="row2">${fld("WhatsApp de ventas", "sitio.whatsapp", { help: "Con indicativo, sin + ni espacios. Ej.: 573001234567" })}${fld("Correo de contacto", "sitio.email", { type: "email" })}</div>
      <div class="row3">${fld("Instagram (URL)", "sitio.instagram")}${fld("Facebook (URL)", "sitio.facebook")}${fld("TikTok (URL)", "sitio.tiktok")}</div>
    </div>
    <div class="card"><h2>Envíos</h2><div class="row2">${money("Envío gratis desde", "sitio.envioGratisDesde")}${money("Costo de envío", "sitio.costoEnvio", "En 0 se muestra “A confirmar” y lo fijas en cada pedido.")}</div></div>
    <div class="card"><h2>Pagos</h2><label class="f"><span>Métodos de pago aceptados</span><div class="chips-in" data-chips="pagos"></div><span class="help">El primero es el seleccionado por defecto.</span></label></div>
    <form class="card" data-wompi><h2>Pagos en línea · Wompi <small data-w-state></small></h2>
      <p class="hint">Recibe pagos con tarjeta, PSE, Nequi y Bancolombia. Copia las llaves desde tu panel de Wompi → <b>Desarrolladores</b>. No compartas los secretos con nadie.</p>
      <label class="sw" style="margin-bottom:14px"><input type="checkbox" name="activo"><i></i>Mostrar “Paga en línea” en la tienda</label>
      <label class="f"><span>Llave pública</span><input name="publicKey" placeholder="pub_test_… o pub_prod_…" autocomplete="off" spellcheck="false"></label>
      <label class="f"><span>Secreto de integridad <em data-w-int></em></span><input name="integrity" type="password" placeholder="test_integrity_… o prod_integrity_…" autocomplete="new-password" spellcheck="false"><span class="help">Déjalo vacío para conservar el actual.</span></label>
      <label class="f"><span>Secreto de eventos <em data-w-ev></em></span><input name="events" type="password" placeholder="test_events_… o prod_events_…" autocomplete="new-password" spellcheck="false"><span class="help">Déjalo vacío para conservar el actual.</span></label>
      <label class="f"><span>URL de eventos (pégala en Wompi → Desarrolladores → URL de eventos)</span><div style="display:flex;gap:8px"><input class="inp" readonly data-w-url><button type="button" class="btn btn-line btn-sm" data-w-copy style="height:40px">${ic("copy")}Copiar</button></div></label>
      <button class="btn btn-dark btn-sm">Guardar llaves de Wompi</button>
    </form>
    <div class="card"><h2>Oferta de lanzamiento</h2>${fld("Termina el", "sitio.finOferta", { type: "datetime-local", t: "dt", help: "Controla la cuenta regresiva de las páginas de producto. Vacío o fecha pasada la oculta." })}</div>
  </div><div>
    <form class="card" data-pw><h2>${ic("lock")}Seguridad</h2>${S.status.defaultPassword ? '<p class="hint" style="color:var(--bad)">Estás usando la clave inicial. Cámbiala.</p>' : ""}
      <label class="f"><span>Clave actual</span><input type="password" name="actual" required autocomplete="current-password"></label>
      <label class="f"><span>Nueva clave</span><input type="password" name="nueva" required minlength="8" autocomplete="new-password"><span class="help">Mínimo 8 caracteres.</span></label>
      <label class="f"><span>Repetir nueva clave</span><input type="password" name="repetir" required minlength="8" autocomplete="new-password"></label>
      <button class="btn btn-dark btn-sm">Cambiar clave</button>
    </form>
    <div class="card"><h2>Base de datos</h2><p style="margin:0">${S.status.db ? '<span class="badge b-activo">Conectada</span>' : '<span class="badge b-pendiente">Sin conectar</span>'}</p>
      ${S.cat.actualizado ? `<p class="muted" style="margin:10px 0 0">Última publicación: ${fDate(S.cat.actualizado)}</p>` : ""}</div>
    <div class="card"><h2>Respaldo</h2><p class="hint">Descarga una copia de todo el catálogo o restáurala.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-line btn-sm" data-backup>${ic("dl")}Descargar respaldo</button><button class="btn btn-line btn-sm" data-restore>Cargar respaldo</button><input type="file" accept="application/json" hidden data-restore-file></div>
      <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
      <button class="btn btn-danger btn-sm" data-reset>Restaurar catálogo inicial</button></div>
  </div></div>`;
}

/* ---------- Búsqueda global ---------- */
function initSearch() {
  const inp = $("[data-gsearch]"), box = $(".search-res");
  const run = () => {
    const q = inp.value.trim().toLowerCase(); if (q.length < 2) { box.classList.add("hidden"); return; }
    const ps = S.cat.productos.filter((p) => p.nombre.toLowerCase().includes(q)).slice(0, 5);
    const digits = q.replace(/\D/g, "");
    const os = S.orders.filter((o) => `#${o.numero} ${o.cliente.nombre} ${o.cliente.ciudad}`.toLowerCase().includes(q) || (digits.length > 3 && o.cliente.telefono.replace(/\D/g, "").includes(digits))).slice(0, 6);
    box.innerHTML = (ps.length ? `<div class="grp">Productos</div>${ps.map((p) => `<a href="#/productos/${p.slug}"><img src="${esc(p.imagenes.mini)}" alt=""><div>${esc(p.nombre)}<small>${cop(p.precio)}</small></div></a>`).join("")}` : "") +
      (os.length ? `<div class="grp">Pedidos</div>${os.map((o) => `<a href="#/pedidos/${o.id}"><div><b>#${o.numero}</b> · ${esc(o.cliente.nombre)}<small>${fDate(o.fecha, { day: "numeric", month: "short" })} · ${cop(o.total)} · ${esc(lbl(ESTADOS, o.estado))}</small></div></a>`).join("")}` : "") ||
      `<div class="grp">Sin resultados</div>`;
    box.classList.remove("hidden");
  };
  inp.addEventListener("input", run);
  inp.addEventListener("focus", run);
  document.addEventListener("click", (e) => { if (!e.target.closest(".search")) box.classList.add("hidden"); if (e.target.closest(".search-res a")) { box.classList.add("hidden"); inp.value = ""; } });
  document.addEventListener("keydown", (e) => { if (e.key === "/" && !e.target.closest("input,textarea,select")) { e.preventDefault(); inp.focus(); } });
}
