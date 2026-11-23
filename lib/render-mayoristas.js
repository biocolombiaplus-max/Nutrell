// Páginas del programa de mayoristas: /mayoristas (pública) y /mayoristas/portal (privada).
import { head, header, footer, I, esc, cop, abs } from "./render.js";

const VER = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.NUTRELL_VER || "dev").slice(0, 8);
const withScript = (html) => html.replace("</body>", `  <script src="/assets/js/mayoristas.js?v=${VER}"></script>\n</body>`);
const ICO = {
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12V4a1 1 0 011-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>',
};
const FAQ = [
  { pregunta: "¿Quiénes pueden ser mayoristas Nutrell?", respuesta: "Tiendas naturistas, droguerías, gimnasios, consultorios y profesionales de la salud, spas, distribuidores y emprendedores que vendan nuestros productos." },
  { pregunta: "¿Cuánto tarda la aprobación?", respuesta: "Revisamos cada solicitud y te respondemos normalmente en 24 a 48 horas hábiles por WhatsApp o correo." },
  { pregunta: "¿Cómo hago mis pedidos?", respuesta: "Una vez aprobado, ingresas al portal mayorista con tu correo y contraseña, ves tus precios exclusivos, armas el pedido por cantidades y lo pagas en línea, por transferencia o con crédito si lo tienes habilitado." },
  { pregunta: "¿Hay pedido mínimo?", respuesta: "Sí, cada nivel tiene un pedido mínimo. Entre más compras, mejor es tu nivel y tu descuento." },
  { pregunta: "¿Cómo es el envío?", respuesta: "Despachamos a toda Colombia. El valor del envío se confirma según la ciudad y el volumen del pedido." },
];

export function renderWholesale(c) {
  const cfg = c.mayoristas, niveles = cfg.niveles;
  const maxD = Math.max(...niveles.map((n) => Number(n.descuento) || 0));
  const minMin = Math.min(...niveles.map((n) => Number(n.minimo) || 0));
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.pregunta, acceptedAnswer: { "@type": "Answer", text: f.respuesta } })) };
  let h = head(c, { title: `Mayoristas, distribuidores y maquila | ${c.sitio.nombre}`, desc: `Vende productos ${c.sitio.nombre} con precios exclusivos de hasta ${maxD}% de descuento, o fabrica tu propia marca de suplementos con nuestro servicio de maquila. Despachos a toda Colombia.`, canonical: abs(c, "/mayoristas"), og: abs(c, "/assets/img/p/colageno-marino-og.jpg"), ld: [faqLd] });
  h += header(c);
  const prods = c.productos.filter((p) => p.activo !== false).slice(0, 5);
  h += `
  <main class="ws">
    <section class="hero ws-hero">
      <div class="hero-grain"></div>
      <div class="container hero-grid">
        <div>
          <span class="eyebrow reveal">Programa de mayoristas</span>
          <h1 class="reveal d1">${esc(cfg.titulo)} <em class="gold">en tu negocio.</em></h1>
          <p class="lead reveal d2">${esc(cfg.texto)}</p>
          <div class="hero-ctas reveal d3">
            <a href="#solicitud" class="btn btn-gold">Quiero ser distribuidor ${I.arrow}</a>
            <a href="/mayoristas/portal" class="btn btn-ghost">${I.lock}Ya soy mayorista · Ingresar</a>
            <a href="/maquila" class="btn btn-ghost">Maquila · Fabrica tu marca</a>
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

    <section class="section">
      <div class="container">
        <div class="section-head center"><span class="eyebrow reveal">Beneficios</span><h2 class="reveal d1">Crece con una marca <em class="gold">que se vende sola</em></h2></div>
        <div class="ws-benefits">
          <div class="reveal"><span class="ic">${ICO.tag}</span><h3>Precios exclusivos</h3><p>Descuentos de hasta ${maxD}% sobre el precio público, según tu nivel.</p></div>
          <div class="reveal d1"><span class="ic">${ICO.user}</span><h3>Asesor comercial</h3><p>Acompañamiento directo por WhatsApp para tus pedidos y tu rotación.</p></div>
          <div class="reveal d2"><span class="ic">${ICO.chart}</span><h3>Material de venta</h3><p>Fotos, fichas y contenidos para tus redes y tu punto de venta.</p></div>
          <div class="reveal d3"><span class="ic">${ICO.box}</span><h3>Portal de pedidos 24/7</h3><p>Pide cuando quieras, paga en línea y consulta el estado de tus despachos.</p></div>
        </div>
      </div>
    </section>

    <section class="section dark" style="padding-top:clamp(60px,8vw,110px)">
      <div class="container">
        <div class="section-head center"><span class="eyebrow reveal">Niveles</span><h2 class="reveal d1">Entre más vendes, <em class="gold">más ganas</em></h2><p class="lead reveal d2">Empiezas en un nivel según tu negocio y subes a medida que creces con nosotros.</p></div>
        <div class="ws-tiers">${niveles.map((n, i) => `<div class="ws-tier reveal${i === 1 ? " best" : ""}${i ? ` d${i}` : ""}">${i === niveles.length - 1 ? '<span class="chip chip-grape ribbon">Máximo beneficio</span>' : ""}<span class="t-name">${esc(n.nombre)}</span><p class="t-desc">${esc(n.descripcion || "")}</p><div class="t-off"><b>${Number(n.descuento)}%</b><span>de descuento</span></div><ul><li>Pedido mínimo <b>${cop(n.minimo)}</b></li><li>Portal de pedidos 24/7</li><li>Asesoría comercial</li></ul></div>`).join("")}</div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head center"><span class="eyebrow reveal">Cómo funciona</span><h2 class="reveal d1">Empieza en <em class="gold">3 pasos</em></h2></div>
        <div class="steps">
          <div class="step reveal"><div class="ico">${ICO.user}</div><h3>Envía tu solicitud</h3><p>Cuéntanos sobre tu negocio y crea tu contraseña de acceso.</p></div>
          <div class="step reveal d1"><div class="ico">${I.check}</div><h3>Te aprobamos</h3><p>Revisamos tu perfil y te asignamos tu nivel y tus precios.</p></div>
          <div class="step reveal d2"><div class="ico">${ICO.box}</div><h3>Haz tus pedidos</h3><p>Ingresa al portal, pide por cantidades y paga como prefieras.</p></div>
        </div>
      </div>
    </section>


    <section class="section maq-teaser-wrap" style="padding-bottom:0">
      <div class="container">
        <a href="/maquila" class="maq-teaser reveal">
          <div><span class="eyebrow">Maquila · Fabricación para terceros</span><h2>¿Quieres <em class="gold">tu propia marca</em> de suplementos?</h2><p>Desarrollamos, fabricamos, envasamos y etiquetamos tu producto con la calidad Nutrell.</p></div>
          <span class="btn btn-gold">Conocer el servicio de maquila ${I.arrow}</span>
        </a>
      </div>
    </section>

    <section class="section" id="solicitud">
      <div class="container ws-apply">
        <div class="reveal">
          <span class="eyebrow">Solicitud</span>
          <h2 style="margin:14px 0 14px">Únete a la red <em class="gold">Nutrell</em></h2>
          <p class="lead">Completa el formulario. Con tu correo y la contraseña que crees aquí entrarás al portal mayorista cuando te aprobemos.</p>
          <ul class="check-list" style="margin-top:22px"><li><span>Negocio formal o en proceso de formalización</span></li><li><span>Punto de venta físico o canal digital activo</span></li><li><span>Compromiso con el pedido mínimo de tu nivel</span></li></ul>
          <p style="margin-top:22px"><a href="#" data-wa="Hola Nutrell, quiero información sobre el programa de mayoristas" class="btn btn-wa">${I.wa}Hablar con un asesor</a></p>
        </div>
        <form class="ws-form reveal d1" data-ws-form novalidate>
          <div class="fld-row"><label class="fld"><span>Nombre del negocio *</span><input name="empresa" required autocomplete="organization"></label><label class="fld"><span>NIT o cédula</span><input name="nit"></label></div>
          <label class="fld"><span>Tipo de negocio *</span><select name="tipo" required><option value="">Selecciona…</option>${cfg.tiposNegocio.map((t) => `<option>${esc(t)}</option>`).join("")}</select></label>
          <div class="fld-row"><label class="fld"><span>Nombre de contacto *</span><input name="contacto" required autocomplete="name"></label><label class="fld"><span>Cargo</span><input name="cargo" placeholder="Propietario, compras…"></label></div>
          <div class="fld-row"><label class="fld"><span>Celular / WhatsApp *</span><input name="telefono" type="tel" required autocomplete="tel" inputmode="tel"></label><label class="fld"><span>Ciudad *</span><input name="ciudad" required autocomplete="address-level2"></label></div>
          <div class="fld-row"><label class="fld"><span>Departamento</span><input name="departamento" autocomplete="address-level1"></label><label class="fld"><span>Dirección del negocio</span><input name="direccion" autocomplete="street-address"></label></div>
          <p class="co-title">¿Dónde vendes?</p>
          <div class="ws-chips">${["Tienda física", "Instagram / Facebook", "WhatsApp", "Página web", "Marketplace", "Consultorio", "Venta directa"].map((x) => `<label><input type="checkbox" name="canales" value="${esc(x)}"><span>${esc(x)}</span></label>`).join("")}</div>
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

    <section class="section" style="padding-top:0">
      <div class="container faq-grid">
        <div class="section-head" style="align-content:start"><span class="eyebrow reveal">Preguntas frecuentes</span><h2 class="reveal d1">Todo sobre el <em class="gold">programa</em></h2></div>
        <div class="faq">${FAQ.map((f, i) => `<details class="reveal"${i === 0 ? " open" : ""}><summary>${esc(f.pregunta)}<span class="pm">+</span></summary><div class="answer">${esc(f.respuesta)}</div></details>`).join("")}</div>
      </div>
    </section>
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


// ---------------------------------------------------------------- MAQUILA (página propia)
const MAQ_FAQ = [{"pregunta": "¿Qué cantidad mínima necesito para fabricar?", "respuesta": "Depende del producto y del formato. Cuéntanos tu proyecto en el formulario y te damos las opciones de cantidades y precios."}, {"pregunta": "¿Pueden crear la fórmula desde cero?", "respuesta": "Sí. Podemos desarrollar una fórmula nueva según tu objetivo, tu público y el sabor que buscas, o ajustar una fórmula que ya tengas."}, {"pregunta": "¿El producto sale con mi marca?", "respuesta": "Sí. El producto se envasa y etiqueta con tu marca. También te acompañamos en el diseño de la etiqueta."}, {"pregunta": "¿Cuánto tarda el proceso?", "respuesta": "Los tiempos dependen del desarrollo, las muestras y el volumen. En la cotización te damos un cronograma estimado de cada etapa."}, {"pregunta": "¿Qué formatos pueden fabricar?", "respuesta": "Mezclas en polvo para bebida instantánea en tarro, bebidas líquidas en frasco y sobres individuales."}];
function maqSection(c) {
  return `    <section class="maq" id="maquila">
      <div class="maq-glow"></div>
      <div class="container">
        <div class="maq-head">
          <div class="reveal">
            <span class="eyebrow">Maquila · Fabricación para terceros</span>
            <h2>Creamos <em class="gold">tu propia marca</em> de suplementos</h2>
          </div>
          <p class="lead reveal d1">Llevamos tu idea de la fórmula al producto terminado: desarrollo, fabricación, envasado y etiquetado con tu marca, con la misma calidad con la que hacemos Nutrell.</p>
        </div>
        <div class="maq-grid">
          \${[
            ["01", "Desarrollo de fórmula", "Diseñamos o ajustamos tu fórmula según el objetivo, el sabor y el público de tu marca."],
            ["02", "Fabricación", "Producimos polvos para bebida instantánea, bebidas líquidas y sobres individuales."],
            ["03", "Envase y etiquetado", "Tarros, frascos y sobres con tu marca. Te acompañamos en el diseño de la etiqueta."],
            ["04", "Acompañamiento", "Orientación en los requisitos del producto y entregas programadas a tu bodega."],
          ].map(([n, t, d], i) => \`<div class="maq-card reveal\${i ? \` d\${i}\` : ""}"><span class="maq-n">\${n}</span><h3>\${t}</h3><p>\${d}</p></div>\`).join("")}
        </div>
        <div class="maq-band reveal">
          <div class="maq-formats"><small>Formatos</small><div><span>Polvos · tarro</span><span>Líquidos · frasco</span><span>Sobres individuales</span><span>Colágenos</span><span>Superalimentos</span><span>Fibras</span></div></div>
          <div class="maq-steps">\${["Brief", "Fórmula", "Muestras", "Producción", "Entrega"].map((x, i) => \`<div><b>\${i + 1}</b><span>\${x}</span></div>\`).join('<i></i>')}</div>
        </div>
        <div class="maq-form-wrap">
          <div class="reveal">
            <h3>Cotiza tu producto</h3>
            <p>Cuéntanos qué quieres fabricar. Un asesor de maquila te contacta para revisar tu proyecto, cantidades y tiempos.</p>
            <a href="#" data-wa="Hola Nutrell, quiero información sobre maquila para mi marca" class="btn btn-wa">\${I.wa}Hablar con un asesor de maquila</a>
          </div>
          <form class="ws-form maq-form reveal d1" data-maq-form novalidate>
            <div class="fld-row"><label class="fld"><span>Empresa o marca *</span><input name="empresa" required autocomplete="organization"></label><label class="fld"><span>Nombre de contacto *</span><input name="contacto" required autocomplete="name"></label></div>
            <div class="fld-row"><label class="fld"><span>Celular / WhatsApp *</span><input name="telefono" type="tel" required inputmode="tel" autocomplete="tel"></label><label class="fld"><span>Correo</span><input name="email" type="email" autocomplete="email"></label></div>
            <div class="fld-row"><label class="fld"><span>¿Qué producto quieres fabricar? *</span><select name="producto" required><option value="">Selecciona…</option><option>Colágeno</option><option>Proteína / batido</option><option>Superalimentos (maca, espirulina…)</option><option>Bebida líquida / tónico</option><option>Fibra / digestivo</option><option>Otro</option></select></label>
              <label class="fld"><span>Formato</span><select name="formato"><option value="">Selecciona…</option><option>Polvo en tarro</option><option>Líquido en frasco</option><option>Sobres</option><option>Aún no lo sé</option></select></label></div>
            <div class="fld-row"><label class="fld"><span>Cantidad estimada</span><select name="cantidad"><option value="">Selecciona…</option><option>Menos de 500 unidades</option><option>500 – 2.000 unidades</option><option>2.000 – 10.000 unidades</option><option>Más de 10.000 unidades</option></select></label>
              <label class="fld"><span>¿Ya tienes marca?</span><select name="marca"><option value="">Selecciona…</option><option>Sí, ya tengo marca</option><option>No, quiero crearla</option></select></label></div>
            <label class="fld"><span>Ciudad</span><input name="ciudad" autocomplete="address-level2"></label>
            <label class="fld"><span>Cuéntanos tu proyecto</span><textarea name="mensaje" rows="3" placeholder="Ingredientes, sabor, público objetivo, fecha en que lo necesitas…"></textarea></label>
            <label class="ws-terms"><input type="checkbox" name="acepto" required><span>Autorizo el tratamiento de mis datos para recibir la cotización.</span></label>
            <p class="co-error" data-maq-error></p>
            <button class="btn btn-gold btn-block btn-pay" type="submit">Solicitar cotización \${I.arrow}</button>
          </form>
        </div>
      </div>
    </section>`;
}
export function renderMaquila(c) {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: MAQ_FAQ.map((f) => ({ "@type": "Question", name: f.pregunta, acceptedAnswer: { "@type": "Answer", text: f.respuesta } })) };
  const srv = { "@context": "https://schema.org", "@type": "Service", name: "Maquila de suplementos dietarios", serviceType: "Fabricación para terceros (marca blanca)", provider: { "@type": "Organization", name: c.sitio.nombre, url: c.sitio.url }, areaServed: "CO" };
  let h = head(c, { title: `Maquila de suplementos y marca blanca en Colombia | ${c.sitio.nombre}`, desc: `Fabricamos tu propia marca de suplementos: desarrollo de fórmula, fabricación de polvos, líquidos y sobres, envasado y etiquetado. Cotiza tu proyecto con ${c.sitio.nombre}.`, canonical: abs(c, "/maquila"), og: abs(c, "/assets/img/banners/colageno.webp"), ld: [ld, srv] });
  h += header(c);
  const prods = c.productos.filter((p) => p.activo !== false).slice(0, 5);
  h += `
  <main class="ws">
    <section class="hero maq-hero">
      <div class="hero-grain"></div>
      <div class="container hero-grid">
        <div>
          <span class="eyebrow reveal">Servicio de maquila · Marca blanca</span>
          <h1 class="reveal d1">Tu marca de suplementos, <em class="gold">fabricada por expertos.</em></h1>
          <p class="lead reveal d2">Te acompañamos de la idea al producto terminado: formulamos, fabricamos, envasamos y etiquetamos con tu marca, con los estándares con los que creamos cada producto Nutrell.</p>
          <div class="hero-ctas reveal d3">
            <a href="#cotizar" class="btn btn-gold">Cotizar mi producto ${I.arrow}</a>
            <a href="#" data-wa="Hola Nutrell, quiero información sobre el servicio de maquila" class="btn btn-ghost">${I.wa}Hablar con un asesor</a>
          </div>
          <div class="hero-proof reveal d3">
            <div class="proof-item"><strong>3</strong><span>formatos de producto</span></div>
            <div class="proof-item"><strong>5</strong><span>etapas acompañadas</span></div>
            <div class="proof-item"><strong>100<span style="font-size:1rem;color:var(--gold-2)">%</span></strong><span>con tu marca</span></div>
          </div>
        </div>
        <div class="hero-visual reveal d2">
          <div class="ws-stack">${prods.map((p, i) => `<img src="${esc(p.imagenes.mini)}" alt="Producto fabricado por ${esc(c.sitio.nombre)}" style="--i:${i - Math.floor(prods.length / 2)}">`).join("")}</div>
          <div class="ws-card"><small>Fabricamos para ti</small><b>Marca blanca</b><span>Polvos · líquidos · sobres</span></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head center"><span class="eyebrow reveal">Por qué fabricar con nosotros</span><h2 class="reveal d1">La experiencia de una marca <em class="gold">que ya vende</em></h2></div>
        <div class="ws-benefits">
          <div class="reveal"><span class="ic">${I.leaf}</span><h3>Fórmulas que funcionan</h3><p>Desarrollamos productos que ya conocemos en el mercado: colágenos, superalimentos, fibras y bebidas.</p></div>
          <div class="reveal d1"><span class="ic">${I.drop}</span><h3>Sabores que se disfrutan</h3><p>Fórmulas endulzadas con stevia y con sabores pensados para que tu cliente repita.</p></div>
          <div class="reveal d2"><span class="ic">${I.shield}</span><h3>Calidad constante</h3><p>Los mismos procesos y controles con los que fabricamos la línea Nutrell.</p></div>
          <div class="reveal d3"><span class="ic">${I.chat}</span><h3>Asesor dedicado</h3><p>Un acompañante de tu proyecto en cada etapa, de la muestra a la entrega.</p></div>
        </div>
      </div>
    </section>
${maqSection(c).replace('id="maquila"', 'id="cotizar"')}
    <section class="section">
      <div class="container faq-grid">
        <div class="section-head" style="align-content:start"><span class="eyebrow reveal">Preguntas frecuentes</span><h2 class="reveal d1">Todo sobre <em class="gold">maquila</em></h2>
          <div class="reveal d2"><a href="/mayoristas" class="btn btn-outline">¿Prefieres distribuir Nutrell? Ver programa de mayoristas</a></div></div>
        <div class="faq">${MAQ_FAQ.map((f, i) => `<details class="reveal"${i === 0 ? " open" : ""}><summary>${esc(f.pregunta)}<span class="pm">+</span></summary><div class="answer">${esc(f.respuesta)}</div></details>`).join("")}</div>
      </div>
    </section>
  </main>
`;
  return withScript(h + footer(c));
}
