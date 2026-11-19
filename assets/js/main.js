/* =========================================================
   NUTRELL — lógica de tienda
   ⚙️  EDITA AQUÍ: precios, WhatsApp, envío gratis y fecha de la oferta
   ========================================================= */
// Los datos vienen de assets/js/catalogo.js (generado desde data/productos.json)
const CONFIG = window.NUTRELL.config;
const PRODUCTS = window.NUTRELL.products;

/* ---------- Utilidades ---------- */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const cop = (n) => "$" + Math.round(n).toLocaleString("es-CO");
const store = {
  get() { try { return JSON.parse(localStorage.getItem("nutrell-cart")) || []; } catch { return []; } },
  set(v) { try { localStorage.setItem("nutrell-cart", JSON.stringify(v)); } catch {} },
};
let cart = store.get();

function packOff(id, units) { return (PRODUCTS[id].packs || {})[units] || 0; }
function packPrice(id, units) {
  const p = PRODUCTS[id];
  return p.price * units * (1 - packOff(id, units));
}

/* ---------- Carrito ---------- */
function cartTotal() { return cart.reduce((s, i) => s + i.unit * i.qty, 0); }
function cartCount() { return cart.reduce((s, i) => s + i.qty * i.units, 0); }

function addToCart(id, units = 1, qty = 1, silent = false) {
  const unit = packPrice(id, units);
  const key = id + "-" + units;
  const found = cart.find((i) => i.key === key);
  if (found) found.qty += qty;
  else cart.push({ key, id, units, qty, unit });
  store.set(cart);
  renderCart();
  const c = $(".cart-count");
  if (c) { c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
  if (silent) return;
  toast("Agregado a tu carrito");
  setTimeout(openCart, 350);
}

function renderCart() {
  const count = cartCount();
  $$(".cart-count").forEach((el) => { el.textContent = count; el.classList.toggle("show", count > 0); });
  const body = $(".drawer-body");
  if (!body) return;
  if (!cart.length) {
    body.innerHTML = `<div class="empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 016 0"/></svg><p>Tu carrito está vacío.<br>Tu mejor versión empieza hoy.</p><a href="index.html#coleccion" class="btn btn-dark">Ver productos</a></div>`;
  } else {
    body.innerHTML = cart.map((i) => {
      const p = PRODUCTS[i.id];
      const off = packOff(i.id, i.units);
      const label = i.units > 1 ? `Pack x${i.units}${off ? ` · ahorra ${Math.round(off * 100)}%` : ""}` : p.variant;
      return `<div class="cart-item">
        <img src="${p.image}" alt="${p.name}">
        <div><h4>${p.name}</h4><small>${label}</small><br>
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
    sp.innerHTML = (missing > 0
      ? `Te faltan <b>${cop(missing)}</b> para tener <b>envío gratis</b>`
      : `¡Felicitaciones! Tu pedido tiene <b>envío gratis</b>`) +
      `<div class="bar"><i style="width:${Math.min(100, (total / CONFIG.freeShippingFrom) * 100)}%"></i></div>`;
  }
  const t = $("[data-cart-total]"); if (t) t.textContent = cop(total);
  const f = $(".drawer-foot"); if (f) f.style.display = cart.length ? "grid" : "none";
}

function openCart() { $(".drawer")?.classList.add("open"); $(".overlay")?.classList.add("show"); document.body.style.overflow = "hidden"; }
function closeCart() { $(".drawer")?.classList.remove("open"); $(".overlay")?.classList.remove("show"); document.body.style.overflow = ""; }

function waLink(text) { return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`; }
function checkoutWhatsApp() {
  if (!cart.length) return;
  const lines = cart.map((i) => `• ${i.qty} x ${PRODUCTS[i.id].name}${i.units > 1 ? ` (Pack x${i.units})` : ""} — ${cop(i.unit * i.qty)}`);
  const total = cartTotal();
  const msg = `¡Hola Nutrell! Quiero hacer este pedido:\n\n${lines.join("\n")}\n\nTotal: ${cop(total)}${total >= CONFIG.freeShippingFrom ? " (envío gratis)" : ""}\n\nMi nombre:\nCiudad:\nDirección:\nMétodo de pago (contraentrega / transferencia):`;
  window.open(waLink(msg), "_blank", "noopener");
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Countdown ---------- */
function startCountdowns() {
  const els = $$("[data-countdown]");
  if (!els.length) return;
  const end = new Date(CONFIG.promoEnds).getTime();
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
  document.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); });

  // Zoom con el mouse (escritorio)
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
    if (fine) g.classList.toggle("zooming");
    else openLightbox(img.src);
  });
  g.addEventListener("mouseleave", () => g.classList.remove("zooming"));

  // Swipe táctil
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
function openLightbox(src) {
  const lb = $(".lightbox"); if (!lb) return;
  $("img", lb).src = src; lb.classList.add("open");
}

/* ---------- Selector de packs (PDP) ---------- */
function initBuybox() {
  const box = $(".buybox"); if (!box) return;
  const id = box.dataset.product, p = PRODUCTS[id];
  const qtyEl = $("[data-qty]", box);
  let qty = 1;
  const units = () => Number($("input[name=pack]:checked", box).value);
  const update = () => {
    const u = units(), total = packPrice(id, u) * qty, before = p.compareAt * u * qty;
    $("[data-price]", box).textContent = cop(total);
    $("[data-was]", box).textContent = cop(before);
    $("[data-save]", box).textContent = `Ahorras ${cop(before - total)}`;
    $$("[data-sticky-price]").forEach((el) => (el.textContent = cop(total)));
    qtyEl.textContent = qty;
  };
  $$("[data-pack-price]", box).forEach((el) => {
    const u = Number(el.dataset.packPrice);
    el.innerHTML = `${cop(packPrice(id, u))}<s>${cop(p.compareAt * u)}</s>`;
  });
  $$("input[name=pack]", box).forEach((r) => r.addEventListener("change", update));
  $$("[data-step]", box).forEach((b) => b.addEventListener("click", () => { qty = Math.max(1, Math.min(10, qty + Number(b.dataset.step))); update(); }));
  $$("[data-add-pdp]").forEach((b) => b.addEventListener("click", () => addToCart(id, units(), qty)));
  $$("[data-wa-pdp]").forEach((b) => b.addEventListener("click", () => {
    const u = units();
    window.open(waLink(`¡Hola Nutrell! Quiero comprar ${qty} x ${p.name}${u > 1 ? ` (Pack x${u})` : ""} por ${cop(packPrice(id, u) * qty)}. ¿Me ayudan con el pedido?`), "_blank", "noopener");
  }));
  update();

  // Barra fija de compra cuando el botón principal sale de pantalla
  const sticky = $(".sticky-atc"), main = $("[data-add-pdp]", box);
  if (sticky && main) {
    new IntersectionObserver(([e]) => {
      const show = !e.isIntersecting && e.boundingClientRect.top < 0;
      sticky.classList.toggle("show", show);
      document.body.classList.toggle("has-sticky", show);
    }).observe(main);
  }
}

/* ---------- Init general ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // Header con sombra al hacer scroll
  const header = $(".header");
  const onScroll = () => header?.classList.toggle("scrolled", scrollY > 10);
  onScroll(); addEventListener("scroll", onScroll, { passive: true });

  // Menú móvil
  $(".menu-toggle")?.addEventListener("click", () => $(".mobile-menu").classList.add("open"));
  $$(".mobile-menu .close, .mobile-menu a").forEach((el) => el.addEventListener("click", () => $(".mobile-menu").classList.remove("open")));

  // Carrito
  $$("[data-open-cart]").forEach((b) => b.addEventListener("click", openCart));
  $$("[data-close-cart], .overlay").forEach((b) => b.addEventListener("click", closeCart));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCart(); $(".lightbox")?.classList.remove("open"); } });
  $$("[data-add]").forEach((b) => b.addEventListener("click", () => addToCart(b.dataset.add, Number(b.dataset.units || 1))));
  $("[data-checkout]")?.addEventListener("click", checkoutWhatsApp);
  $(".drawer-body")?.addEventListener("click", (e) => {
    const q = e.target.closest("[data-q]"), r = e.target.closest("[data-r]");
    if (q) { const it = cart.find((i) => i.key === q.dataset.k); it.qty += Number(q.dataset.q); if (it.qty < 1) cart = cart.filter((i) => i !== it); }
    if (r) cart = cart.filter((i) => i.key !== r.dataset.r);
    if (q || r) { store.set(cart); renderCart(); }
  });
  renderCart();

  // Precios dinámicos en la landing
  $$("[data-price-of]").forEach((el) => {
    const u = Number(el.dataset.units || 1);
    el.textContent = cop(packPrice(el.dataset.priceOf, u));
  });
  $$("[data-was-of]").forEach((el) => { el.textContent = cop(PRODUCTS[el.dataset.wasOf].compareAt * Number(el.dataset.units || 1)); });
  $$("[data-per-of]").forEach((el) => { const u = Number(el.dataset.units); el.textContent = `${cop(packPrice(el.dataset.perOf, u) / u)} c/u`; });

  // Kits / rituales: agregan varios productos a la vez
  $$("[data-kit]").forEach((b) => b.addEventListener("click", () => {
    b.dataset.kit.split(",").forEach((id) => addToCart(id, 1, 1, true));
    toast("Ritual agregado a tu carrito"); setTimeout(openCart, 350);
  }));

  // Filtros de la colección
  const applyFilter = (c) => {
    $$("[data-filter]").forEach((f) => f.classList.toggle("on", f.dataset.filter === c));
    $$(".pcard[data-cat]").forEach((card) => card.classList.toggle("hide", c !== "todos" && card.dataset.cat !== c));
  };
  $$("[data-filter]").forEach((f) => f.addEventListener("click", () => applyFilter(f.dataset.filter)));
  $$("[data-goto-cat]").forEach((a) => a.addEventListener("click", () => applyFilter(a.dataset.gotoCat)));

  // WhatsApp genérico
  $$("[data-wa]").forEach((a) => (a.href = waLink(a.dataset.wa || "¡Hola Nutrell! Quiero más información 🙌")));

  // Newsletter
  $$("form.newsletter").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); f.reset(); toast("¡Listo! Usa el código NUTRE10 en tu primera compra"); }));

  // Lightbox
  $(".lightbox .close")?.addEventListener("click", () => $(".lightbox").classList.remove("open"));
  $(".lightbox")?.addEventListener("click", (e) => { if (e.target.classList.contains("lightbox")) e.currentTarget.classList.remove("open"); });

  // Brillo que sigue al mouse en tarjetas
  $$(".ingr").forEach((c) => c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px");
  }));

  // Animaciones de entrada
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  // Año footer
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  startCountdowns();
  initGallery();
  initBuybox();
});
