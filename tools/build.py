"""Genera el sitio Nutrell a partir de data/productos.json.

Uso:  python3 tools/build.py

Crea/actualiza:
  index.html, <slug>.html (una página por producto), producto.html (redirección),
  assets/js/catalogo.js, sitemap.xml, robots.txt
"""
import json, os, html
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(ROOT, "data/productos.json"), encoding="utf-8"))
SITE = D["sitio"]; URL = SITE["url"].rstrip("/")
PRODS = D["productos"]; BY = {p["slug"]: p for p in PRODS}
CATS = {c["id"]: c for c in D["categorias"]}
PRIO = ' fetchpriority="high"'; LAZY = ' loading="lazy"'
import hashlib
VER = hashlib.md5(b"".join(open(os.path.join(ROOT, x), "rb").read() for x in ["assets/js/main.js", "assets/css/styles.css", "data/productos.json"])).hexdigest()[:8]

def cop(n): return "$" + f"{round(n):,}".replace(",", ".")
def esc(s): return html.escape(s, quote=True)
def off_pct(p): return round((1 - p["precio"] / p["antes"]) * 100)
def img(p, kind=""): return f"assets/img/p/{p['slug']}{('-' + kind) if kind else ''}.webp"
def page(p): return f"{p['slug']}.html"
def theme_style(p):
    t = p["tema"]; return f'--accent:{t["acento"]};--accent-soft:{t["suave"]};--accent-dark:{t["oscuro"]}'

ICON = {
    "wa": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z"/></svg>',
    "chat": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-3.9-1L4 20z"/></svg>',
    "bag": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 016 0"/></svg>',
    "menu": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8h16M4 16h16"/></svg>',
    "x": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    "arrow": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    "plus": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    "check": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    "truck": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',
    "card": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
    "shield": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    "leaf": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l7-7"/></svg>',
    "drop": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3c3 4 6 7 6 11a6 6 0 01-12 0c0-4 3-7 6-11z"/></svg>',
    "star": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 6.9H22l-6 4.6 2.3 7.1L12 16.3 5.7 20.6 8 13.5 2 8.9h7.6z"/></svg>',
    "prev": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>',
    "next": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>',
}

NAV = [("index.html#coleccion", "Productos"), ("index.html#objetivos", "Objetivos"), ("index.html#rituales", "Rituales"), ("index.html#faq", "Preguntas")]

# ---------------------------------------------------------------- piezas comunes
def head(title, desc, canonical, og, jsonld, style=""):
    ld = "\n".join(f'  <script type="application/ld+json">{json.dumps(j, ensure_ascii=False)}</script>' for j in jsonld)
    return f'''<!doctype html>
<html lang="es-CO">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="canonical" href="{canonical}">
  <meta name="theme-color" content="#0d0d0e">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_CO">
  <meta property="og:site_name" content="Nutrell">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{URL}/{og}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="assets/img/nutrell-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/styles.css?v={VER}">
{ld}
</head>
<body{f' style="{style}"' if style else ''}>
'''

def header():
    links = "".join(f'<a href="{h}">{t}</a>' for h, t in NAV)
    mob = "".join(f'<a href="{h}">{t}</a>' for h, t in NAV)
    mob_p = "".join(f'<a href="{page(p)}" style="font-size:1.2rem;font-family:var(--ff-body);border:0;padding:4px 0;color:rgba(255,255,255,.7)">{esc(p["nombre"])}</a>' for p in PRODS)
    return f'''
  <div class="announce" role="region" aria-label="Anuncios">
    <div class="announce-track">
      <div class="announce-item"><span class="sep">✦</span><span><b>Envío gratis</b> desde {cop(SITE["envioGratisDesde"])} a toda Colombia</span></div>
      <div class="announce-item"><span class="sep">✦</span><span>Paga <b>contra entrega</b> · Compra 100% segura</span></div>
      <div class="announce-item"><span class="sep">✦</span><span>Lanzamiento: <b>hasta 15% OFF</b> en packs</span></div>
    </div>
  </div>
  <header class="header">
    <div class="container header-inner">
      <a href="index.html" class="logo" aria-label="Nutrell inicio"><img src="assets/img/nutrell-logo.png" alt="Nutrell · Nutre tu vida" width="600" height="256"></a>
      <nav class="nav" aria-label="Principal">{links}</nav>
      <div class="header-actions">
        <a class="icon-btn" href="#" data-wa aria-label="Asesoría por WhatsApp">{ICON["chat"]}</a>
        <button class="icon-btn" data-open-cart aria-label="Abrir carrito">{ICON["bag"]}<span class="cart-count">0</span></button>
        <button class="icon-btn menu-toggle" aria-label="Abrir menú">{ICON["menu"]}</button>
      </div>
    </div>
  </header>
  <div class="mobile-menu" aria-label="Menú">
    <button class="icon-btn close" aria-label="Cerrar menú">{ICON["x"]}</button>
    {mob}
    <div style="margin-top:20px;display:grid;gap:4px">{mob_p}</div>
  </div>
'''

def footer():
    plinks = "".join(f'<li><a href="{page(p)}">{esc(p["nombre"])}</a></li>' for p in PRODS)
    return f'''
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="assets/img/nutrell-logo-light.png" alt="Nutrell" loading="lazy">
          <p style="max-width:34ch">Suplementos dietarios con ingredientes naturales, endulzados con stevia, para acompañarte en cada etapa. <b style="color:#fff">Nutre tu vida.</b></p>
          <div class="socials">
            <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
            <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3a4 4 0 00-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z"/></svg></a>
            <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.4 2.3 1.8 3.8 4 4v3.2c-1.5 0-2.8-.4-4-1.2V15a6 6 0 11-6-6v3.3A2.7 2.7 0 1012.7 15V3H16z"/></svg></a>
            <a href="#" data-wa aria-label="WhatsApp">{ICON["chat"]}</a>
          </div>
        </div>
        <div><h4>Productos</h4><ul>{plinks}</ul></div>
        <div><h4>Ayuda</h4><ul><li><a href="index.html#faq">Preguntas frecuentes</a></li><li><a href="#">Envíos y entregas</a></li><li><a href="#">Cambios y devoluciones</a></li><li><a href="#" data-wa>Contáctanos</a></li></ul></div>
        <div><h4>Legal</h4><ul><li><a href="#">Términos y condiciones</a></li><li><a href="#">Política de privacidad</a></li><li><a href="#">Tratamiento de datos</a></li></ul></div>
      </div>
      <div class="legal">
        <p class="disclaimer">Los productos Nutrell son suplementos dietarios: no son medicamentos y no suplen una alimentación equilibrada. No sirven para el diagnóstico, tratamiento, cura o prevención de ninguna enfermedad. Consulta a tu médico si estás en embarazo, lactancia o tienes alguna condición de salud.</p>
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;align-items:center">
          <span>© <span data-year>2026</span> Nutrell®. Todos los derechos reservados.</span>
          <div class="payments"><span>Contra entrega</span><span>Nequi</span><span>Daviplata</span><span>Bancolombia</span><span>PSE</span></div>
        </div>
      </div>
    </div>
  </footer>
  <a class="wa-float" href="#" data-wa aria-label="Escríbenos por WhatsApp">{ICON["wa"]}</a>
  <div class="overlay"></div>
  <aside class="drawer" aria-label="Carrito de compras">
    <div class="drawer-head"><h3>Tu carrito</h3><button class="icon-btn" data-close-cart aria-label="Cerrar carrito">{ICON["x"]}</button></div>
    <div class="ship-progress"></div>
    <div class="drawer-body"></div>
    <div class="drawer-foot">
      <div class="row total"><span>Total</span><span data-cart-total>$0</span></div>
      <button class="btn btn-wa btn-block" data-checkout>{ICON["wa"]}Finalizar pedido por WhatsApp</button>
      <small>Pago contra entrega o transferencia · Te confirmamos al instante</small>
    </div>
  </aside>
  <script src="assets/js/catalogo.js?v={VER}"></script>
  <script src="assets/js/main.js?v={VER}"></script>
</body>
</html>
'''

def pcard(p, delay=0):
    c = CATS[p["categoria"]]
    return f'''<article class="pcard reveal{f' d{delay}' if delay else ''}" data-cat="{p["categoria"]}" style="--pc:{p["tema"]["acento"]};--accent-soft:{p["tema"]["suave"]}">
            <a href="{page(p)}" class="stage" aria-label="Ver {esc(p["nombre"])}">
              <span class="chip chip-dark tag">{esc(p["etiqueta"])}</span>
              <img class="cut" src="{img(p, "sm")}" alt="{esc(p["nombre"])} {esc(p["tamano"])} Nutrell" loading="lazy" width="440" height="520">
              <button class="quick" type="button" data-add="{p["slug"]}" onclick="event.preventDefault()">{ICON["plus"]}Agregar rápido</button>
            </a>
            <div>
              <span class="cat-name">{esc(c["nombre"])}</span>
              <h3><a href="{page(p)}">{esc(p["nombre"])}</a></h3>
              <p class="desc">{esc(p["resumen"])}</p>
            </div>
            <span class="meta">{esc(p["tamano"])} · Sabor {esc(p["sabor"].lower() if p["sabor"] != "Natural" else "natural")}</span>
            <div class="row">
              <div class="price"><span class="now">{cop(p["precio"])}</span><span class="was">{cop(p["antes"])}</span></div>
              <button class="add-round" data-add="{p["slug"]}" aria-label="Agregar {esc(p["nombre"])} al carrito">{ICON["plus"]}</button>
            </div>
          </article>'''

def org_ld():
    return {"@context": "https://schema.org", "@type": "Organization", "name": "Nutrell", "slogan": "Nutre tu vida",
            "url": URL, "logo": f"{URL}/assets/img/nutrell-logo.png"}

def faq_ld(faqs):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}

# ---------------------------------------------------------------- INICIO
GENERAL_FAQ = [
    ("¿Los productos Nutrell son naturales?", "Nuestras fórmulas combinan ingredientes de origen natural como plantas, frutas, superalimentos y hongos, con vitaminas y minerales. Todas están endulzadas con stevia."),
    ("¿Cómo hago mi pedido?", "Agrega tus productos al carrito y finaliza el pedido por WhatsApp. Una asesora confirma tus datos, el valor del envío y la forma de pago."),
    ("¿Puedo pagar contra entrega?", f"Sí. También puedes pagar por Nequi, Daviplata, Bancolombia o PSE. El envío es gratis en compras desde {cop(SITE['envioGratisDesde'])}."),
    ("¿A dónde hacen envíos?", "Enviamos a toda Colombia. El tiempo de entrega depende de tu ciudad y te lo confirmamos al hacer el pedido."),
    ("¿Puedo combinar varios productos?", "Sí. Puedes armar tu propio ritual o elegir uno de nuestros rituales recomendados, como Belleza, Digestivo o Vitalidad."),
    ("¿Los puedo tomar si estoy embarazada o tengo una condición médica?", "Si estás en embarazo, lactancia, tomas medicamentos o tienes alguna condición de salud, consulta primero con tu médico."),
]

def build_index():
    col = BY["colageno-marino"]
    cats_html = ""
    for i, c in enumerate(D["categorias"]):
        ps = [p for p in PRODS if p["categoria"] == c["id"]]
        color = ps[0]["tema"]["acento"]
        imgs = "".join(f'<img src="{img(p, "sm")}" alt="" loading="lazy">' for p in ps[:3])
        cats_html += f'''<a href="#coleccion" class="cat reveal{f' d{i % 3}' if i % 3 else ''}" data-goto-cat="{c["id"]}" style="--c:{color}">
            <div><h3>{esc(c["nombre"])}</h3><p>{esc(c["frase"])}</p><span class="go">{len(ps)} {'producto' if len(ps) == 1 else 'productos'} {ICON["arrow"].replace('<svg', '<svg width="14" height="14"')}</span></div>
            <div class="imgs">{imgs}</div>
          </a>'''
    filters = '<button class="filter on" data-filter="todos">Todos</button>' + "".join(
        f'<button class="filter" data-filter="{c["id"]}">{esc(c["nombre"])}</button>' for c in D["categorias"])
    cards = "\n          ".join(pcard(p, i % 4) for i, p in enumerate(PRODS))
    kits = ""
    for i, k in enumerate(D["rituales"]):
        ps = [BY[s] for s in k["productos"]]
        total = sum(p["precio"] for p in ps)
        kits += f'''<div class="kit reveal{f' d{i}' if i else ''}">
            <div class="imgs">{"".join(f'<img src="{img(p, "sm")}" alt="{esc(p["nombre"])}" loading="lazy">' for p in ps)}</div>
            <h3>{esc(k["nombre"])}</h3><p>{esc(k["frase"])}</p>
            <ul>{"".join(f'<li><a href="{page(p)}">{esc(p["nombre"])}</a><span>{cop(p["precio"])}</span></li>' for p in ps)}</ul>
            <div class="total"><span>Total del ritual</span><b>{cop(total)}</b></div>
            <button class="btn btn-gold btn-block" data-kit="{",".join(k["productos"])}">Agregar ritual completo</button>
          </div>'''
    faq_html = "".join(f'<details class="reveal"{" open" if i == 0 else ""}><summary>{esc(q)}<span class="pm">+</span></summary><div class="answer">{esc(a)}</div></details>' for i, (q, a) in enumerate(GENERAL_FAQ))
    marquee = "".join(f"<span>{esc(p['nombre'])}</span>" for p in PRODS) * 2
    ld = [org_ld(),
          {"@context": "https://schema.org", "@type": "WebSite", "name": "Nutrell", "url": URL, "inLanguage": "es-CO"},
          {"@context": "https://schema.org", "@type": "ItemList", "name": "Productos Nutrell", "itemListElement": [
              {"@type": "ListItem", "position": i + 1, "url": f"{URL}/{p['slug']}", "name": p["nombre"]} for i, p in enumerate(PRODS)]},
          faq_ld(GENERAL_FAQ)]
    out = head("Nutrell · Suplementos Naturales Premium en Colombia | Nutre tu vida",
               "Tienda oficial Nutrell: colágeno marino, clorofila, factor de transferencia, maca, Gaskol, Vino Cerebral y fibra Lax-6. Fórmulas con ingredientes naturales endulzadas con stevia. Envíos a toda Colombia y pago contra entrega.",
               URL + "/", f"assets/img/p/colageno-marino-og.jpg", ld)
    out += header()
    out += f'''
  <main>
    <section class="hero">
      <div class="hero-grain"></div>
      <div class="container hero-grid">
        <div>
          <span class="eyebrow reveal">Suplementos dietarios premium</span>
          <h1 class="reveal d1">Nutrición que se<br>nota <em class="gold">desde adentro.</em></h1>
          <p class="lead reveal d2">Fórmulas con colágeno marino, superalimentos andinos, plantas, hongos funcionales, vitaminas y minerales. Todas endulzadas con stevia, para que cuidarte sea un placer diario.</p>
          <div class="hero-ctas reveal d3">
            <a href="#coleccion" class="btn btn-gold">Ver la colección {ICON["arrow"]}</a>
            <a href="#objetivos" class="btn btn-ghost">Comprar por objetivo</a>
          </div>
          <div class="hero-proof reveal d3">
            <div class="proof-item"><strong>{len(PRODS)}</strong><span>fórmulas premium</span></div>
            <div class="proof-item"><strong>100<span style="font-size:1rem;color:var(--gold-2)">%</span></strong><span>endulzadas con stevia</span></div>
            <div class="proof-item"><strong>24<span style="font-size:1rem;color:var(--gold-2)">/7</span></strong><span>asesoría por WhatsApp</span></div>
          </div>
        </div>
        <div class="hero-visual reveal d2">
          <div class="lineup">
            <img class="l1" src="{img(BY['factor-transferencia'], 'sm')}" alt="Factor de Transferencia Nutrell">
            <img class="l2" src="{img(col)}" alt="Colágeno Marino con Péptidos Nutrell 1000 g" fetchpriority="high">
            <img class="l3" src="{img(BY['macamass'], 'sm')}" alt="Macamass Nutrell maca en polvo">
            <div class="float-badge fb-1"><span class="dot">{ICON["leaf"]}</span><div>Ingredientes naturales<small>Plantas · frutas · hongos</small></div></div>
            <div class="float-badge fb-2"><span class="dot">{ICON["drop"]}</span><div>Endulzado con stevia<small>Sin azúcar añadida</small></div></div>
            <div class="price-tag"><small>Hasta</small><b>-15%</b><small>Lanzamiento</small></div>
          </div>
        </div>
      </div>
    </section>

    <div class="marquee" aria-hidden="true"><div class="marquee-track">{marquee}</div></div>

    <section class="perks">
      <div class="container">
        <div class="perks-grid reveal">
          <div class="perk">{ICON["truck"]}<div><b>Envíos a toda Colombia</b><span>Gratis desde {cop(SITE["envioGratisDesde"])}</span></div></div>
          <div class="perk">{ICON["card"]}<div><b>Pago contra entrega</b><span>Pagas cuando lo recibes</span></div></div>
          <div class="perk">{ICON["shield"]}<div><b>Compra 100% segura</b><span>Tus datos protegidos</span></div></div>
          <div class="perk">{ICON["chat"]}<div><b>Asesoría personalizada</b><span>Te acompañamos por WhatsApp</span></div></div>
        </div>
      </div>
    </section>

    <section class="section" id="objetivos">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow reveal">Compra por objetivo</span>
          <h2 class="reveal d1">¿Qué quieres <em class="gold">nutrir hoy?</em></h2>
        </div>
        <div class="cats">{cats_html}</div>
      </div>
    </section>

    <section class="section" id="coleccion" style="padding-top:0">
      <div class="container">
        <div class="section-head center">
          <span class="eyebrow reveal">La colección</span>
          <h2 class="reveal d1">Fórmulas que <em class="gold">nutren tu vida</em></h2>
          <p class="lead reveal d2">Cada producto Nutrell combina ingredientes seleccionados con un sabor que disfrutas tomar todos los días.</p>
        </div>
        <div class="filters reveal" role="tablist" aria-label="Filtrar productos">{filters}</div>
        <div class="grid-products">
          {cards}
        </div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="container spot">
        <a href="{page(col)}" class="stage reveal" style="--accent-soft:{col["tema"]["suave"]}" aria-label="Ver Colágeno Marino">
          <img class="cut" src="{img(col)}" alt="Colágeno Marino hidrolizado con péptidos Nutrell 1000 g sabor uva" loading="lazy">
        </a>
        <div class="featured-info reveal d1">
          <span class="eyebrow">Producto estrella</span>
          <h2>Colágeno Marino <em class="gold">con Péptidos</em></h2>
          <p class="lead">Colágeno marino hidrolizado adicionado con péptidos de colágeno: <b style="color:var(--ink)">20.000 mg por porción</b>, con resveratrol, biotina, cúrcuma y vitaminas C y E. Sabor uva.</p>
          <ul class="check-list">
            <li><span>La vitamina C contribuye a la <b>formación normal de colágeno</b></span></li>
            <li><span>La biotina contribuye al mantenimiento normal del <b>cabello y la piel</b></span></li>
            <li><span>Libre de <b>soya, gluten y maltodextrina</b></span></li>
          </ul>
          <div class="price"><span class="now">{cop(col["precio"])}</span><span class="was">{cop(col["antes"])}</span><span class="save">-{off_pct(col)}%</span></div>
          <div class="actions"><button class="btn btn-gold" data-add="{col["slug"]}">Agregar al carrito</button><a href="{page(col)}" class="btn btn-outline">Ver detalles</a></div>
        </div>
      </div>
    </section>

    <section class="section dark" id="rituales">
      <div class="container">
        <div class="section-head center">
          <span class="eyebrow reveal">Rituales Nutrell</span>
          <h2 class="reveal d1">Combina y <em class="gold">potencia tu rutina</em></h2>
          <p class="lead reveal d2">Seleccionamos combinaciones pensadas para cada objetivo. Agrégalas en un solo clic y suma para tu envío gratis.</p>
        </div>
        <div class="kits">{kits}</div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head center">
          <span class="eyebrow reveal">La promesa Nutrell</span>
          <h2 class="reveal d1">Lo que nunca <em class="gold">negociamos</em></h2>
        </div>
        <div class="promise reveal">
          <div><span class="n">I.</span><h3>Ingredientes naturales</h3><p>Plantas, frutas, superalimentos y hongos funcionales en el centro de cada fórmula.</p></div>
          <div><span class="n">II.</span><h3>Endulzado con stevia</h3><p>Todo el sabor, sin azúcar añadida.</p></div>
          <div><span class="n">III.</span><h3>Fórmulas limpias</h3><p>Nuestros polvos son libres de soya, gluten y maltodextrina.</p></div>
          <div><span class="n">IV.</span><h3>Acompañamiento real</h3><p>Asesoras por WhatsApp para ayudarte a elegir y armar tu ritual.</p></div>
        </div>
      </div>
    </section>

    <!-- ⚠️ REEMPLAZAR por reseñas reales de clientes antes de publicar. -->
    <section class="section" style="padding-top:0">
      <div class="container">
        <div class="section-head"><span class="eyebrow reveal">Comunidad Nutrell</span><h2 class="reveal d1">Lo que dicen <em class="gold">nuestros clientes</em></h2></div>
        <div class="reviews">
          <article class="review reveal"><span class="stars">★★★★★</span><p>“El colágeno se disuelve súper fácil y el sabor a uva es delicioso. Ya es parte de mi mañana.”</p><div class="who"><span class="avatar">CM</span><div><b>Carolina M.</b><br><span class="verified">Compra verificada</span></div></div></article>
          <article class="review reveal d1"><span class="stars">★★★★★</span><p>“La clorofila sabor menta es refrescante y el Macamass de vainilla queda perfecto en batidos.”</p><div class="who"><span class="avatar">JR</span><div><b>Juliana R.</b><br><span class="verified">Compra verificada</span></div></div></article>
          <article class="review reveal d2"><span class="stars">★★★★★</span><p>“Pedí el ritual completo contra entrega y llegó rapidísimo. La asesoría por WhatsApp fue excelente.”</p><div class="who"><span class="avatar">AP</span><div><b>Andrés P.</b><br><span class="verified">Compra verificada</span></div></div></article>
        </div>
      </div>
    </section>

    <section class="section" id="faq" style="padding-top:0">
      <div class="container faq-grid">
        <div class="section-head" style="align-content:start">
          <span class="eyebrow reveal">Preguntas frecuentes</span>
          <h2 class="reveal d1">Resolvemos <em class="gold">tus dudas</em></h2>
          <p class="lead reveal d2">¿Tienes otra pregunta? Escríbenos y una asesora te responde.</p>
          <div class="reveal d3"><a href="#" data-wa class="btn btn-wa">{ICON["wa"]}Hablar con una asesora</a></div>
        </div>
        <div class="faq">{faq_html}</div>
      </div>
    </section>

    <section>
      <div class="container">
        <div class="cta-final reveal">
          <div>
            <span class="eyebrow">Club Nutrell</span>
            <h2 style="margin:16px 0 14px">Recibe <em class="gold">10% OFF</em> en tu primera compra</h2>
            <p class="lead">Únete y recibe consejos de bienestar, lanzamientos y ofertas exclusivas. Sin spam, prometido.</p>
            <form class="newsletter" style="margin-top:26px">
              <label class="sr-only" for="nl-email">Correo electrónico</label>
              <input id="nl-email" type="email" required placeholder="Tu correo electrónico">
              <button class="btn btn-gold" type="submit">Quiero mi 10%</button>
            </form>
          </div>
          <div class="code-box"><small style="letter-spacing:.2em;text-transform:uppercase;color:var(--gold-2)">Tu código</small><b class="gold-text">NUTRE10</b><small style="color:rgba(255,255,255,.6)">Aplícalo al pedir por WhatsApp</small></div>
        </div>
      </div>
    </section>
  </main>
'''
    out += footer()
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(out)

# ---------------------------------------------------------------- PRODUCTO
def build_product(p):
    c = CATS[p["categoria"]]
    s = p["slug"]
    sabor = p["sabor"] if p["sabor"] != "Natural" else "natural"
    slides = [
        ("stage", img(p), f'{p["nombre"]} {p["tamano"]} Nutrell — vista frontal', img(p, "sm")),
        ("photo", f"assets/img/p/{s}-foto.jpg", f'Foto de {p["nombre"]} Nutrell sabor {sabor}', f"assets/img/p/{s}-foto.jpg"),
        ("stage", img(p, "d1"), f'Detalle de la etiqueta de {p["nombre"]}', img(p, "d1")),
        ("stage", img(p, "d2"), f'Detalle de ingredientes de {p["nombre"]}', img(p, "d2")),
    ]
    slides_html = "".join(
        f'<div class="slide {k}"><img src="{src}" alt="{esc(alt)}"{PRIO if i == 0 else LAZY}></div>'
        for i, (k, src, alt, _) in enumerate(slides))
    lista = "".join(f"<li><span>{esc(d)}</span><b>✓</b></li>" for d in p["destacados"])
    slides_html += f'''<div class="slide info-slide"><span class="eyebrow" style="color:var(--gold-2)">{esc(p["nombre"])}</span><p class="big gold-text">{esc(p["cifra"][0])}</p><h3>{esc(p["cifra"][1])}</h3><ul>{lista}</ul></div>'''
    thumbs = "".join(f'<button class="thumb {k}" aria-label="Imagen {i + 1}"><img src="{t}" alt="" loading="lazy"></button>' for i, (k, _, _, t) in enumerate(slides))
    thumbs += f'<button class="thumb info-thumb" aria-label="Resumen">{esc(p["cifra"][0])}</button>'
    hl = "".join(f'<div class="hl">{ICON["check"]}{esc(d)}</div>' for d in p["destacados"])
    packs = ""
    for i, (u, off, txt) in enumerate(p["packs"]):
        flag = ""
        if i == 1: flag = '<span class="chip chip-grape flag">Favorito</span>'
        if i == 2: flag = '<span class="chip chip-dark flag">Mejor precio</span>'
        unit = "sobres" if p["formato"] == "Sobre" else ("frascos" if p["formato"] == "Líquido" else "tarros")
        unit1 = unit[:-1]
        name = f"1 {unit1}" if u == 1 else f"{u} {unit}" + (f" · ahorra {round(off * 100)}%" if off else "")
        packs += f'<label class="pack-opt"><input type="radio" name="pack" value="{u}"{" checked" if i == 0 else ""}>{flag}<span class="radio"></span><span><b>{name}</b><small>{esc(txt)}</small></span><span class="p" data-pack-price="{u}"></span></label>'
    desc = "".join(f"<p>{d}</p>" for d in p["descripcion"])
    ingr_list = "".join(f"<li><b>{esc(n)}:</b> {esc(t)}</li>" for _, n, t in p["ingredientes"])
    pasos_txt = " ".join(f"{t}" for _, t in p["pasos"])
    libre = ("Libre de " + ", ".join(x.lower() for x in p["libreDe"][:-1]) + " y " + p["libreDe"][-1].lower() + ". ") if p["libreDe"] else ""
    ingr_cards = f'''<article class="ingr hero-ingr reveal"><span class="tag">Fórmula</span><p class="big-num gold-text">{esc(p["cifra"][0])}</p><h3>{esc(p["cifra"][1])}</h3><p>{esc(p["resumen"])}</p></article>'''
    for i, (tag, n, t) in enumerate(p["ingredientes"]):
        ingr_cards += f'<article class="ingr reveal{f" d{(i % 3)}" if i % 3 else ""}"><div class="mono">{esc(n[0])}</div><span class="tag">{esc(tag)}</span><h3>{esc(n)}</h3><p>{esc(t)}</p></article>'
    free = ""
    if p["libreDe"]:
        free = '<div class="free-row reveal">' + "".join(f'<span class="free-pill">Sin <s>{esc(x)}</s></span>' for x in p["libreDe"]) + '<span class="free-pill">Endulzado con stevia</span></div>'
    else:
        free = '<div class="free-row reveal"><span class="free-pill">Endulzado con stevia</span></div>'
    steps = "".join(f'<div class="step reveal{f" d{i}" if i else ""}"><div class="ico">{[ICON["drop"], ICON["leaf"], ICON["check"]][i]}</div><h3>{esc(t)}</h3><p>{esc(x)}</p></div>' for i, (t, x) in enumerate(p["pasos"]))
    faqs = p["faq"] + [("¿Cómo pago y cuánto tarda el envío?", f"Puedes pagar contra entrega, Nequi, Daviplata, Bancolombia o PSE. Enviamos a toda Colombia, gratis desde {cop(SITE['envioGratisDesde'])}. El tiempo de entrega depende de tu ciudad.")]
    faq_html = "".join(f'<details class="reveal"{" open" if i == 0 else ""}><summary>{esc(q)}<span class="pm">+</span></summary><div class="answer">{esc(a)}</div></details>' for i, (q, a) in enumerate(faqs))
    related = [x for x in PRODS if x["categoria"] == p["categoria"] and x is not p]
    related += [x for x in PRODS if x not in related and x is not p]
    rel_html = "\n          ".join(pcard(x, i) for i, x in enumerate(related[:4]))
    canonical = f"{URL}/{s}"
    plain_desc = " ".join(html.unescape(__import__("re").sub("<[^>]+>", "", d)) for d in p["descripcion"])
    ld = [org_ld(),
          {"@context": "https://schema.org", "@type": "Product", "name": p["nombre"], "image": [f"{URL}/{img(p)}", f"{URL}/assets/img/p/{s}-foto.jpg"],
           "description": plain_desc, "sku": f"NUT-{s.upper()}", "brand": {"@type": "Brand", "name": "Nutrell"}, "category": c["nombre"],
           "size": p["tamano"],
           "offers": {"@type": "Offer", "url": canonical, "priceCurrency": "COP", "price": p["precio"], "availability": "https://schema.org/InStock",
                      "itemCondition": "https://schema.org/NewCondition", "seller": {"@type": "Organization", "name": "Nutrell"}}},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Inicio", "item": URL + "/"},
              {"@type": "ListItem", "position": 2, "name": c["nombre"], "item": URL + "/#coleccion"},
              {"@type": "ListItem", "position": 3, "name": p["nombre"], "item": canonical}]},
          faq_ld(faqs)]
    out = head(p["seoTitulo"], p["seoDescripcion"], canonical, f"assets/img/p/{s}-og.jpg", ld, theme_style(p))
    out += header()
    out += f'''
  <main>
    <div class="container">
      <nav class="breadcrumb" aria-label="Ruta"><a href="index.html">Inicio</a><span>/</span><a href="index.html#coleccion">{esc(c["nombre"])}</a><span>/</span><span style="color:var(--ink)">{esc(p["nombre"])}</span></nav>
      <div class="pdp">
        <div class="gallery">
          <div class="gallery-main" aria-roledescription="carrusel">
            <div class="chips"><span class="chip chip-dark">{esc(p["etiqueta"])}</span><span class="chip chip-grape" style="background:var(--accent)">-{off_pct(p)}%</span></div>
            <div class="slides">{slides_html}</div>
            <button class="g-nav prev" aria-label="Imagen anterior">{ICON["prev"]}</button>
            <button class="g-nav next" aria-label="Imagen siguiente">{ICON["next"]}</button>
            <div class="g-dots"></div>
            <span class="g-count">1 / {len(slides) + 1}</span>
          </div>
          <div class="thumbs" aria-label="Miniaturas">{thumbs}</div>
        </div>

        <div class="buybox" data-product="{s}">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="chip cat-chip">{esc(c["nombre"])}</span><span class="chip chip-soft">{esc(p["tamano"])}</span><span class="chip chip-soft">Sabor {esc(sabor)}</span></div>
          <h1>{esc(p["h1"][0])} <em class="gold">{esc(p["h1"][1])}</em></h1>
          <p class="sub">{esc(p["subtitulo"])}</p>
          <div class="price"><span class="now" data-price>{cop(p["precio"])}</span><span class="was" data-was>{cop(p["antes"])}</span><span class="save" data-save></span></div>
          <div class="hl-grid">{hl}</div>
          <div class="urgency" data-countdown-wrap><span class="live"></span><span>Precio de lanzamiento termina en</span> <span class="countdown" data-countdown></span></div>
          <div>
            <div class="opt-label">Elige tu pack <span>Entre más llevas, más ahorras</span></div>
            <div class="pack-opts">{packs}</div>
          </div>
          <div class="buy-row">
            <div class="qty" aria-label="Cantidad"><button data-step="-1" aria-label="Restar">−</button><span data-qty>1</span><button data-step="1" aria-label="Sumar">+</button></div>
            <button class="btn btn-gold" data-add-pdp>Agregar al carrito</button>
          </div>
          <button class="btn btn-wa btn-block" data-wa-pdp style="margin-top:-10px">{ICON["wa"]}Comprar por WhatsApp · contra entrega</button>
          <p class="delivery">{ICON["truck"]}<span>Envío a toda Colombia · <b>gratis desde {cop(SITE["envioGratisDesde"])}</b></span></p>
          <div class="trust">
            <div>{ICON["card"]}Pago contra entrega</div>
            <div>{ICON["shield"]}Compra segura</div>
            <div>{ICON["chat"]}Asesoría experta</div>
          </div>
          <div class="acc">
            <details open><summary>Descripción</summary><div class="answer">{desc}</div></details>
            <details><summary>Ingredientes</summary><div class="answer"><ul>{ingr_list}</ul><p style="margin-top:10px">{libre}Consulta la lista completa de ingredientes y la tabla nutricional en el empaque.</p></div></details>
            <details><summary>Modo de uso</summary><div class="answer">{esc(pasos_txt)}</div></details>
            <details><summary>Advertencias</summary><div class="answer">{esc(p["advertencias"])} Mantener fuera del alcance de los niños, en lugar fresco y seco. Este producto no es un medicamento.</div></details>
            <details><summary>Envíos y pagos</summary><div class="answer">Enviamos a toda Colombia. Paga contra entrega, Nequi, Daviplata, Bancolombia o PSE. Envío gratis en compras desde {cop(SITE["envioGratisDesde"])}.</div></details>
          </div>
        </div>
      </div>
    </div>

    <section class="section dark pdp-dark">
      <div class="container">
        <div class="section-head center">
          <span class="eyebrow reveal">Dentro de cada {"sobre" if p["formato"] == "Sobre" else "porción"}</span>
          <h2 class="reveal d1">Ingredientes <em class="gold">protagonistas</em></h2>
          <p class="lead reveal d2">{esc(p["resumen"])}</p>
        </div>
        <div class="ingr-grid">{ingr_cards}</div>
        {free}
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head center">
          <span class="eyebrow reveal">Tu ritual diario</span>
          <h2 class="reveal d1">Así se toma <em class="gold">{esc(p["h1"][0])}</em></h2>
        </div>
        <div class="steps">{steps}</div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="container">
        <div class="mini-banner reveal" style="background:linear-gradient(120deg, var(--accent) 0%, var(--accent-dark) 100%)">
          <div>
            <span class="eyebrow" style="color:#fff">Pack favorito</span>
            <h2 style="margin-top:12px">Lleva {p["packs"][1][0]} y ahorra {round(p["packs"][1][1] * 100)}% <em class="gold">en tu ritual</em></h2>
            <p>La constancia es el secreto. Asegura tu rutina sin interrupciones.</p>
          </div>
          <button class="btn btn-gold" data-add="{s}" data-units="{p["packs"][1][0]}">Agregar pack x{p["packs"][1][0]}</button>
        </div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="container faq-grid">
        <div class="section-head" style="align-content:start">
          <span class="eyebrow reveal">Preguntas frecuentes</span>
          <h2 class="reveal d1">Todo sobre <em class="gold">{esc(p["nombre"].split(" ")[0])}</em></h2>
          <div class="reveal d2"><a href="#" data-wa="¡Hola Nutrell! Tengo una pregunta sobre {esc(p["nombre"])}" class="btn btn-wa">{ICON["wa"]}Preguntar a una asesora</a></div>
        </div>
        <div class="faq">{faq_html}</div>
      </div>
    </section>

    <section class="section related" style="padding-top:0">
      <div class="container">
        <div class="section-head"><span class="eyebrow reveal">Completa tu ritual</span><h2 class="reveal d1">También te puede <em class="gold">gustar</em></h2></div>
        <div class="grid-products">
          {rel_html}
        </div>
      </div>
    </section>
  </main>

  <div class="sticky-atc">
    <div class="container inner">
      <img src="{img(p, "sm")}" alt="">
      <div class="t"><b>{esc(p["nombre"])} · {esc(p["tamano"])}</b><span data-sticky-price>{cop(p["precio"])}</span></div>
      <button class="btn btn-gold" data-add-pdp>Agregar</button>
    </div>
  </div>
  <div class="lightbox" role="dialog" aria-label="Imagen ampliada"><button class="icon-btn close" aria-label="Cerrar">{ICON["x"]}</button><img alt="Imagen del producto ampliada"></div>
'''
    out += footer()
    open(os.path.join(ROOT, page(p)), "w", encoding="utf-8").write(out)

# ---------------------------------------------------------------- extras
def build_extras():
    cat = {"config": {"whatsapp": SITE["whatsapp"], "freeShippingFrom": SITE["envioGratisDesde"], "promoEnds": SITE["finOferta"]},
           "products": {p["slug"]: {"id": p["slug"], "name": p["nombre"], "variant": f'{p["tamano"]} · Sabor {p["sabor"].lower()}',
                                    "price": p["precio"], "compareAt": p["antes"], "image": img(p, "sm"), "url": page(p),
                                    "packs": {str(u): off for u, off, _ in p["packs"]}} for p in PRODS}}
    open(os.path.join(ROOT, "assets/js/catalogo.js"), "w", encoding="utf-8").write(
        "/* Generado por tools/build.py desde data/productos.json — no editar a mano */\nwindow.NUTRELL = " + json.dumps(cat, ensure_ascii=False, indent=2) + ";\n")
    urls = [URL + "/"] + [f"{URL}/{p['slug']}" for p in PRODS]
    today = date.today().isoformat()
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
        f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>\n" for u in urls) + "</urlset>\n"
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(sm)
    open(os.path.join(ROOT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\n\nSitemap: {URL}/sitemap.xml\n")
    # Redirección del enlace antiguo
    open(os.path.join(ROOT, "producto.html"), "w", encoding="utf-8").write(
        '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Colágeno Marino | Nutrell</title>'
        f'<link rel="canonical" href="{URL}/colageno-marino"><meta http-equiv="refresh" content="0; url=colageno-marino.html">'
        '</head><body><a href="colageno-marino.html">Ir a Colágeno Marino</a></body></html>\n')

if __name__ == "__main__":
    build_index()
    for p in PRODS: build_product(p)
    build_extras()
    print("Sitio generado:", 1 + len(PRODS), "páginas")
