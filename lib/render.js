// Genera el HTML de la tienda a partir del catálogo (editable desde /admin).
import { visibles, bySlug, publicData } from "./catalog.js";

const VER = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.NUTRELL_VER || "dev").slice(0, 8);
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<b>$1</b>");
const strip = (s) => String(s ?? "").replace(/\*+/g, "");
export const cop = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CO");
const offPct = (p) => (p.antes > p.precio ? Math.round((1 - p.precio / p.antes) * 100) : 0);
const abs = (c, u) => (/^https?:/.test(u) ? u : c.sitio.url.replace(/\/$/, "") + u);
const soldOut = (p) => p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) <= 0;
const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

const I = {
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-3.9-1L4 20z"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 016 0"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8h16M4 16h16"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l7-7"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3c3 4 6 7 6 11a6 6 0 01-12 0c0-4 3-7 6-11z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>',
};

const NAV = [["/#coleccion", "Productos"], ["/#objetivos", "Objetivos"], ["/#rituales", "Rituales"], ["/#faq", "Preguntas"]];

function head(c, { title, desc, canonical, og, ld = [], style = "" }) {
  return `<!doctype html>
<html lang="es-CO">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta name="theme-color" content="#0d0d0e">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="website"><meta property="og:locale" content="es_CO"><meta property="og:site_name" content="${esc(c.sitio.nombre)}">
  <meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(og)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/img/nutrell-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/styles.css?v=${VER}">
${ld.map((j) => `  <script type="application/ld+json">${json(j)}</script>`).join("\n")}
</head>
<body${style ? ` style="${style}"` : ""}>
`;
}

function header(c) {
  const links = NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join("");
  const mobP = visibles(c).map((p) => `<a href="/${p.slug}" class="mm-prod">${esc(p.nombre)}</a>`).join("");
  const ann = (c.contenido.anuncios || []).filter(Boolean).slice(0, 3);
  const annHtml = ann.map((a) => `<div class="announce-item"><span class="sep">✦</span><span>${md(a)}</span></div>`).join("");
  return `
  <div class="announce" role="region" aria-label="Anuncios"><div class="announce-track${ann.length < 2 ? " static" : ""}">${annHtml}</div></div>
  <header class="header">
    <div class="container header-inner">
      <a href="/" class="logo" aria-label="${esc(c.sitio.nombre)} inicio"><img src="/assets/img/nutrell-logo.png" alt="${esc(c.sitio.nombre)} · Nutre tu vida" width="600" height="256"></a>
      <nav class="nav" aria-label="Principal">${links}</nav>
      <div class="header-actions">
        <a class="icon-btn" href="#" data-wa aria-label="Asesoría por WhatsApp">${I.chat}</a>
        <button class="icon-btn" data-open-cart aria-label="Abrir carrito">${I.bag}<span class="cart-count">0</span></button>
        <button class="icon-btn menu-toggle" aria-label="Abrir menú">${I.menu}</button>
      </div>
    </div>
  </header>
  <div class="mobile-menu" aria-label="Menú">
    <button class="icon-btn close" aria-label="Cerrar menú">${I.x}</button>
    ${links}
    <div class="mm-list">${mobP}</div>
  </div>
`;
}

function footer(c) {
  const s = c.sitio;
  const plinks = visibles(c).map((p) => `<li><a href="/${p.slug}">${esc(p.nombre)}</a></li>`).join("");
  const social = [["instagram", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>'],
    ["facebook", '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3a4 4 0 00-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z"/></svg>'],
    ["tiktok", '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.4 2.3 1.8 3.8 4 4v3.2c-1.5 0-2.8-.4-4-1.2V15a6 6 0 11-6-6v3.3A2.7 2.7 0 1012.7 15V3H16z"/></svg>']]
    .filter(([k]) => s[k]).map(([k, svg]) => `<a href="${esc(s[k])}" target="_blank" rel="noopener" aria-label="${k}">${svg}</a>`).join("");
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="/assets/img/nutrell-logo-light.png" alt="${esc(s.nombre)}" loading="lazy">
          <p style="max-width:34ch">Suplementos dietarios con ingredientes naturales, endulzados con stevia, para acompañarte en cada etapa. <b style="color:#fff">Nutre tu vida.</b></p>
          <div class="socials">${social}<a href="#" data-wa aria-label="WhatsApp">${I.chat}</a></div>
        </div>
        <div><h4>Productos</h4><ul>${plinks}</ul></div>
        <div><h4>Ayuda</h4><ul><li><a href="/#faq">Preguntas frecuentes</a></li><li><a href="#" data-wa="Hola, quiero saber el estado de mi pedido">Estado de mi pedido</a></li><li><a href="#" data-wa>Contáctanos</a></li>${s.email ? `<li><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>` : ""}</ul></div>
        <div><h4>Legal</h4><ul><li><a href="#">Términos y condiciones</a></li><li><a href="#">Política de privacidad</a></li><li><a href="#">Tratamiento de datos</a></li></ul></div>
      </div>
      <div class="legal">
        <p class="disclaimer">${esc(c.contenido.aviso)}</p>
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;align-items:center">
          <span>© <span data-year>2026</span> ${esc(s.nombre)}®. Todos los derechos reservados. · <a href="/admin" class="admin-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>Acceso administrativo</a></span>
          <div class="payments">${c.metodosPago.map((m) => `<span>${esc(m)}</span>`).join("")}</div>
        </div>
      </div>
    </div>
  </footer>
  <a class="wa-float" href="#" data-wa aria-label="Escríbenos por WhatsApp">${I.wa}</a>
  <div class="overlay"></div>
  <aside class="drawer" aria-label="Carrito de compras">
    <div class="drawer-head"><h3 data-drawer-title>Tu carrito</h3><button class="icon-btn" data-close-cart aria-label="Cerrar carrito">${I.x}</button></div>
    <div class="drawer-view" data-view="cart">
      <div class="ship-progress"></div>
      <div class="drawer-body"></div>
      <div class="drawer-foot">
        <div class="row total"><span>Subtotal</span><span data-cart-total>$0</span></div>
        <button class="btn btn-dark btn-block" data-go-checkout>Finalizar compra ${I.arrow}</button>
        <small>Pago contra entrega o transferencia · Compra 100% segura</small>
      </div>
    </div>
    <form class="drawer-view checkout" data-view="checkout" hidden novalidate>
      <div class="drawer-body">
        <button type="button" class="back-link" data-go-cart>${I.prev} Volver al carrito</button>
        <p class="co-title">Datos de envío</p>
        <label class="fld"><span>Nombre completo *</span><input name="nombre" autocomplete="name" required></label>
        <label class="fld"><span>Celular / WhatsApp *</span><input name="telefono" type="tel" autocomplete="tel" inputmode="tel" required></label>
        <div class="fld-row">
          <label class="fld"><span>Ciudad *</span><input name="ciudad" autocomplete="address-level2" required></label>
          <label class="fld"><span>Departamento</span><input name="departamento" autocomplete="address-level1"></label>
        </div>
        <label class="fld"><span>Dirección y barrio *</span><input name="direccion" autocomplete="street-address" required></label>
        <label class="fld"><span>Correo (opcional)</span><input name="email" type="email" autocomplete="email"></label>
        <p class="co-title">Método de pago</p>
        <div class="pay-opts">${c.metodosPago.map((m, i) => `<label class="pay-opt"><input type="radio" name="metodoPago" value="${esc(m)}"${i === 0 ? " checked" : ""}><span>${esc(m)}</span></label>`).join("")}</div>
        <label class="fld"><span>Notas del pedido</span><textarea name="notas" rows="2" placeholder="Indicaciones para la entrega"></textarea></label>
        <div class="coupon"><input name="cupon" placeholder="Código de descuento" autocomplete="off"><button type="button" class="btn btn-outline" data-apply-coupon>Aplicar</button></div>
        <p class="co-msg" data-coupon-msg></p>
      </div>
      <div class="drawer-foot">
        <div class="row"><span>Subtotal</span><span data-co-sub>$0</span></div>
        <div class="row discount" data-co-disc-row hidden><span>Descuento</span><span data-co-disc>$0</span></div>
        <div class="row"><span>Envío</span><span data-co-ship>—</span></div>
        <div class="row total"><span>Total</span><span data-co-total>$0</span></div>
        <p class="co-error" data-co-error></p>
        <button class="btn btn-gold btn-block" type="submit" data-place-order>Confirmar pedido</button>
        <small>Al confirmar recibirás tu número de pedido y te contactaremos por WhatsApp.</small>
      </div>
    </form>
    <div class="drawer-view done" data-view="done" hidden>
      <div class="drawer-body">
        <div class="done-ico">${I.check}</div>
        <h3>¡Gracias por tu compra!</h3>
        <p>Tu pedido <b data-done-num>#0000</b> fue recibido. Confírmalo por WhatsApp para despacharlo lo antes posible.</p>
        <div class="done-sum" data-done-sum></div>
      </div>
      <div class="drawer-foot">
        <a class="btn btn-wa btn-block" href="#" target="_blank" rel="noopener" data-done-wa>${I.wa}Confirmar por WhatsApp</a>
        <button class="btn btn-outline btn-block" data-close-cart>Seguir comprando</button>
      </div>
    </div>
  </aside>
  <script>window.NUTRELL=${json(publicData(c))};</script>
  <script src="/assets/js/main.js?v=${VER}"></script>
</body>
</html>
`;
}

function pcard(c, p, delay = 0) {
  const cat = c.categorias.find((x) => x.id === p.categoria) || { nombre: "" };
  const out = soldOut(p);
  return `<article class="pcard reveal${delay ? ` d${delay}` : ""}${out ? " sold-out" : ""}" data-cat="${esc(p.categoria)}" style="--pc:${esc(p.tema.acento)};--accent-soft:${esc(p.tema.suave)}">
            <a href="/${p.slug}" class="stage" aria-label="Ver ${esc(p.nombre)}">
              ${out ? '<span class="chip chip-soft tag">Agotado</span>' : p.etiqueta ? `<span class="chip chip-dark tag">${esc(p.etiqueta)}</span>` : ""}
              <img class="cut" src="${esc(p.imagenes.mini)}" alt="${esc(p.nombre)} ${esc(p.tamano)} Nutrell" loading="lazy" width="440" height="520">
              ${out ? "" : `<button class="quick" type="button" data-add="${p.slug}" onclick="event.preventDefault()">${I.plus}Agregar rápido</button>`}
            </a>
            <div>
              <span class="cat-name">${esc(cat.nombre)}</span>
              <h3><a href="/${p.slug}">${esc(p.nombre)}</a></h3>
              <p class="desc">${esc(p.resumen)}</p>
            </div>
            <span class="meta">${esc([p.tamano, p.sabor && `Sabor ${p.sabor.toLowerCase()}`].filter(Boolean).join(" · "))}</span>
            <div class="row">
              <div class="price"><span class="now">${cop(p.precio)}</span>${p.antes > p.precio ? `<span class="was">${cop(p.antes)}</span>` : ""}</div>
              ${out ? "" : `<button class="add-round" data-add="${p.slug}" aria-label="Agregar ${esc(p.nombre)} al carrito">${I.plus}</button>`}
            </div>
          </article>`;
}

const orgLd = (c) => ({ "@context": "https://schema.org", "@type": "Organization", name: c.sitio.nombre, slogan: "Nutre tu vida", url: c.sitio.url, logo: abs(c, "/assets/img/nutrell-logo.png") });
const faqLd = (faqs) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.pregunta, acceptedAnswer: { "@type": "Answer", text: f.respuesta } })) });
const faqHtml = (faqs) => faqs.map((f, i) => `<details class="reveal"${i === 0 ? " open" : ""}><summary>${esc(f.pregunta)}<span class="pm">+</span></summary><div class="answer">${esc(f.respuesta)}</div></details>`).join("");

// ---------------------------------------------------------------- INICIO
export function renderIndex(c) {
  const ct = c.contenido, h = ct.hero, P = visibles(c);
  const pick = (s) => { const p = bySlug(c, s); return p && p.activo !== false ? p : null; };
  const star = pick(ct.destacado) || P[0];
  // Abanico con todos los productos: el estrella al centro, los demás alternando a los lados
  const rest = P.filter((p) => p !== star);
  const fan = [];
  rest.forEach((p, i) => (i % 2 ? fan.push(p) : fan.unshift(p)));
  if (star) fan.splice(Math.floor(fan.length / 2) + (rest.length % 2 ? 1 : 0), 0, star);
  const mid = fan.indexOf(star);
  const fanHtml = fan.map((p, i) => {
    const k = i - mid, a = Math.abs(k), wide = p.formato === "Sobre";
    const step = fan.length > 5 ? 12 : 17, left = 50 + Math.sign(k) * (a ? step + 7 + (a - 1) * step : 0);
    const hgt = (k === 0 ? 86 : 70 - a * 9) * (wide ? 0.55 : 1);
    return `<img class="fan-i${k === 0 ? " star" : ""}" src="${esc(k === 0 ? p.imagenes.principal : p.imagenes.mini)}" alt="${esc(p.nombre)}" style="--l:${left}%;--h:${hgt}%;--z:${20 - a};--r:${k * 2.5}deg;--d:${a * 0.12}s"${k === 0 ? ' fetchpriority="high"' : ""}>`;
  }).join("");
  const cats = c.categorias.map((cat, i) => {
    const ps = P.filter((p) => p.categoria === cat.id); if (!ps.length) return "";
    return `<a href="#coleccion" class="cat reveal${i % 3 ? ` d${i % 3}` : ""}" data-goto-cat="${esc(cat.id)}" style="--c:${esc(ps[0].tema.acento)}">
            <div><h3>${esc(cat.nombre)}</h3><p>${esc(cat.frase)}</p><span class="go">${ps.length} ${ps.length === 1 ? "producto" : "productos"} ${I.arrow.replace("<svg", '<svg width="14" height="14"')}</span></div>
            <div class="imgs">${ps.slice(0, 3).map((p) => `<img src="${esc(p.imagenes.mini)}" alt="" loading="lazy">`).join("")}</div>
          </a>`;
  }).join("");
  const filters = `<button class="filter on" data-filter="todos">Todos</button>` + c.categorias.filter((cat) => P.some((p) => p.categoria === cat.id)).map((cat) => `<button class="filter" data-filter="${esc(cat.id)}">${esc(cat.nombre)}</button>`).join("");
  const kits = c.rituales.map((k, i) => {
    const ps = k.productos.map(pick).filter(Boolean); if (ps.length < 2) return "";
    return `<div class="kit reveal${i ? ` d${i % 3}` : ""}">
            <div class="imgs">${ps.map((p) => `<img src="${esc(p.imagenes.mini)}" alt="${esc(p.nombre)}" loading="lazy">`).join("")}</div>
            <h3>${esc(k.nombre)}</h3><p>${esc(k.frase)}</p>
            <ul>${ps.map((p) => `<li><a href="/${p.slug}">${esc(p.nombre)}</a><span>${cop(p.precio)}</span></li>`).join("")}</ul>
            <div class="total"><span>Total del ritual</span><b>${cop(ps.reduce((s, p) => s + p.precio, 0))}</b></div>
            <button class="btn btn-gold btn-block" data-kit="${ps.map((p) => p.slug).join(",")}">Agregar ritual completo</button>
          </div>`;
  }).join("");
  const reviews = (ct.resenas || []).filter((r) => r.visible !== false && r.texto);
  const ld = [orgLd(c), { "@context": "https://schema.org", "@type": "WebSite", name: c.sitio.nombre, url: c.sitio.url, inLanguage: "es-CO" },
    { "@context": "https://schema.org", "@type": "ItemList", name: "Productos " + c.sitio.nombre, itemListElement: P.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(c, "/" + p.slug), name: p.nombre })) },
    faqLd(ct.faq)];
  const cifra = (v) => esc(v).replace(/^([\d.,]+)(.*)$/, (m, a, b) => b ? `${a}<span style="font-size:1rem;color:var(--gold-2)">${b}</span>` : a);
  let out = head(c, { title: ct.seo.titulo, desc: ct.seo.descripcion, canonical: c.sitio.url.replace(/\/$/, "") + "/", og: abs(c, star ? star.imagenes.og : "/assets/img/nutrell-logo.png"), ld });
  out += header(c);
  out += `
  <main>
    <section class="hero">
      <div class="hero-grain"></div>
      <div class="container hero-grid">
        <div>
          <span class="eyebrow reveal">${esc(h.etiqueta)}</span>
          <h1 class="reveal d1">${esc(h.titulo)} <em class="gold">${esc(h.destacado)}</em></h1>
          <p class="lead reveal d2">${md(h.texto)}</p>
          <div class="hero-ctas reveal d3">
            <a href="#coleccion" class="btn btn-gold">${esc(h.boton1)} ${I.arrow}</a>
            <a href="#objetivos" class="btn btn-ghost">${esc(h.boton2)}</a>
          </div>
          <div class="hero-proof reveal d3">${(h.cifras || []).slice(0, 3).map((x) => `<div class="proof-item"><strong>${cifra(x.valor)}</strong><span>${esc(x.texto)}</span></div>`).join("")}</div>
        </div>
        <div class="hero-visual reveal d2">
          <div class="lineup fan">
            ${fanHtml}
            <div class="float-badge fb-1"><span class="dot">${I.leaf}</span><div>Ingredientes naturales<small>Plantas · frutas · hongos</small></div></div>
            <div class="float-badge fb-2"><span class="dot">${I.drop}</span><div>Endulzado con stevia<small>Sin azúcar añadida</small></div></div>
            ${h.sello ? `<div class="price-tag"><small>Hasta</small><b>${esc(h.sello)}</b><small>Lanzamiento</small></div>` : ""}
          </div>
        </div>
      </div>
    </section>

    <div class="marquee" aria-hidden="true"><div class="marquee-track">${(P.map((p) => `<span>${esc(p.nombre)}</span>`).join("")).repeat(2)}</div></div>

    <section class="perks">
      <div class="container">
        <div class="perks-grid reveal">
          <div class="perk">${I.truck}<div><b>Envíos a toda Colombia</b><span>Gratis desde ${cop(c.sitio.envioGratisDesde)}</span></div></div>
          <div class="perk">${I.card}<div><b>Pago contra entrega</b><span>Pagas cuando lo recibes</span></div></div>
          <div class="perk">${I.shield}<div><b>Compra 100% segura</b><span>Tus datos protegidos</span></div></div>
          <div class="perk">${I.chat}<div><b>Asesoría personalizada</b><span>Te acompañamos por WhatsApp</span></div></div>
        </div>
      </div>
    </section>

    <section class="section" id="objetivos">
      <div class="container">
        <div class="section-head"><span class="eyebrow reveal">Compra por objetivo</span><h2 class="reveal d1">¿Qué quieres <em class="gold">nutrir hoy?</em></h2></div>
        <div class="cats">${cats}</div>
      </div>
    </section>

    <section class="section" id="coleccion" style="padding-top:0">
      <div class="container">
        <div class="section-head center">
          <span class="eyebrow reveal">La colección</span>
          <h2 class="reveal d1">${esc(ct.coleccion.titulo)} <em class="gold">${esc(ct.coleccion.destacado)}</em></h2>
          <p class="lead reveal d2">${esc(ct.coleccion.texto)}</p>
        </div>
        <div class="filters reveal" role="tablist" aria-label="Filtrar productos">${filters}</div>
        <div class="grid-products">
          ${P.map((p, i) => pcard(c, p, i % 4)).join("\n          ")}
        </div>
      </div>
    </section>
${star ? `
    <section class="section" style="padding-top:0">
      <div class="container spot">
        <a href="/${star.slug}" class="stage reveal" style="--accent-soft:${esc(star.tema.suave)}" aria-label="Ver ${esc(star.nombre)}">
          <img class="cut" src="${esc(star.imagenes.principal)}" alt="${esc(star.nombre)} Nutrell" loading="lazy">
        </a>
        <div class="featured-info reveal d1">
          <span class="eyebrow">Producto estrella</span>
          <h2>${esc(star.h1[0])} <em class="gold">${esc(star.h1[1])}</em></h2>
          <p class="lead">${md(star.descripcion[0] || star.resumen)}</p>
          <ul class="check-list">${star.destacados.slice(0, 4).map((d) => `<li><span>${esc(d)}</span></li>`).join("")}</ul>
          <div class="price"><span class="now">${cop(star.precio)}</span>${star.antes > star.precio ? `<span class="was">${cop(star.antes)}</span><span class="save">-${offPct(star)}%</span>` : ""}</div>
          <div class="actions">${soldOut(star) ? '<span class="btn btn-outline" aria-disabled="true">Agotado</span>' : `<button class="btn btn-gold" data-add="${star.slug}">Agregar al carrito</button>`}<a href="/${star.slug}" class="btn btn-outline">Ver detalles</a></div>
        </div>
      </div>
    </section>` : ""}
${kits ? `
    <section class="section dark" id="rituales">
      <div class="container">
        <div class="section-head center">
          <span class="eyebrow reveal">Rituales Nutrell</span>
          <h2 class="reveal d1">Combina y <em class="gold">potencia tu rutina</em></h2>
          <p class="lead reveal d2">Combinaciones pensadas para cada objetivo. Agrégalas en un solo clic y suma para tu envío gratis.</p>
        </div>
        <div class="kits">${kits}</div>
      </div>
    </section>` : ""}

    <section class="section">
      <div class="container">
        <div class="section-head center"><span class="eyebrow reveal">La promesa Nutrell</span><h2 class="reveal d1">Lo que nunca <em class="gold">negociamos</em></h2></div>
        <div class="promise reveal">${ct.promesa.slice(0, 4).map((x, i) => `<div><span class="n">${["I.", "II.", "III.", "IV."][i]}</span><h3>${esc(x.titulo)}</h3><p>${esc(x.texto)}</p></div>`).join("")}</div>
      </div>
    </section>
${reviews.length ? `
    <section class="section" style="padding-top:0">
      <div class="container">
        <div class="section-head"><span class="eyebrow reveal">Comunidad Nutrell</span><h2 class="reveal d1">Lo que dicen <em class="gold">nuestros clientes</em></h2></div>
        <div class="reviews">${reviews.map((r, i) => `<article class="review reveal${i % 3 ? ` d${i % 3}` : ""}"><span class="stars">${"★".repeat(Math.max(1, Math.min(5, r.estrellas || 5)))}</span><p>“${esc(r.texto)}”</p><div class="who"><span class="avatar">${esc(r.nombre.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase())}</span><div><b>${esc(r.nombre)}</b></div></div></article>`).join("")}</div>
      </div>
    </section>` : ""}

    <section class="section" id="faq" style="padding-top:0">
      <div class="container faq-grid">
        <div class="section-head" style="align-content:start">
          <span class="eyebrow reveal">Preguntas frecuentes</span>
          <h2 class="reveal d1">Resolvemos <em class="gold">tus dudas</em></h2>
          <p class="lead reveal d2">¿Tienes otra pregunta? Escríbenos y una asesora te responde.</p>
          <div class="reveal d3"><a href="#" data-wa class="btn btn-wa">${I.wa}Hablar con una asesora</a></div>
        </div>
        <div class="faq">${faqHtml(ct.faq)}</div>
      </div>
    </section>

    <section>
      <div class="container">
        <div class="cta-final reveal">
          <div>
            <span class="eyebrow">Club Nutrell</span>
            <h2 style="margin:16px 0 14px">${esc(ct.club.titulo)}</h2>
            <p class="lead">${esc(ct.club.texto)}</p>
            <form class="newsletter" style="margin-top:26px" data-code="${esc(ct.club.codigo)}">
              <label class="sr-only" for="nl-email">Correo electrónico</label>
              <input id="nl-email" type="email" required placeholder="Tu correo electrónico">
              <button class="btn btn-gold" type="submit">Quiero mi descuento</button>
            </form>
          </div>
          ${ct.club.codigo ? `<div class="code-box"><small style="letter-spacing:.2em;text-transform:uppercase;color:var(--gold-2)">Tu código</small><b class="gold-text">${esc(ct.club.codigo)}</b><small style="color:rgba(255,255,255,.6)">Aplícalo al finalizar tu compra</small></div>` : ""}
        </div>
      </div>
    </section>
  </main>
`;
  return out + footer(c);
}

// ---------------------------------------------------------------- PRODUCTO
export function renderProduct(c, p) {
  const cat = c.categorias.find((x) => x.id === p.categoria) || { nombre: "Productos", id: "" };
  const s = p.slug, im = p.imagenes, out = soldOut(p);
  const sabor = p.sabor ? (p.sabor === "Natural" ? "natural" : p.sabor) : "";
  const slides = [["stage", im.principal, `${p.nombre} ${p.tamano} Nutrell — vista frontal`, im.mini || im.principal],
    ["photo", im.foto, `Foto de ${p.nombre} Nutrell`, im.foto], ["stage", im.d1, `Detalle de la etiqueta de ${p.nombre}`, im.d1], ["stage", im.d2, `Detalle de ingredientes de ${p.nombre}`, im.d2]].filter((x) => x[1]);
  let slidesHtml = slides.map(([k, src, alt], i) => `<div class="slide ${k}"><img src="${esc(src)}" alt="${esc(alt)}"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}></div>`).join("");
  const hasInfo = p.cifra && p.cifra[0];
  if (hasInfo) slidesHtml += `<div class="slide info-slide"><span class="eyebrow" style="color:var(--gold-2)">${esc(p.nombre)}</span><p class="big gold-text">${esc(p.cifra[0])}</p><h3>${esc(p.cifra[1])}</h3><ul>${p.destacados.map((d) => `<li><span>${esc(d)}</span><b>✓</b></li>`).join("")}</ul></div>`;
  const thumbs = slides.map(([k, , , t], i) => `<button class="thumb ${k}" aria-label="Imagen ${i + 1}"><img src="${esc(t)}" alt="" loading="lazy"></button>`).join("") + (hasInfo ? `<button class="thumb info-thumb" aria-label="Resumen">${esc(p.cifra[0])}</button>` : "");
  const unit = p.formato === "Sobre" ? ["sobre", "sobres"] : p.formato === "Líquido" ? ["frasco", "frascos"] : ["tarro", "tarros"];
  const packs = p.packs.map((pk, i) => {
    const u = Number(pk.unidades), off = Number(pk.descuento);
    const flag = i === 1 ? '<span class="chip chip-grape flag">Favorito</span>' : i === 2 ? '<span class="chip chip-dark flag">Mejor precio</span>' : "";
    const name = u === 1 ? `1 ${unit[0]}` : `${u} ${unit[1]}${off ? ` · ahorra ${off}%` : ""}`;
    return `<label class="pack-opt"><input type="radio" name="pack" value="${u}"${i === 0 ? " checked" : ""}>${flag}<span class="radio"></span><span><b>${name}</b><small>${esc(pk.texto)}</small></span><span class="p" data-pack-price="${u}"></span></label>`;
  }).join("");
  const libre = p.libreDe.length ? `Libre de ${p.libreDe.map((x) => x.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " y $1")}. ` : "";
  let ingr = `<article class="ingr hero-ingr reveal"><span class="tag">Fórmula</span><p class="big-num gold-text">${esc(p.cifra[0])}</p><h3>${esc(p.cifra[1])}</h3><p>${esc(p.resumen)}</p></article>`;
  ingr += p.ingredientes.map((x, i) => `<article class="ingr reveal${i % 3 ? ` d${i % 3}` : ""}"><div class="mono">${esc((x.nombre || "?")[0])}</div><span class="tag">${esc(x.tag)}</span><h3>${esc(x.nombre)}</h3><p>${esc(x.texto)}</p></article>`).join("");
  const free = `<div class="free-row reveal">${p.libreDe.map((x) => `<span class="free-pill">Sin <s>${esc(x)}</s></span>`).join("")}<span class="free-pill">Endulzado con stevia</span></div>`;
  const steps = p.pasos.map((x, i) => `<div class="step reveal${i ? ` d${i}` : ""}"><div class="ico">${[I.drop, I.leaf, I.check][i % 3]}</div><h3>${esc(x.titulo)}</h3><p>${esc(x.texto)}</p></div>`).join("");
  const faqs = [...p.faq, { pregunta: "¿Cómo pago y cuánto tarda el envío?", respuesta: `Puedes pagar con ${c.metodosPago.join(", ")}. Enviamos a toda Colombia, gratis desde ${cop(c.sitio.envioGratisDesde)}. El tiempo de entrega depende de tu ciudad.` }];
  const P = visibles(c);
  let related = P.filter((x) => x.categoria === p.categoria && x !== p); related = [...related, ...P.filter((x) => !related.includes(x) && x !== p)].slice(0, 4);
  const canonical = abs(c, "/" + s);
  const pk2 = p.packs[1];
  const ld = [orgLd(c),
    { "@context": "https://schema.org", "@type": "Product", name: p.nombre, image: [abs(c, im.principal), im.foto && abs(c, im.foto)].filter(Boolean), description: p.descripcion.map(strip).join(" "), sku: "NUT-" + s.toUpperCase(), brand: { "@type": "Brand", name: c.sitio.nombre }, category: cat.nombre, size: p.tamano,
      offers: { "@type": "Offer", url: canonical, priceCurrency: "COP", price: p.precio, availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition", seller: { "@type": "Organization", name: c.sitio.nombre } } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inicio", item: abs(c, "/") }, { "@type": "ListItem", position: 2, name: cat.nombre, item: abs(c, "/#coleccion") }, { "@type": "ListItem", position: 3, name: p.nombre, item: canonical }] },
    faqLd(faqs)];
  const t = p.tema;
  let html = head(c, { title: p.seoTitulo || `${p.nombre} | ${c.sitio.nombre}`, desc: p.seoDescripcion || p.resumen, canonical, og: abs(c, im.og || im.principal), ld, style: `--accent:${esc(t.acento)};--accent-soft:${esc(t.suave)};--accent-dark:${esc(t.oscuro)}` });
  html += header(c);
  html += `
  <main>
    <div class="container">
      <nav class="breadcrumb" aria-label="Ruta"><a href="/">Inicio</a><span>/</span><a href="/#coleccion">${esc(cat.nombre)}</a><span>/</span><span style="color:var(--ink)">${esc(p.nombre)}</span></nav>
      <div class="pdp">
        <div class="gallery">
          <div class="gallery-main" aria-roledescription="carrusel">
            <div class="chips">${out ? '<span class="chip chip-dark">Agotado</span>' : p.etiqueta ? `<span class="chip chip-dark">${esc(p.etiqueta)}</span>` : ""}${offPct(p) ? `<span class="chip chip-grape" style="background:var(--accent)">-${offPct(p)}%</span>` : ""}</div>
            <div class="slides">${slidesHtml}</div>
            <button class="g-nav prev" aria-label="Imagen anterior">${I.prev}</button>
            <button class="g-nav next" aria-label="Imagen siguiente">${I.next}</button>
            <div class="g-dots"></div><span class="g-count">1 / ${slides.length + (hasInfo ? 1 : 0)}</span>
          </div>
          <div class="thumbs" aria-label="Miniaturas">${thumbs}</div>
        </div>

        <div class="buybox" data-product="${s}">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="chip cat-chip">${esc(cat.nombre)}</span>${p.tamano ? `<span class="chip chip-soft">${esc(p.tamano)}</span>` : ""}${sabor ? `<span class="chip chip-soft">Sabor ${esc(sabor)}</span>` : ""}</div>
          <h1>${esc(p.h1[0])} <em class="gold">${esc(p.h1[1])}</em></h1>
          <p class="sub">${esc(p.subtitulo)}</p>
          <div class="price"><span class="now" data-price>${cop(p.precio)}</span><span class="was" data-was>${p.antes > p.precio ? cop(p.antes) : ""}</span><span class="save" data-save></span></div>
          ${p.destacados.length ? `<div class="hl-grid">${p.destacados.map((d) => `<div class="hl">${I.check}${esc(d)}</div>`).join("")}</div>` : ""}
          ${out ? `<div class="urgency">Producto agotado temporalmente. Escríbenos y te avisamos cuando llegue.</div>` : `<div class="urgency" data-countdown-wrap><span class="live"></span><span>Precio de lanzamiento termina en</span> <span class="countdown" data-countdown></span></div>`}
          ${p.stock !== null && p.stock !== "" && !out && Number(p.stock) <= 10 ? `<p class="low-stock">¡Solo quedan ${Number(p.stock)} unidades!</p>` : ""}
          <div${p.packs.length < 2 ? " hidden" : ""}>
            <div class="opt-label">Elige tu pack <span>Entre más llevas, más ahorras</span></div>
            <div class="pack-opts">${packs}</div>
          </div>
          <div class="buy-row">
            <div class="qty" aria-label="Cantidad"><button data-step="-1" aria-label="Restar">−</button><span data-qty>1</span><button data-step="1" aria-label="Sumar">+</button></div>
            <button class="btn btn-gold" data-add-pdp${out ? " disabled" : ""}>${out ? "Agotado" : "Agregar al carrito"}</button>
          </div>
          <button class="btn btn-wa btn-block" data-wa-pdp style="margin-top:-10px">${I.wa}${out ? "Avísame cuando llegue" : "Comprar por WhatsApp · contra entrega"}</button>
          <p class="delivery">${I.truck}<span>Envío a toda Colombia · <b>gratis desde ${cop(c.sitio.envioGratisDesde)}</b></span></p>
          <div class="trust"><div>${I.card}Pago contra entrega</div><div>${I.shield}Compra segura</div><div>${I.chat}Asesoría experta</div></div>
          <div class="acc">
            <details open><summary>Descripción</summary><div class="answer">${p.descripcion.map((d) => `<p>${md(d)}</p>`).join("")}</div></details>
            ${p.ingredientes.length ? `<details><summary>Ingredientes</summary><div class="answer"><ul>${p.ingredientes.map((x) => `<li><b>${esc(x.nombre)}:</b> ${esc(x.texto)}</li>`).join("")}</ul><p style="margin-top:10px">${libre}Consulta la lista completa de ingredientes y la tabla nutricional en el empaque.</p></div></details>` : ""}
            ${p.pasos.length ? `<details><summary>Modo de uso</summary><div class="answer">${esc(p.pasos.map((x) => x.texto).join(" "))}</div></details>` : ""}
            <details><summary>Advertencias</summary><div class="answer">${esc(p.advertencias)} Mantener fuera del alcance de los niños, en lugar fresco y seco. Este producto no es un medicamento.</div></details>
            <details><summary>Envíos y pagos</summary><div class="answer">Enviamos a toda Colombia. Paga con ${esc(c.metodosPago.join(", "))}. Envío gratis en compras desde ${cop(c.sitio.envioGratisDesde)}.</div></details>
          </div>
        </div>
      </div>
    </div>
${p.ingredientes.length ? `
    <section class="section dark pdp-dark">
      <div class="container">
        <div class="section-head center">
          <span class="eyebrow reveal">Dentro de cada ${p.formato === "Sobre" ? "sobre" : "porción"}</span>
          <h2 class="reveal d1">Ingredientes <em class="gold">protagonistas</em></h2>
          <p class="lead reveal d2">${esc(p.resumen)}</p>
        </div>
        <div class="ingr-grid">${ingr}</div>
        ${free}
      </div>
    </section>` : ""}
${steps ? `
    <section class="section">
      <div class="container">
        <div class="section-head center"><span class="eyebrow reveal">Tu ritual diario</span><h2 class="reveal d1">Así se toma <em class="gold">${esc(p.h1[0])}</em></h2></div>
        <div class="steps">${steps}</div>
      </div>
    </section>` : ""}
${pk2 && !out ? `
    <section class="section" style="padding-top:${steps ? 0 : ""}">
      <div class="container">
        <div class="mini-banner reveal" style="background:linear-gradient(120deg, var(--accent) 0%, var(--accent-dark) 100%)">
          <div>
            <span class="eyebrow" style="color:#fff">Pack favorito</span>
            <h2 style="margin-top:12px">Lleva ${pk2.unidades}${pk2.descuento ? ` y ahorra ${pk2.descuento}%` : ""} <em class="gold">en tu ritual</em></h2>
            <p>La constancia es el secreto. Asegura tu rutina sin interrupciones.</p>
          </div>
          <button class="btn btn-gold" data-add="${s}" data-units="${pk2.unidades}">Agregar pack x${pk2.unidades}</button>
        </div>
      </div>
    </section>` : ""}

    <section class="section"${pk2 ? ' style="padding-top:0"' : ""}>
      <div class="container faq-grid">
        <div class="section-head" style="align-content:start">
          <span class="eyebrow reveal">Preguntas frecuentes</span>
          <h2 class="reveal d1">Todo sobre <em class="gold">${esc(p.nombre.split(" ")[0])}</em></h2>
          <div class="reveal d2"><a href="#" data-wa="¡Hola Nutrell! Tengo una pregunta sobre ${esc(p.nombre)}" class="btn btn-wa">${I.wa}Preguntar a una asesora</a></div>
        </div>
        <div class="faq">${faqHtml(faqs)}</div>
      </div>
    </section>
${related.length ? `
    <section class="section related" style="padding-top:0">
      <div class="container">
        <div class="section-head"><span class="eyebrow reveal">Completa tu ritual</span><h2 class="reveal d1">También te puede <em class="gold">gustar</em></h2></div>
        <div class="grid-products">${related.map((x, i) => pcard(c, x, i)).join("")}</div>
      </div>
    </section>` : ""}
  </main>
  <div class="sticky-atc">
    <div class="container inner">
      <img src="${esc(im.mini)}" alt="">
      <div class="t"><b>${esc(p.nombre)}${p.tamano ? " · " + esc(p.tamano) : ""}</b><span data-sticky-price>${cop(p.precio)}</span></div>
      <button class="btn btn-gold" data-add-pdp${out ? " disabled" : ""}>${out ? "Agotado" : "Agregar"}</button>
    </div>
  </div>
  <div class="lightbox" role="dialog" aria-label="Imagen ampliada"><button class="icon-btn close" aria-label="Cerrar">${I.x}</button><img alt="Imagen del producto ampliada"></div>
`;
  return html + footer(c);
}

export function render404(c) {
  let h = head(c, { title: `Página no encontrada | ${c.sitio.nombre}`, desc: c.contenido.seo.descripcion, canonical: abs(c, "/"), og: abs(c, "/assets/img/nutrell-logo.png") });
  h = h.replace('content="index, follow, max-image-preview:large"', 'content="noindex"');
  h += header(c);
  h += `<main><section class="section"><div class="container" style="text-align:center;display:grid;gap:18px;justify-items:center"><span class="eyebrow">Error 404</span><h1>Esta página <em class="gold">no existe</em></h1><p class="lead">Puede que el producto ya no esté disponible. Mira nuestra colección.</p><a class="btn btn-gold" href="/#coleccion">Ver productos</a></div></section>
  <section class="section" style="padding-top:0"><div class="container"><div class="grid-products">${visibles(c).slice(0, 4).map((p, i) => pcard(c, p, i)).join("")}</div></div></section></main>`;
  return h + footer(c);
}

export function renderSitemap(c) {
  const d = (c.actualizado || new Date().toISOString()).slice(0, 10);
  const urls = ["/", ...visibles(c).map((p) => "/" + p.slug)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(abs(c, u))}</loc><lastmod>${d}</lastmod></url>`).join("\n")}\n</urlset>\n`;
}
export const renderRobots = (c) => `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${abs(c, "/sitemap.xml")}\n`;
