/* =========================================================
   NUTRELL — lógica de tienda
   Los datos (productos, precios, WhatsApp, cupones) vienen del servidor
   en window.NUTRELL y se editan desde el panel /admin.
   ========================================================= */
const NT = window.NUTRELL || { config: {}, products: {}, coupons: [] };
const CONFIG = NT.config;
const PRODUCTS = NT.products;
const COUPONS = NT.coupons || [];

/* ---------- Utilidades ---------- */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const cop = (n) => "$" + Math.round(n).toLocaleString("es-CO");
const escH = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safe = (fn) => { try { fn(); } catch (err) { console.error(err); } };
const store = {
  get(k = "nutrell-cart") { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } },
  set(v, k = "nutrell-cart") { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function packOff(id, units) { return (PRODUCTS[id]?.packs || {})[units] ?? 0; }
function packPrice(id, units) { const p = PRODUCTS[id]; return Math.round(p.price * units * (1 - packOff(id, units))); }
const usable = (i) => i && PRODUCTS[i.id] && PRODUCTS[i.id].active !== false && (PRODUCTS[i.id].packs || {})[i.units] !== undefined && i.qty > 0;

let cart = (store.get() || []).filter(usable);
cart.forEach((i) => (i.unit = packPrice(i.id, i.units)));
store.set(cart);

/* ---------- Carrito ---------- */
const cartTotal = () => cart.reduce((s, i) => s + i.unit * i.qty, 0);
const cartCount = () => cart.reduce((s, i) => s + i.qty * i.units, 0);
const unitsInCart = (id) => cart.filter((i) => i.id === id).reduce((s, i) => s + i.qty * i.units, 0);

function addToCart(id, units = 1, qty = 1, silent = false) {
  const p = PRODUCTS[id]; if (!p) return false;
  if (p.stock !== null && unitsInCart(id) + units * qty > p.stock) {
    toast(p.stock <= 0 ? `${p.name} está agotado` : `Solo quedan ${p.stock} unidades de ${p.name}`); return false;
  }
  const key = id + "-" + units;
  const found = cart.find((i) => i.key === key);
  if (found) found.qty += qty; else cart.push({ key, id, units, qty, unit: packPrice(id, units) });
  store.set(cart);
  safe(renderCart);
  const c = $(".cart-count");
  if (c) { c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
  if (silent) return true;
  toast("Agregado a tu carrito");
  setTimeout(openCart, 350);
  return true;
}

function renderCart() {
  const count = cartCount();
  $$(".cart-count").forEach((el) => { el.textContent = count; el.classList.toggle("show", count > 0); });
  const body = $('[data-view="cart"] .drawer-body');
  if (!body) return;
  if (!cart.length) {
    body.innerHTML = `<div class="empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 016 0"/></svg><p>Tu carrito está vacío.<br>Tu mejor versión empieza hoy.</p><a href="/#coleccion" class="btn btn-dark" data-close-cart>Ver productos</a></div>`;
  } else {
    body.innerHTML = cart.map((i) => {
      const p = PRODUCTS[i.id], off = packOff(i.id, i.units);
      const label = i.units > 1 ? `Pack x${i.units}${off ? ` · ahorra ${Math.round(off * 100)}%` : ""}` : p.variant;
      return `<div class="cart-item">
        <img src="${escH(p.image)}" alt="${escH(p.name)}">
        <div><h4>${escH(p.name)}</h4><small>${escH(label)}</small><br>
          <div class="qty"><button data-q="-1" data-k="${i.key}" aria-label="Restar">−</button><span>${i.qty}</span><button data-q="1" data-k="${i.key}" aria-label="Sumar">+</button></div>
        </div>
        <div style="text-align:right"><b>${cop(i.unit * i.qty)}</b><br><button class="remove" data-r="${i.key}">Quitar</button></div>
      </div>`;
    }).join("");
  }
  const total = cartTotal();
  const missing = Math.max(0, CONFIG.freeShippingFrom - total);
  const sp = $(".ship-progress");
  if (sp) {
    sp.innerHTML = (missing > 0 ? `Te faltan <b>${cop(missing)}</b> para tener <b>envío gratis</b>` : `¡Felicitaciones! Tu pedido tiene <b>envío gratis</b>`) +
      `<div class="bar"><i style="width:${Math.min(100, (total / CONFIG.freeShippingFrom) * 100)}%"></i></div>`;
    sp.style.display = cart.length ? "" : "none";
  }
  const t = $("[data-cart-total]"); if (t) t.textContent = cop(total);
  const f = $('[data-view="cart"] .drawer-foot'); if (f) f.style.display = cart.length ? "grid" : "none";
  safe(renderCheckoutTotals);
}

function showView(v) {
  $$(".drawer-view").forEach((el) => (el.hidden = el.dataset.view !== v));
  const t = $("[data-drawer-title]"); if (t) t.textContent = v === "checkout" ? "Finalizar compra" : v === "done" ? "Pedido recibido" : "Tu carrito";
}
function openCart() { showView("cart"); $(".drawer")?.classList.add("open"); $(".overlay")?.classList.add("show"); document.body.style.overflow = "hidden"; }
function closeCart() { $(".drawer")?.classList.remove("open"); $(".overlay")?.classList.remove("show"); document.body.style.overflow = ""; }

function waLink(text) { return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`; }

/* ---------- Checkout ---------- */
let coupon = null;
function couponFor(code, subtotal) {
  const c = COUPONS.find((x) => x.code === String(code || "").trim().toUpperCase());
  if (!c) return { error: "Este código no es válido." };
  if (subtotal < c.min) return { error: `Este código aplica en compras desde ${cop(c.min)}.` };
  return { coupon: c };
}
function totals() {
  const subtotal = cartTotal();
  const discount = coupon ? Math.round(subtotal * coupon.pct / 100) : 0;
  const free = subtotal - discount >= CONFIG.freeShippingFrom;
  const ship = free ? 0 : Number(CONFIG.shippingCost || 0);
  return { subtotal, discount, ship, free, total: subtotal - discount + ship };
}
function renderCheckoutTotals() {
  if (!$("[data-co-sub]")) return;
  if (coupon && cartTotal() < coupon.min) coupon = null;
  const t = totals();
  $("[data-co-sub]").textContent = cop(t.subtotal);
  $("[data-co-disc-row]").hidden = !t.discount;
  $("[data-co-disc]").textContent = "−" + cop(t.discount) + (coupon ? ` (${coupon.code})` : "");
  $("[data-co-ship]").textContent = t.free ? "Gratis" : t.ship ? cop(t.ship) : "A confirmar";
  $("[data-co-total]").textContent = cop(t.total);
}
function orderMessage(num, form, t) {
  const lines = cart.map((i) => `• ${i.qty} x ${PRODUCTS[i.id].name}${i.units > 1 ? ` (Pack x${i.units})` : ""} — ${cop(i.unit * i.qty)}`);
  return `¡Hola Nutrell! ${num ? `Acabo de hacer el pedido *#${num}*` : "Quiero hacer este pedido"}:\n\n${lines.join("\n")}\n\n` +
    (t.discount ? `Descuento: −${cop(t.discount)}\n` : "") + `Envío: ${t.free ? "gratis" : t.ship ? cop(t.ship) : "a confirmar"}\n*Total: ${cop(t.total)}*\n\n` +
    `Nombre: ${form.nombre}\nCelular: ${form.telefono}\nCiudad: ${form.ciudad}${form.departamento ? ", " + form.departamento : ""}\nDirección: ${form.direccion}\nPago: ${form.metodoPago}${form.notas ? `\nNotas: ${form.notas}` : ""}`;
}
async function placeOrder(e) {
  e.preventDefault();
  const form = e.currentTarget, err = $("[data-co-error]"), btn = $("[data-place-order]");
  const data = Object.fromEntries(new FormData(form));
  const missing = ["nombre", "telefono", "ciudad", "direccion"].filter((k) => !String(data[k] || "").trim());
  $$(".fld input", form).forEach((i) => i.classList.toggle("bad", missing.includes(i.name)));
  if (missing.length) { err.textContent = "Completa los campos marcados."; return; }
  if (String(data.telefono).replace(/\D/g, "").length < 7) { err.textContent = "Revisa tu número de celular."; $("[name=telefono]", form).classList.add("bad"); return; }
  if (!cart.length) return;
  err.textContent = ""; btn.disabled = true; btn.textContent = "Procesando…";
  const t = totals();
  let result = null;
  try {
    const r = await fetch("/api/store?a=order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      items: cart.map((i) => ({ id: i.id, units: i.units, qty: i.qty })), cupon: coupon ? coupon.code : "", metodoPago: data.metodoPago,
      cliente: { nombre: data.nombre, telefono: data.telefono, email: data.email, ciudad: data.ciudad, departamento: data.departamento, direccion: data.direccion, notas: data.notas },
    }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) result = j;
    else if (j.error && j.error !== "NO_DB") { err.textContent = j.error; btn.disabled = false; btn.textContent = "Confirmar pedido"; return; }
  } catch {}
  const msg = orderMessage(result?.numero, data, result ? { discount: result.descuento, ship: result.envio, free: !result.envio && !result.envioPorConfirmar, total: result.total } : t);
  $("[data-done-num]").textContent = result ? "#" + result.numero : "";
  $("[data-done-sum]").innerHTML = cart.map((i) => `<div><span>${i.qty} × ${escH(PRODUCTS[i.id].name)}${i.units > 1 ? ` (x${i.units})` : ""}</span><b>${cop(i.unit * i.qty)}</b></div>`).join("") + `<div class="tot"><span>Total</span><b>${cop(result ? result.total : t.total)}</b></div>`;
  $("[data-done-wa]").href = waLink(msg);
  if (!result) $(".done p").innerHTML = "Envíanos tu pedido por WhatsApp para confirmarlo y despacharlo.";
  cart = []; coupon = null; store.set(cart); renderCart(); form.reset();
  btn.disabled = false; btn.textContent = "Confirmar pedido";
  showView("done");
  if (!result) window.open(waLink(msg), "_blank", "noopener");
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ---------- Countdown ---------- */
function startCountdowns() {
  const els = $$("[data-countdown]");
  if (!els.length) return;
  const end = new Date(CONFIG.promoEnds).getTime();
  if (!end || end <= Date.now()) { els.forEach((el) => el.closest("[data-countdown-wrap]")?.remove()); return; }
  const tick = () => {
    let d = Math.max(0, end - Date.now());
    const days = Math.floor(d / 864e5); d %= 864e5;
    const h = Math.floor(d / 36e5); d %= 36e5;
    const m = Math.floor(d / 6e4); const s = Math.floor((d % 6e4) / 1e3);
    const pad = (n) => String(n).padStart(2, "0");
    els.forEach((el) => {
      if (end <= Date.now()) { el.closest("[data-countdown-wrap]")?.remove(); return; }
      el.innerHTML = `<span>${days}d</span><span>${pad(h)}h</span><span>${pad(m)}m</span><span>${pad(s)}s</span>`;
    });
  };
  tick(); setInterval(tick, 1000);
}

/* ---------- Galería (página de producto) ---------- */
function initGallery() {
  const g = $(".gallery-main"); if (!g) return;
  const track = $(".slides", g), slides = $$(".slide", g), thumbs = $$(".thumb"), dots = $(".g-dots"), count = $(".g-count");
  let i = 0;
  dots.innerHTML = slides.map(() => "<i></i>").join("");
  const go = (n) => {
    i = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${i * 100}%)`;
    slides.forEach((s, k) => s.classList.toggle("active", k === i));
    thumbs.forEach((t, k) => t.classList.toggle("active", k === i));
    $$("i", dots).forEach((d, k) => d.classList.toggle("on", k === i));
    count.textContent = `${i + 1} / ${slides.length}`;
    thumbs[i]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    g.classList.remove("zooming");
  };
  thumbs.forEach((t, k) => { t.addEventListener("click", () => go(k)); t.addEventListener("mouseenter", () => matchMedia("(hover:hover)").matches && go(k)); });
  $(".g-nav.prev", g).addEventListener("click", (e) => { e.stopPropagation(); go(i - 1); });
  $(".g-nav.next", g).addEventListener("click", (e) => { e.stopPropagation(); go(i + 1); });
  document.addEventListener("keydown", (e) => { if (e.target.closest("input,textarea")) return; if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); });
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  g.addEventListener("mousemove", (e) => {
    if (!fine) return;
    const img = $(".slide.active img", g); if (!img) return;
    const r = g.getBoundingClientRect();
    img.style.setProperty("--zx", ((e.clientX - r.left) / r.width) * 100 + "%");
    img.style.setProperty("--zy", ((e.clientY - r.top) / r.height) * 100 + "%");
  });
  g.addEventListener("click", () => {
    const img = $(".slide.active img", g); if (!img) return;
    if (fine) g.classList.toggle("zooming"); else openLightbox(img.src);
  });
  g.addEventListener("mouseleave", () => g.classList.remove("zooming"));
  let x0 = null;
  g.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  g.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
    x0 = null;
  });
  go(0);
}
function openLightbox(src) { const lb = $(".lightbox"); if (!lb) return; $("img", lb).src = src; lb.classList.add("open"); }

/* ---------- Selector de packs (PDP) ---------- */
function initBuybox() {
  const box = $(".buybox"); if (!box) return;
  const id = box.dataset.product, p = PRODUCTS[id]; if (!p) return;
  const qtyEl = $("[data-qty]", box);
  let qty = 1;
  const units = () => Number($("input[name=pack]:checked", box)?.value || 1);
  const update = () => {
    const u = units(), total = packPrice(id, u) * qty, before = Math.max(p.compareAt, p.price) * u * qty;
    $("[data-price]", box).textContent = cop(total);
    $("[data-was]", box).textContent = before > total ? cop(before) : "";
    $("[data-save]", box).textContent = before > total ? `Ahorras ${cop(before - total)}` : "";
    $("[data-save]", box).style.display = before > total ? "" : "none";
    $$("[data-sticky-price]").forEach((el) => (el.textContent = cop(total)));
    qtyEl.textContent = qty;
  };
  $$("[data-pack-price]", box).forEach((el) => {
    const u = Number(el.dataset.packPrice), before = Math.max(p.compareAt, p.price) * u, now = packPrice(id, u);
    el.innerHTML = `${cop(now)}${before > now ? `<s>${cop(before)}</s>` : ""}`;
  });
  $$("input[name=pack]", box).forEach((r) => r.addEventListener("change", update));
  $$("[data-step]", box).forEach((b) => b.addEventListener("click", () => { qty = Math.max(1, Math.min(20, qty + Number(b.dataset.step))); update(); }));
  $$("[data-add-pdp]").forEach((b) => b.addEventListener("click", () => addToCart(id, units(), qty)));
  $$("[data-wa-pdp]").forEach((b) => b.addEventListener("click", () => {
    const u = units();
    const msg = p.stock !== null && p.stock <= 0 ? `¡Hola Nutrell! Quiero que me avisen cuando llegue ${p.name}.` : `¡Hola Nutrell! Quiero comprar ${qty} x ${p.name}${u > 1 ? ` (Pack x${u})` : ""} por ${cop(packPrice(id, u) * qty)}. ¿Me ayudan con el pedido?`;
    window.open(waLink(msg), "_blank", "noopener");
  }));
  update();
  const sticky = $(".sticky-atc"), main = $("[data-add-pdp]", box);
  if (sticky && main) {
    new IntersectionObserver(([e]) => {
      const show = !e.isIntersecting && e.boundingClientRect.top < 0;
      sticky.classList.toggle("show", show);
      document.body.classList.toggle("has-sticky", show);
    }).observe(main);
  }
}

/* ---------- Animaciones ---------- */
function initReveal() {
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
  document.documentElement.classList.add("anim");
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  els.forEach((el) => io.observe(el));
  setTimeout(() => els.forEach((el) => el.classList.add("in")), 2500);
}

/* ---------- Init general ---------- */
document.addEventListener("DOMContentLoaded", () => {
  safe(initReveal);
  safe(() => {
    const header = $(".header");
    const onScroll = () => header?.classList.toggle("scrolled", scrollY > 10);
    onScroll(); addEventListener("scroll", onScroll, { passive: true });
    $(".menu-toggle")?.addEventListener("click", () => $(".mobile-menu").classList.add("open"));
    $$(".mobile-menu .close, .mobile-menu a").forEach((el) => el.addEventListener("click", () => $(".mobile-menu").classList.remove("open")));
  });

  safe(() => {
    $$("[data-open-cart]").forEach((b) => b.addEventListener("click", openCart));
    document.addEventListener("click", (e) => { if (e.target.closest("[data-close-cart]") || e.target.classList.contains("overlay")) closeCart(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCart(); $(".lightbox")?.classList.remove("open"); } });
    $$("[data-add]").forEach((b) => b.addEventListener("click", () => addToCart(b.dataset.add, Number(b.dataset.units || 1))));
    $('[data-view="cart"] .drawer-body')?.addEventListener("click", (e) => {
      const q = e.target.closest("[data-q]"), r = e.target.closest("[data-r]");
      if (q) {
        const it = cart.find((i) => i.key === q.dataset.k), p = PRODUCTS[it.id], d = Number(q.dataset.q);
        if (d > 0 && p.stock !== null && unitsInCart(it.id) + it.units > p.stock) { toast(`Solo quedan ${p.stock} unidades`); return; }
        it.qty += d; if (it.qty < 1) cart = cart.filter((i) => i !== it);
      }
      if (r) cart = cart.filter((i) => i.key !== r.dataset.r);
      if (q || r) { store.set(cart); renderCart(); }
    });
    $("[data-go-checkout]")?.addEventListener("click", () => { showView("checkout"); renderCheckoutTotals(); const saved = store.get("nutrell-cliente"); if (saved) for (const [k, v] of Object.entries(saved)) { const f = $(`.checkout [name="${k}"]`); if (f && f.type !== "radio" && !f.value) f.value = v; } });
    $("[data-go-cart]")?.addEventListener("click", () => showView("cart"));
    $("[data-apply-coupon]")?.addEventListener("click", () => {
      const input = $(".checkout [name=cupon]"), msg = $("[data-coupon-msg]");
      const r = couponFor(input.value, cartTotal());
      if (r.error) { coupon = null; msg.textContent = r.error; msg.className = "co-msg bad"; }
      else { coupon = r.coupon; msg.textContent = `Código ${coupon.code} aplicado: ${coupon.pct}% de descuento.`; msg.className = "co-msg ok"; }
      renderCheckoutTotals();
    });
    $(".checkout")?.addEventListener("submit", (e) => {
      const d = Object.fromEntries(new FormData(e.currentTarget)); delete d.cupon; delete d.notas; delete d.metodoPago;
      store.set(d, "nutrell-cliente");
      placeOrder(e);
    });
    renderCart();
  });

  safe(() => {
    $$("[data-kit]").forEach((b) => b.addEventListener("click", () => {
      let ok = 0; b.dataset.kit.split(",").forEach((id) => { if (addToCart(id, 1, 1, true)) ok++; });
      if (ok) { toast("Ritual agregado a tu carrito"); setTimeout(openCart, 350); }
    }));
    const applyFilter = (c) => {
      $$("[data-filter]").forEach((f) => f.classList.toggle("on", f.dataset.filter === c));
      $$(".grid-products .pcard[data-cat]").forEach((card) => { if (!card.closest(".related")) card.classList.toggle("hide", c !== "todos" && card.dataset.cat !== c); });
    };
    $$("[data-filter]").forEach((f) => f.addEventListener("click", () => applyFilter(f.dataset.filter)));
    $$("[data-goto-cat]").forEach((a) => a.addEventListener("click", () => applyFilter(a.dataset.gotoCat)));
    $$("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.wa || "¡Hola Nutrell! Quiero más información"); a.target = "_blank"; a.rel = "noopener"; });
    $$("form.newsletter").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); f.reset(); toast(f.dataset.code ? `¡Listo! Usa el código ${f.dataset.code} al finalizar tu compra` : "¡Listo! Ya eres parte del club"); }));
    $(".lightbox .close")?.addEventListener("click", () => $(".lightbox").classList.remove("open"));
    $(".lightbox")?.addEventListener("click", (e) => { if (e.target.classList.contains("lightbox")) e.currentTarget.classList.remove("open"); });
    $$(".ingr").forEach((c) => c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px");
    }));
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  });

  safe(startCountdowns);
  safe(initGallery);
  safe(initBuybox);

  // Conteo de visitas (anónimo, una vez por sesión)
  safe(() => {
    if (sessionStorage.getItem("nt-v")) return;
    sessionStorage.setItem("nt-v", "1");
    if (location.protocol.startsWith("http")) navigator.sendBeacon?.("/api/store?a=track", "");
  });
});
