// Páginas del programa de mayoristas (/mayoristas), portal (/mayoristas/portal) y maquila (/maquila).
// Todo el contenido se edita en el panel → Mayoristas.
import { head, header, footer, I, esc, cop, abs } from "./render.js";

const VER = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.NUTRELL_VER || "dev").slice(0, 8);
const withScript = (html) => html.replace("</body>", `  <script src="/assets/js/mayoristas.js?v=${VER}"></script>\n</body>`);
const ICO = {
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12V4a1 1 0 011-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>',
};
const BEN_ICO = [ICO.tag, ICO.user, ICO.chart, ICO.box];
const MAQ_ICO = [I.leaf, I.drop, I.shield, I.chat];
const d = (i) => (i % 4 ? ` d${i % 4}` : "");
const faqLd = (faq) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.pregunta, acceptedAnswer: { "@type": "Answer", text: f.respuesta } })) });
const faqHtml = (faq) => faq.map((f, i) => `<details class="reveal"${i === 0 ? " open" : ""}><summary>${esc(f.pregunta)}<span class="pm">+</span></summary><div class="answer">${esc(f.respuesta)}</div></details>`).join("");
const cifra = (v) => esc(v).replace(/^([\d.,]+)(.+)$/, (m, a, b) => `${a}<span style="font-size:1rem;color:var(--gold-2)">${b}</span>`);
const opts = (arr) => arr.map((x) => `<option>${esc(x)}</option>`).join("");

// ---------------------------------------------------------------- MAYORISTAS
export function renderWholesale(c) {
  const cfg = c.mayoristas, niveles = cfg.niveles;
  const maxD = Math.max(...niveles.map((n) => Number(n.descuento) || 0));
  const minMin = Math.min(...niveles.map((n) => Number(n.minimo) || 0));
  const sub = (t) => String(t || "").replace(/\{descuento\}/g, maxD);
  let h = head(c, { title: `Mayoristas y distribuidores | ${c.sitio.nombre}`, desc: `Vende productos ${c.sitio.nombre} con precios exclusivos de hasta ${maxD}% de descuento, asesoría comercial y despachos a toda Colombia.`, canonical: abs(c, "/mayoristas"), og: abs(c, "/assets/img/p/colageno-marino-og.jpg"), ld: [faqLd(cfg.faq)] });
  h += header(c);
  const prods = c.productos.filter((p) => p.activo !== false).slice(0, 5);
  const maq = c.maquila || {};
  h += `
  <main class="ws">
    <section class="hero ws-hero">
      <div class="hero-grain"></div>
      <div class="container hero-grid">
        <div>
          <span class="eyebrow reveal">Programa de mayoristas</span>
          <h1 class="reveal d1">${esc(cfg.titulo)} <em class="gold">${esc(cfg.destacado)}</em></h1>
          <p class="lead reveal d2">${esc(cfg.texto)}</p>
          <div class="hero-ctas reveal d3">
            <a href="#solicitud" class="btn btn-gold">Quiero ser distribuidor ${I.arrow}</a>
            <a href="/mayoristas/portal" class="btn btn-ghost">${I.lock}Ya soy mayorista · Ingresar</a>
          </div>
          <div class="hero-proof reveal d3">
            <div class="proof-item"><strong>${maxD}<span style="font-size:1rem;color:var(--gold-2)">%</span></strong><span>descuento máximo</span></div>
            <div class="proof-item"><strong>${niveles.length}</strong><span>niveles de socio</span></div>
            <div class="proof-item"><strong>24<span style="font-size:1rem;color:var(--gold-2)">h</span></strong><span>respuesta a tu solicitud</span></div>
          </div>
        </div>
        <div class="hero-visual reveal d2">
          <div class="ws-stack">${prods.map((p, i) => `<img src="${esc(p.imagenes.mini)}" alt="${esc(p.nombre)}" style="--i:${i - Math.floor(prods.length / 2)}">`).join("")}</div>
          <div class="ws-card"><small>Tu precio mayorista</small><b>Hasta ${maxD}% OFF</b><span>Pedidos desde ${cop(minMin)}</span></div>
        </div>
      </div>
    </section>
${cfg.beneficios.length ? `
    <section class="section">
      <div class="container">
        <div class="section-head center"><span class="eyebrow reveal">Beneficios</span><h2 class="reveal d1">Crece con una marca <em class="gold">que se vende sola</em></h2></div>
        <div class="ws-benefits">${cfg.beneficios.map((b, i) => `<div class="reveal${d(i)}"><span class="ic">${BEN_ICO[i % 4]}</span><h3>${esc(b.titulo)}</h3><p>${esc(sub(b.texto))}</p></div>`).join("")}</div>
      </div>
    </section>` : ""}

    <section class="section dark" style="padding-top:clamp(60px,8vw,110px)">
      <div class="container">
        <div class="section-head center"><span class="eyebrow reveal">Niveles</span><h2 class="reveal d1">Entre más vendes, <em class="gold">más ganas</em></h2><p class="lead reveal d2">Empiezas en un nivel según tu negocio y subes a medida que creces con nosotros.</p></div>
        <div class="ws-tiers">${niveles.map((n, i) => `<div class="ws-tier reveal${i === 1 ? " best" : ""}${d(i)}">${i === niveles.length - 1 && niveles.length > 1 ? '<span class="chip chip-grape ribbon">Máximo beneficio</span>' : ""}<span class="t-name">${esc(n.nombre)}</span><p class="t-desc">${esc(n.descripcion || "")}</p><div class="t-off"><b>${Number(n.descuento)}%</b><span>de descuento</span></div><ul><li>Pedido mínimo <b>${cop(n.minimo)}</b></li><li>Portal de pedidos 24/7</li><li>Asesoría comercial</li></ul></div>`).join("")}</div>
      </div>
    </section>
${cfg.pasos.length ? `
    <section class="section">
      <div class="container">
        <div class="section-head center"><span class="eyebrow reveal">Cómo funciona</span><h2 class="reveal d1">Empieza en <em class="gold">${cfg.pasos.length} pasos</em></h2></div>
        <div class="steps">${cfg.pasos.map((p, i) => `<div class="step reveal${d(i)}"><div class="ico">${[ICO.user, I.check, ICO.box][i % 3]}</div><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></div>`).join("")}</div>
      </div>
    </section>` : ""}
${maq.activo !== false ? `
    <section class="section maq-teaser-wrap" style="padding-bottom:0">
      <div class="container">
        <a href="/maquila" class="maq-teaser reveal">
          ${maq.imagen ? `<img class="mt-img" src="${esc(maq.imagen)}" alt="Maquila ${esc(c.sitio.nombre)}" loading="lazy">` : ""}
          <div><span class="eyebrow">Maquila · Fabricación para terceros</span><h2>¿Quieres <em class="gold">tu propia marca</em> de suplementos?</h2><p>Desarrollamos, fabricamos, envasamos y etiquetamos tu producto con la calidad ${esc(c.sitio.nombre)}.</p>
          <span class="btn btn-gold">Conocer el servicio de maquila ${I.arrow}</span></div>
        </a>
      </div>
    </section>` : ""}

    <section class="section" id="solicitud">
      <div class="container ws-apply">
        <div class="reveal">
          <span class="eyebrow">Solicitud</span>
          <h2 style="margin:14px 0 14px">Únete a la red <em class="gold">${esc(c.sitio.nombre)}</em></h2>
          <p class="lead">Completa el formulario. Con tu correo y la contraseña que crees aquí entrarás al portal mayorista cuando te aprobemos.</p>
          ${cfg.requisitos.length ? `<ul class="check-list" style="margin-top:22px">${cfg.requisitos.map((r) => `<li><span>${esc(r)}</span></li>`).join("")}</ul>` : ""}
          <p style="margin-top:22px"><a href="#" data-wa="Hola Nutrell, quiero información sobre el programa de mayoristas" class="btn btn-wa">${I.wa}Hablar con un asesor</a></p>
        </div>
        <form class="ws-form reveal d1" data-ws-form novalidate>
          <div class="fld-row"><label class="fld"><span>Nombre del negocio *</span><input name="empresa" required autocomplete="organization"></label><label class="fld"><span>NIT o cédula</span><input name="nit"></label></div>
          <label class="fld"><span>Tipo de negocio *</span><select name="tipo" required><option value="">Selecciona…</option>${opts(cfg.tiposNegocio)}</select></label>
          <div class="fld-row"><label class="fld"><span>Nombre de contacto *</span><input name="contacto" required autocomplete="name"></label><label class="fld"><span>Cargo</span><input name="cargo" placeholder="Propietario, compras…"></label></div>
          <div class="fld-row"><label class="fld"><span>Celular / WhatsApp *</span><input name="telefono" type="tel" required autocomplete="tel" inputmode="tel"></label><label class="fld"><span>Ciudad *</span><input name="ciudad" required autocomplete="address-level2"></label></div>
          <div class="fld-row"><label class="fld"><span>Departamento</span><input name="departamento" autocomplete="address-level1"></label><label class="fld"><span>Dirección del negocio</span><input name="direccion" autocomplete="street-address"></label></div>
          <p class="co-title">¿Dónde vendes?</p>
          <div class="ws-chips">${cfg.canales.map((x) => `<label><input type="checkbox" name="canales" value="${esc(x)}"><span>${esc(x)}</span></label>`).join("")}</div>
          <label class="fld"><span>Compra mensual estimada</span><select name="volumen"><option value="">Selecciona…</option><option>Menos de $500.000</option><option>$500.000 – $1.500.000</option><option>$1.500.000 – $5.000.000</option><option>Más de $5.000.000</option></select></label>
          <label class="fld"><span>Instagram o página web</span><input name="sitio" placeholder="@tunegocio"></label>
          <label class="fld"><span>Cuéntanos de tu negocio</span><textarea name="mensaje" rows="3" placeholder="¿Qué productos te interesan? ¿Cuántos puntos de venta tienes?"></textarea></label>
          <p class="co-title">Tu acceso al portal</p>
          <div class="fld-row"><label class="fld"><span>Correo (usuario) *</span><input name="email" type="email" required autocomplete="email"></label><label class="fld"><span>Crea una contraseña *</span><input name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="Mínimo 8 caracteres"></label></div>
          <label class="ws-terms"><input type="checkbox" name="acepto" required><span>Autorizo el tratamiento de mis datos para gestionar mi solicitud como mayorista.</span></label>
          <p class="co-error" data-ws-error></p>
          <button class="btn btn-gold btn-block btn-pay" type="submit">Enviar solicitud ${I.arrow}</button>
        </form>
      </div>
    </section>
${cfg.faq.length ? `
    <section class="section" style="padding-top:0">
      <div class="container faq-grid">
        <div class="section-head" style="align-content:start"><span class="eyebrow reveal">Preguntas frecuentes</span><h2 class="reveal d1">Todo sobre el <em class="gold">programa</em></h2></div>
        <div class="faq">${faqHtml(cfg.faq)}</div>
      </div>
    </section>` : ""}
  </main>
`;
  return withScript(h + footer(c));
}

export function renderPortal(c) {
  let h = head(c, { title: `Portal mayorista | ${c.sitio.nombre}`, desc: "Ingreso al portal de pedidos para mayoristas Nutrell.", canonical: abs(c, "/mayoristas/portal"), og: abs(c, "/assets/img/nutrell-logo.png") });
  h = h.replace('content="index, follow, max-image-preview:large"', 'content="noindex"');
  h += header(c);
  h += `<main class="portal-wrap"><div class="container"><div class="portal" data-portal><div class="ps-ico loading" style="margin:80px auto"><span class="spin"></span></div></div></div></main>`;
  return withScript(h + footer(c));
}

// ---------------------------------------------------------------- MAQUILA
export function renderMaquila(c) {
  const m = c.maquila;
  const srv = { "@context": "https://schema.org", "@type": "Service", name: "Maquila de suplementos dietarios", serviceType: "Fabricación para terceros (marca blanca)", provider: { "@type": "Organization", name: c.sitio.nombre, url: c.sitio.url }, areaServed: "CO" };
  let h = head(c, { title: m.seoTitulo, desc: m.seoDescripcion, canonical: abs(c, "/maquila"), og: abs(c, m.imagen || "/assets/img/nutrell-logo.png"), ld: [faqLd(m.faq), srv] });
  h += header(c);
  h += `
  <main class="ws">
    <section class="hero maq-hero">
      <div class="hero-grain"></div>
      <div class="container hero-grid">
        <div>
          <span class="eyebrow reveal">${esc(m.etiqueta)}</span>
          <h1 class="reveal d1">${esc(m.titulo)} <em class="gold">${esc(m.destacado)}</em></h1>
          <p class="lead reveal d2">${esc(m.texto)}</p>
          <div class="hero-ctas reveal d3">
            <a href="#cotizar" class="btn btn-gold">Cotizar mi producto ${I.arrow}</a>
            <a href="#" data-wa="Hola Nutrell, quiero información sobre el servicio de maquila" class="btn btn-ghost">${I.wa}Hablar con un asesor</a>
          </div>
          ${m.cifras.length ? `<div class="hero-proof reveal d3">${m.cifras.slice(0, 3).map((x) => `<div class="proof-item"><strong>${cifra(x.valor)}</strong><span>${esc(x.texto)}</span></div>`).join("")}</div>` : ""}
        </div>
        <div class="hero-visual reveal d2">
          ${m.imagen ? `<figure class="maq-photo">
            <div class="mp-frame"><img src="${esc(m.imagen)}" alt="Envases para tu marca: servicio de maquila ${esc(c.sitio.nombre)}" fetchpriority="high"></div>
            <figcaption class="mp-card"><small>Fabricamos para ti</small><b>${esc(m.tarjetaTitulo)}</b><span>${esc(m.tarjetaTexto)}</span></figcaption>
            <span class="mp-chip">${I.check}Tu marca, nuestra experiencia</span>
          </figure>` : ""}
        </div>
      </div>
    </section>
${m.beneficios.length ? `
    <section class="section">
      <div class="container">
        <div class="section-head center"><span class="eyebrow reveal">Por qué fabricar con nosotros</span><h2 class="reveal d1">La experiencia de una marca <em class="gold">que ya vende</em></h2></div>
        <div class="ws-benefits">${m.beneficios.map((b, i) => `<div class="reveal${d(i)}"><span class="ic">${MAQ_ICO[i % 4]}</span><h3>${esc(b.titulo)}</h3><p>${esc(b.texto)}</p></div>`).join("")}</div>
      </div>
    </section>` : ""}

    <section class="maq" id="cotizar">
      <div class="maq-glow"></div>
      <div class="container">
        <div class="maq-head">
          <div class="reveal">
            <span class="eyebrow">Maquila · Fabricación para terceros</span>
            <h2>${esc(m.seccionTitulo)} <em class="gold">${esc(m.seccionDestacado)}</em> ${esc(m.seccionCierre)}</h2>
          </div>
          <p class="lead reveal d1">${esc(m.seccionTexto)}</p>
        </div>
        ${m.servicios.length ? `<div class="maq-grid">${m.servicios.map((x, i) => `<div class="maq-card reveal${d(i)}"><span class="maq-n">${String(i + 1).padStart(2, "0")}</span><h3>${esc(x.titulo)}</h3><p>${esc(x.texto)}</p></div>`).join("")}</div>` : ""}
        <div class="maq-band reveal">
          <div class="maq-formats"><small>Formatos</small><div>${m.formatos.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>
          <div class="maq-steps">${m.proceso.map((x, i) => `<div><b>${i + 1}</b><span>${esc(x)}</span></div>`).join("<i></i>")}</div>
        </div>
        <div class="maq-form-wrap">
          <div class="reveal">
            <h3>${esc(m.formTitulo)}</h3>
            <p>${esc(m.formTexto)}</p>
            <a href="#" data-wa="Hola Nutrell, quiero información sobre maquila para mi marca" class="btn btn-wa">${I.wa}Hablar con un asesor de maquila</a>
          </div>
          <form class="ws-form maq-form reveal d1" data-maq-form novalidate>
            <div class="fld-row"><label class="fld"><span>Empresa o marca *</span><input name="empresa" required autocomplete="organization"></label><label class="fld"><span>Nombre de contacto *</span><input name="contacto" required autocomplete="name"></label></div>
            <div class="fld-row"><label class="fld"><span>Celular / WhatsApp *</span><input name="telefono" type="tel" required inputmode="tel" autocomplete="tel"></label><label class="fld"><span>Correo</span><input name="email" type="email" autocomplete="email"></label></div>
            <div class="fld-row"><label class="fld"><span>¿Qué producto quieres fabricar? *</span><select name="producto" required><option value="">Selecciona…</option>${opts(m.opcionesProducto)}</select></label>
              <label class="fld"><span>Formato</span><select name="formato"><option value="">Selecciona…</option>${opts(m.opcionesFormato)}</select></label></div>
            <div class="fld-row"><label class="fld"><span>Cantidad estimada</span><select name="cantidad"><option value="">Selecciona…</option>${opts(m.opcionesCantidad)}</select></label>
              <label class="fld"><span>¿Ya tienes marca?</span><select name="marca"><option value="">Selecciona…</option><option>Sí, ya tengo marca</option><option>No, quiero crearla</option></select></label></div>
            <label class="fld"><span>Ciudad</span><input name="ciudad" autocomplete="address-level2"></label>
            <label class="fld"><span>Cuéntanos tu proyecto</span><textarea name="mensaje" rows="3" placeholder="Ingredientes, sabor, público objetivo, fecha en que lo necesitas…"></textarea></label>
            <label class="ws-terms"><input type="checkbox" name="acepto" required><span>Autorizo el tratamiento de mis datos para recibir la cotización.</span></label>
            <p class="co-error" data-maq-error></p>
            <button class="btn btn-gold btn-block btn-pay" type="submit">Solicitar cotización ${I.arrow}</button>
          </form>
        </div>
      </div>
    </section>
${m.faq.length ? `
    <section class="section">
      <div class="container faq-grid">
        <div class="section-head" style="align-content:start"><span class="eyebrow reveal">Preguntas frecuentes</span><h2 class="reveal d1">Todo sobre <em class="gold">maquila</em></h2>
          <div class="reveal d2"><a href="/mayoristas" class="btn btn-outline">¿Prefieres distribuir ${esc(c.sitio.nombre)}? Ver programa de mayoristas</a></div></div>
        <div class="faq">${faqHtml(m.faq)}</div>
      </div>
    </section>` : ""}
  </main>
`;
  return withScript(h + footer(c));
}
