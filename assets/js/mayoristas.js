/* =========================================================
   NUTRELL · Programa de mayoristas (solicitud + portal)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const cop = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CO");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const api = async (a, data) => {
    const r = await fetch(`/api/mayoristas?a=${a}`, data ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "same-origin" } : { credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || "No pudimos completar la acción."), { status: r.status });
    return j;
  };
  const toast = (m) => { let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); } t.textContent = m; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2600); };
  const ICON = {
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H3"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };
  const ESTADO = { nuevo: "Recibido", confirmado: "Confirmado", preparando: "Preparando", enviado: "Enviado", entregado: "Entregado", cancelado: "Cancelado" };
  const PAGO = { pendiente: "Pago pendiente", pagado: "Pagado", rechazado: "Pago rechazado", reembolsado: "Reembolsado" };
  const wa = (num, t) => `https://wa.me/${num}?text=${encodeURIComponent(t)}`;
  const toWompi = (p) => {
    const q = [["public-key", p.publicKey], ["currency", p.currency], ["amount-in-cents", p.amountInCents], ["reference", p.reference], ["signature:integrity", p.signature.integrity], ["redirect-url", p.redirectUrl],
      ["customer-data:full-name", p.customerData.fullName], ["customer-data:phone-number", p.customerData.phoneNumber], ["customer-data:phone-number-prefix", p.customerData.phoneNumberPrefix], ["customer-data:email", p.customerData.email]]
      .filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    location.href = `https://checkout.wompi.co/p/?${q}`;
  };

  /* ---------- Solicitud ---------- */
  const form = $("[data-ws-form]");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("[data-ws-error]"), btn = $("button[type=submit]", form);
    const fd = new FormData(form), d = Object.fromEntries(fd); d.canales = fd.getAll("canales");
    const req = ["empresa", "tipo", "contacto", "telefono", "ciudad", "email", "password"];
    const miss = req.filter((k) => !String(d[k] || "").trim());
    $$("input,select", form).forEach((i) => i.classList.toggle("bad", miss.includes(i.name)));
    if (miss.length) { err.textContent = "Completa los campos marcados con *."; return; }
    if (String(d.password).length < 8) { err.textContent = "La contraseña debe tener al menos 8 caracteres."; $("[name=password]", form).classList.add("bad"); return; }
    if (!d.acepto) { err.textContent = "Debes autorizar el tratamiento de datos para continuar."; return; }
    err.textContent = ""; btn.disabled = true; btn.classList.add("loading");
    try {
      await api("registro", d);
      form.innerHTML = `<div class="ws-done"><div class="ps-ico">${ICON.check}</div><h3>¡Solicitud enviada!</h3><p>Gracias, <b>${esc(d.contacto)}</b>. Revisaremos la información de <b>${esc(d.empresa)}</b> y te responderemos en 24 a 48 horas hábiles por WhatsApp o correo.</p><p class="muted">Cuando te aprobemos, ingresa al portal con <b>${esc(d.email)}</b> y la contraseña que creaste.</p><a class="btn btn-dark" href="/mayoristas/portal">Ir al portal mayorista</a></div>`;
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (x) { err.textContent = x.message; btn.disabled = false; btn.classList.remove("loading"); }
  });

  /* ---------- Portal ---------- */
  const root = $("[data-portal]");
  if (!root) return;
  let D = null, tab = "pedido", q = "";
  let cart = lsGet("nutrell-may-cart", {});
  const saveCart = () => lsSet("nutrell-may-cart", cart);

  async function load() {
    try { D = await api("me"); render(); }
    catch (e) { if (e.status === 401) renderLogin(); else root.innerHTML = `<div class="portal-msg"><h2>No pudimos cargar el portal</h2><p>${esc(e.message)}</p></div>`; }
  }

  function renderLogin(msg = "") {
    root.innerHTML = `<div class="portal-login">
      <div class="pl-side"><span class="eyebrow">Portal mayorista</span><h1>Tus precios exclusivos, <em class="gold">a un clic</em></h1><p>Haz tus pedidos por cantidades, paga en línea y sigue tus despachos en un solo lugar.</p></div>
      <form class="pl-card" novalidate>
        <h2>Ingresar</h2>
        <label class="fld"><span>Correo</span><input name="email" type="email" autocomplete="username" required></label>
        <label class="fld"><span>Contraseña</span><input name="password" type="password" autocomplete="current-password" required></label>
        <p class="co-error">${esc(msg)}</p>
        <button class="btn btn-gold btn-block btn-pay" type="submit">${ICON.lock}Ingresar al portal</button>
        <p class="pl-links"><a href="/mayoristas#solicitud">¿Aún no eres mayorista? <b>Solicita tu cuenta</b></a><a href="#" data-forgot>¿Olvidaste tu contraseña?</a></p>
      </form></div>`;
    const f = $("form", root);
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const b = $("button", f), er = $(".co-error", f);
      b.disabled = true; b.classList.add("loading"); er.textContent = "";
      try { await api("login", { email: f.email.value, password: f.password.value }); await load(); }
      catch (x) { er.textContent = x.message; b.disabled = false; b.classList.remove("loading"); }
    });
    $("[data-forgot]", root).addEventListener("click", (e) => { e.preventDefault(); window.open(wa(window.NUTRELL?.config?.whatsapp || "", "Hola Nutrell, soy mayorista y olvidé mi contraseña del portal."), "_blank", "noopener"); });
  }

  const lines = () => D.productos.filter((p) => cart[p.id] > 0).map((p) => ({ ...p, qty: cart[p.id], total: p.precio * cart[p.id] }));
  const total = () => lines().reduce((s, l) => s + l.total, 0);

  function render() {
    const m = D.mayorista;
    root.innerHTML = `
      <div class="pt-head">
        <div><span class="eyebrow">Portal mayorista</span><h1>Hola, ${esc(m.contacto.split(" ")[0])}</h1><p>${esc(m.empresa)} · ${esc(m.ciudad)}</p></div>
        <div class="pt-tier"><small>Tu nivel</small><b>${esc(D.nivel.nombre)}</b><span>${D.nivel.descuento}% de descuento</span></div>
      </div>
      <div class="pt-tabs">${[["pedido", "Hacer pedido"], ["pedidos", `Mis pedidos${D.pedidos.length ? ` (${D.pedidos.length})` : ""}`], ["cuenta", "Mi cuenta"]].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? "on" : ""}">${l}</button>`).join("")}<button data-logout class="pt-out">${ICON.out}Salir</button></div>
      <div class="pt-body">${tab === "pedido" ? viewOrder() : tab === "pedidos" ? viewOrders() : viewAccount()}</div>`;
    $$("[data-tab]", root).forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); window.scrollTo({ top: root.offsetTop - 90, behavior: "smooth" }); });
    $("[data-logout]", root).onclick = async () => { await api("logout").catch(() => {}); D = null; renderLogin(); };
    if (tab === "pedido") wireOrder();
    if (tab === "pedidos") wireOrders();
    paintBar();
  }

  function viewOrder() {
    const list = D.productos.filter((p) => !q || `${p.nombre} ${p.categoria}`.toLowerCase().includes(q.toLowerCase()));
    return `<div class="pt-search">${ICON.search}<input placeholder="Buscar producto" value="${esc(q)}" data-q></div>
      <div class="pt-list">${list.map((p) => {
        const out = p.stock !== null && p.stock <= 0;
        return `<div class="pt-item${cart[p.id] ? " in" : ""}${out ? " out" : ""}" data-id="${p.id}">
          <img src="${esc(p.imagen)}" alt="">
          <div class="pi-info"><small>${esc(p.categoria)}</small><b>${esc(p.nombre)}</b><span>${esc(p.variante)}</span></div>
          <div class="pi-price"><s>${cop(p.publico)}</s><b>${cop(p.precio)}</b><small>c/u</small></div>
          <div class="pi-qty">${out ? '<span class="chip chip-soft">Agotado</span>' : `<button data-d="-1" aria-label="Restar">−</button><input type="number" inputmode="numeric" min="0" value="${cart[p.id] || 0}" aria-label="Cantidad de ${esc(p.nombre)}"><button data-d="1" aria-label="Sumar">+</button>`}</div>
          <div class="pi-total">${cart[p.id] ? cop(p.precio * cart[p.id]) : ""}</div>
        </div>`;
      }).join("") || '<p class="muted">No encontramos productos.</p>'}</div>
      <div class="pt-bar" data-bar></div>`;
  }
  function paintBar() {
    const bar = $("[data-bar]", root); if (!bar) return;
    const t = total(), n = lines().reduce((s, l) => s + l.qty, 0), min = D.minimo, falta = Math.max(0, min - t);
    bar.innerHTML = `<div class="pb-info"><small>${n} unidades · Total mayorista</small><b>${cop(t)}</b>
      <div class="pb-min">${falta ? `Te faltan <b>${cop(falta)}</b> para el pedido mínimo (${cop(min)})` : `<span class="ok">${ICON.check} Pedido mínimo alcanzado</span>`}<div class="bar"><i style="width:${min ? Math.min(100, (t / min) * 100) : 100}%"></i></div></div></div>
      <button class="btn btn-gold" data-review ${!n || falta ? "disabled" : ""}>Revisar pedido</button>`;
    bar.classList.toggle("show", n > 0);
    const r = $("[data-review]", bar); if (r) r.onclick = review;
  }
  function wireOrder() {
    const qi = $("[data-q]", root);
    qi.oninput = () => { q = qi.value; const pos = qi.selectionStart; render(); const n = $("[data-q]", root); n.focus(); n.setSelectionRange(pos, pos); };
    $$(".pt-item", root).forEach((row) => {
      const id = row.dataset.id, inp = $("input", row); if (!inp) return;
      const set = (v) => { v = Math.max(0, Math.min(5000, Math.round(Number(v) || 0))); const p = D.productos.find((x) => x.id === id); if (p.stock !== null && v > p.stock) { v = p.stock; toast(`Solo hay ${p.stock} unidades disponibles`); } if (v) cart[id] = v; else delete cart[id]; saveCart(); inp.value = v; row.classList.toggle("in", v > 0); $(".pi-total", row).textContent = v ? cop(p.precio * v) : ""; paintBar(); };
      $$("[data-d]", row).forEach((b) => b.onclick = () => set((cart[id] || 0) + Number(b.dataset.d)));
      inp.onchange = () => set(inp.value);
      inp.onfocus = () => inp.select();
    });
  }

  function review() {
    const m = D.mayorista, ls = lines(), t = total();
    const modal = document.createElement("div"); modal.className = "pt-modal";
    modal.innerHTML = `<div class="pm-card" role="dialog" aria-modal="true">
      <div class="pm-head"><h2>Confirmar pedido</h2><button class="icon-btn" data-x aria-label="Cerrar">${ICON.x}</button></div>
      <div class="pm-body">
        <div class="pm-lines">${ls.map((l) => `<div><span>${l.qty} × ${esc(l.nombre)}</span><b>${cop(l.total)}</b></div>`).join("")}<div class="tot"><span>Total mayorista</span><b>${cop(t)}</b></div><small class="muted">El envío se confirma según tu ciudad y volumen.</small></div>
        <p class="co-title">Entrega</p>
        <div class="fld-row"><label class="fld"><span>Ciudad</span><input name="ciudad" value="${esc(m.ciudad)}"></label><label class="fld"><span>Dirección</span><input name="direccion" value="${esc(m.direccion)}"></label></div>
        <label class="fld"><span>Notas</span><textarea name="notas" rows="2" placeholder="Horario de recibo, contacto en bodega…"></textarea></label>
        <p class="co-title">Método de pago</p>
        <div class="pay-list">${D.metodos.map((x, i) => `<label class="pay-card${x.id === "online" ? " featured" : ""}"><input type="radio" name="metodo" value="${x.id}"${i === 0 ? " checked" : ""}><span class="pc-radio"></span><span class="pc-body"><span class="pc-head"><b>${esc(x.nombre)}</b>${x.id === "online" ? `<span class="pc-tag">${ICON.lock}Seguro</span>` : ""}</span><small>${esc(x.detalle)}</small></span></label>`).join("") || '<p class="muted">No hay métodos de pago disponibles. Escríbenos por WhatsApp.</p>'}</div>
        <p class="co-error" data-err></p>
      </div>
      <div class="pm-foot"><button class="btn btn-gold btn-block btn-pay" data-confirm ${D.metodos.length ? "" : "disabled"}></button></div>
    </div>`;
    document.body.appendChild(modal); document.body.style.overflow = "hidden";
    const close = () => { modal.remove(); document.body.style.overflow = ""; };
    modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-x]")) close(); });
    const btn = $("[data-confirm]", modal);
    const label = () => { const mt = $("input[name=metodo]:checked", modal)?.value; btn.innerHTML = mt === "online" ? `${ICON.lock}Pagar ${cop(t)} de forma segura` : `Confirmar pedido · ${cop(t)}`; };
    $$("input[name=metodo]", modal).forEach((r) => r.onchange = label); label();
    btn.onclick = async () => {
      const metodo = $("input[name=metodo]:checked", modal)?.value, er = $("[data-err]", modal);
      btn.disabled = true; btn.classList.add("loading"); er.textContent = "";
      try {
        const r = await api("pedido", { items: ls.map((l) => ({ id: l.id, qty: l.qty })), metodo, ciudad: $("[name=ciudad]", modal).value, direccion: $("[name=direccion]", modal).value, notas: $("[name=notas]", modal).value });
        cart = {}; saveCart();
        if (r.pay) { btn.innerHTML = "Abriendo pago seguro de Wompi…"; toWompi(r.pay); return; }
        $(".pm-card", modal).innerHTML = `<div class="ws-done"><div class="ps-ico">${ICON.check}</div><h3>¡Pedido #${r.numero} recibido!</h3><p>Total: <b>${cop(r.total)}</b> · ${esc(r.metodoPago)}</p><p class="muted">${metodo === "transferencia" ? esc(D.metodos.find((x) => x.id === "transferencia")?.detalle || "") : "Tu asesor confirmará el despacho."}</p>
          <a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="${wa(D.whatsapp, `Hola Nutrell, soy ${m.contacto} de ${m.empresa}. Acabo de hacer el pedido mayorista #${r.numero} por ${cop(r.total)} (${r.metodoPago}).`)}">${ICON.wa}Avisar a mi asesor por WhatsApp</a>
          <button class="btn btn-outline btn-block" data-x>Cerrar</button></div>`;
        D = await api("me"); tab = "pedidos"; render();
      } catch (x) { er.textContent = x.message; btn.disabled = false; btn.classList.remove("loading"); }
    };
  }

  function viewOrders() {
    if (!D.pedidos.length) return `<div class="portal-msg"><h2>Aún no tienes pedidos</h2><p>Tu primer pedido aparecerá aquí con su estado y número de guía.</p><button class="btn btn-gold" data-tab="pedido">Hacer mi primer pedido</button></div>`;
    return `<div class="pt-orders">${D.pedidos.map((o) => `<div class="po">
      <div class="po-h"><b>#${o.numero}</b><span class="muted">${new Date(o.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}</span><span class="po-badge s-${o.estado}">${ESTADO[o.estado] || o.estado}</span><span class="po-badge p-${o.pago}">${PAGO[o.pago] || o.pago}</span></div>
      <p class="po-items">${o.items.map((i) => `${i.cantidad} × ${esc(i.nombre)}`).join(" · ")}</p>
      ${o.guia ? `<p class="po-guia">Guía: <b>${esc(o.guia)}</b>${o.transportadora ? ` · ${esc(o.transportadora)}` : ""}</p>` : ""}
      <div class="po-f"><b>${cop(o.total)}</b><span class="muted">${esc(o.metodoPago)}</span>
        ${o.online && o.pago !== "pagado" && o.estado !== "cancelado" ? `<button class="btn btn-gold btn-sm" data-pay="${o.numero}">Pagar ahora</button>` : ""}
        <button class="btn btn-outline btn-sm" data-again="${o.numero}">Repetir pedido</button></div>
    </div>`).join("")}</div>`;
  }
  function wireOrders() {
    $$("[data-again]", root).forEach((b) => b.onclick = () => {
      const o = D.pedidos.find((x) => String(x.numero) === b.dataset.again);
      o.items.forEach((i) => { if (D.productos.some((p) => p.id === i.id)) cart[i.id] = (cart[i.id] || 0) + i.cantidad; });
      saveCart(); tab = "pedido"; render(); toast("Agregamos los productos del pedido #" + o.numero);
    });
    $$("[data-pay]", root).forEach((b) => b.onclick = async () => { b.disabled = true; try { const r = await api("pagar", { numero: b.dataset.pay }); toWompi(r.pay); } catch (x) { toast(x.message); b.disabled = false; } });
  }
  function viewAccount() {
    const m = D.mayorista;
    return `<div class="pt-account">
      <div class="pa-card"><h3>Mi negocio</h3><dl><dt>Empresa</dt><dd>${esc(m.empresa)}</dd><dt>NIT / cédula</dt><dd>${esc(m.nit || "—")}</dd><dt>Tipo</dt><dd>${esc(m.tipo)}</dd><dt>Contacto</dt><dd>${esc(m.contacto)}</dd><dt>Celular</dt><dd>${esc(m.telefono)}</dd><dt>Correo</dt><dd>${esc(m.email)}</dd><dt>Ciudad</dt><dd>${esc(m.ciudad)}${m.departamento ? ", " + esc(m.departamento) : ""}</dd><dt>Dirección</dt><dd>${esc(m.direccion || "—")}</dd></dl></div>
      <div class="pa-card"><h3>Mis condiciones</h3><dl><dt>Nivel</dt><dd>${esc(D.nivel.nombre)}</dd><dt>Descuento</dt><dd>${D.nivel.descuento}% sobre precio público</dd><dt>Pedido mínimo</dt><dd>${cop(D.minimo)}</dd><dt>Crédito</dt><dd>${m.credito?.activo ? `${m.credito.dias} días${m.credito.cupo ? ` · cupo ${cop(m.credito.cupo)}` : ""}` : "No habilitado"}</dd></dl>
        <a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="${wa(D.whatsapp, `Hola Nutrell, soy ${m.contacto} de ${m.empresa} (mayorista). Necesito ayuda con mi cuenta.`)}">${ICON.wa}Hablar con mi asesor</a>
        <p class="muted" style="font-size:.82rem;margin:10px 0 0">Para actualizar tus datos o cambiar tu contraseña, escríbenos.</p></div>
    </div>`;
  }

  load();
})();
