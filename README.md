# Nutrell · Tienda online + Panel administrativo

Tienda en Vercel con panel tipo Shopify en **/admin**.

## Estructura
- `api/page.js` — arma las páginas de la tienda (inicio, productos, sitemap, robots) con los datos del panel.
- `api/store.js` — pedidos, conteo de visitas e imágenes subidas.
- `api/admin.js` — API del panel (requiere sesión).
- `admin/` — panel administrativo (resumen de ventas, pedidos, productos, clientes, descuentos, contenido, colecciones y configuración).
- `lib/seed.js` — catálogo inicial. Lo que se edita en el panel se guarda en la base de datos y tiene prioridad.
- `assets/` — estilos, código de la tienda e imágenes.

## Puesta en marcha en Vercel (una sola vez)
1. Proyecto en Vercel → **Storage** → **Create Database** → **Upstash for Redis** (plan gratis) → **Connect** al proyecto.
2. **Deployments** → último despliegue → **Redeploy**.
3. Entra a `tu-dominio/admin` con la clave inicial **123456** y cámbiala en **Configuración → Seguridad**.

Opcional: variable `ADMIN_PASSWORD` en Vercel para fijar la clave por entorno (la que se guarde desde el panel tiene prioridad).

## Probar en local
```bash
NUTRELL_DB=memory node tools/servidor.mjs
```
Abre http://localhost:3000 (tienda) y http://localhost:3000/admin (panel). La base en memoria se borra al cerrar.

## Imágenes con fondo transparente
Para productos nuevos, sube desde el panel una imagen PNG con fondo transparente. `tools/imagenes.py` sirve para procesar en lote fotos de `_fuentes/`.
