# Nutrell · Tienda online

Sitio estático (HTML/CSS/JS) listo para Vercel. Todo el contenido sale de **`data/productos.json`**.

## Cómo cambiar precios, textos o WhatsApp
1. Edita `data/productos.json` (sección `sitio` para WhatsApp, URL, envío gratis y fin de la oferta; cada producto tiene precio, precio antes, packs, textos y SEO).
2. Ejecuta `python3 tools/build.py`. Esto regenera `index.html`, una página por producto (`clorofila.html`, `gaskol.html`, …), `assets/js/catalogo.js`, `sitemap.xml` y `robots.txt`.
3. Sube los cambios a GitHub y Vercel publica solo.

## Cómo agregar un producto nuevo
1. Pon la foto en `_fuentes/originales/<slug>.jpg` y su recorte sin fondo en `_fuentes/recortes/<slug>.png` (hecho con `rembg`).
2. Agrega el producto en `data/productos.json`.
3. Ejecuta `python3 tools/imagenes.py` y luego `python3 tools/build.py`.

## Antes de publicar
- Número de WhatsApp real y URL final del sitio (`sitio.url`, se usa en SEO y sitemap).
- Precios reales (los actuales son de ejemplo).
- Reseñas reales en `tools/build.py` (las actuales son de ejemplo).
