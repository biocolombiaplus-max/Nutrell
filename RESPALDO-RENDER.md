# Respaldo de la tienda Nutrell en Render

Si Vercel pausa el proyecto, la tienda puede seguir funcionando en **Render** con la **misma base de datos**: mismos productos, pedidos, mayoristas, maquila y configuración. No hay que copiar nada.

---

## Parte 1 · Preparar el respaldo (una sola vez, ~10 minutos)

1. Entra a **render.com** y crea una cuenta con **GitHub** (la misma cuenta donde está el repositorio `Nutrell`).
2. Clic en **New +** → **Blueprint**.
3. Elige el repositorio **biocolombiaplus-max/Nutrell** → **Connect**. Render lee el archivo `render.yaml` y propone el servicio **nutrell-respaldo** (plan **Free**, región Virginia).
4. Te pide 4 valores. Cópialos desde **Vercel → proyecto nutrell → Settings → Environment Variables** (botón del ojo para ver cada valor):

   | En Render         | Valor (cópialo de Vercel)                          |
   |-------------------|----------------------------------------------------|
   | `REDIS_URL`       | el mismo `REDIS_URL` (empieza por `redis://`)       |
   | `WOMPI_PUBLIC_KEY`| la llave `pub_prod_…`                               |
   | `WOMPI_INTEGRITY_SECRET` | el secreto `prod_integrity_…`               |
   | `WOMPI_EVENTS_SECRET`    | el secreto `prod_events_…`                  |

5. Clic en **Apply**. En 2–3 minutos el servicio queda **Live**, con una dirección como `https://nutrell-respaldo.onrender.com`.
6. Ábrela y revisa que se vea la tienda y que puedas entrar a `/admin`.
7. En Render → **nutrell-respaldo** → **Settings** → **Custom Domains** → **Add Custom Domain**: agrega `nutrell.co` y luego `www.nutrell.co`. Render te muestra los registros DNS que necesita para cada uno — **anótalos** (normalmente un registro **A** para `nutrell.co` y un **CNAME** para `www` que termina en `onrender.com`). No cambies nada en GoDaddy todavía.

> En el plan gratis de Render, si nadie visita la tienda durante 15 minutos el servidor “se duerme” y la siguiente visita tarda 30–50 segundos. Con tráfico normal se mantiene despierto.

---

## Parte 2 · Activar el respaldo (cuando Vercel se pause)

En **GoDaddy → nutrell.co → DNS**, edita solo estos 2 registros con los valores que anotaste de Render:

| Registro | Nombre | Cambiarlo a (respaldo Render)            |
|----------|--------|-------------------------------------------|
| A        | `@`    | la IP que indicó Render                    |
| CNAME    | `www`  | el valor `….onrender.com` que indicó Render|

En minutos (a veces hasta 1–2 horas) `www.nutrell.co` empieza a abrir desde Render. Render emite el candado HTTPS solo.

**Wompi sigue funcionando igual**: la URL de eventos es `https://www.nutrell.co/webhooks/wompi`, que ahora responde Render.

---

## Parte 3 · Volver a Vercel (cuando se reactive)

En GoDaddy, deja los 2 registros como estaban con Vercel:

| Registro | Nombre | Valor (Vercel)                              |
|----------|--------|---------------------------------------------|
| A        | `@`    | `216.198.79.1` (o la IP que muestre Vercel → Settings → Domains) |
| CNAME    | `www`  | el valor que muestra Vercel para `www.nutrell.co` |

---

## Cosas importantes

- **No borres nada de GoDaddy** distinto a esos 2 registros (los NS, SOA, `_domainconnect` y `_dmarc` son del dominio y del correo).
- Render publica solo cada vez que subo cambios a la rama de la tienda, así que el respaldo siempre está al día.
- Si cambias una llave en Vercel (Wompi o la base de datos), cámbiala también en Render → **Environment**.
