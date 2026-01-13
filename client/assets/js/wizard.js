requireAuth();

const steps = Array.from(document.querySelectorAll(".step"));
const bar = document.getElementById("bar");
const msg = document.getElementById("msg");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const saveBtn = document.getElementById("saveBtn");

let current = 1;

function showStep(n) {
  steps.forEach(
    (s) => (s.style.display = Number(s.dataset.step) === n ? "block" : "none")
  );
  current = n;

  const pct = Math.round(((n - 1) / (steps.length - 1)) * 100);
  if (bar) bar.style.width = `${pct}%`;

  if (prevBtn) prevBtn.style.display = n === 1 ? "none" : "inline-block";
  if (nextBtn) nextBtn.style.display = n === steps.length ? "none" : "inline-block";
  if (saveBtn) saveBtn.style.display = n === steps.length ? "inline-block" : "none";

  if (n === steps.length) renderSummary();
}

function getFormData() {
  return {
    estaturaCm: toNum("estaturaCm"),
    hombrosCm: toNum("hombrosCm"),
    pechoCm: toNum("pechoCm"),
    cinturaCm: toNum("cinturaCm"),
    caderaCm: toNum("caderaCm"),

    // IMPORTANTE: tonoPiel viene del hidden input #tonoPiel (select personalizado)
    tonoPiel: val("tonoPiel"),
    subTono: val("subTono"),
    colorOjos: val("colorOjos"),
    colorCabello: val("colorCabello"),

    estiloPrincipal: val("estiloPrincipal"),
    coloresFavoritos: val("coloresFavoritos"),
    prendasNoUsa: val("prendasNoUsa"),
    presupuestoMin: toNum("presupuestoMin"),
    presupuestoMax: toNum("presupuestoMax"),

    // No está en DB actualmente, pero lo usamos en resumen
    objetivo: val("objetivo"),
  };
}

function val(id) {
  return (document.getElementById(id)?.value ?? "").trim();
}

function toNum(id) {
  const v = val(id);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function validateStep(n) {
  if (msg) msg.innerHTML = "";

  if (n === 1) {
    const hombros = toNum("hombrosCm");
    const pecho = toNum("pechoCm");
    const cintura = toNum("cinturaCm");
    const cadera = toNum("caderaCm");
    if (!hombros || !pecho || !cintura || !cadera) {
      if (msg) {
        msg.innerHTML = `<div class="alert">Completa hombros, pecho, cintura y cadera para detectar tu tipo de cuerpo.</div>`;
      }
      return false;
    }
  }

  if (n === 2) {
    // Validar subtono
    if (!val("subTono")) {
      if (msg) {
        msg.innerHTML = `<div class="alert">Selecciona tu subtono (cálido/frío/neutro) para recomendarte colores.</div>`;
      }
      return false;
    }

    // Opcional: validar tono de piel si quieres obligatorio (si lo quieres, descomenta)
    // if (!val("tonoPiel")) {
    //   if (msg) msg.innerHTML = `<div class="alert">Selecciona tu tono de piel.</div>`;
    //   return false;
    // }
  }

  if (n === 3) {
    const min = toNum("presupuestoMin");
    const max = toNum("presupuestoMax");
    if (min != null && max != null && min > max) {
      if (msg) {
        msg.innerHTML = `<div class="alert">Tu presupuesto mínimo no puede ser mayor que el máximo.</div>`;
      }
      return false;
    }
  }

  return true;
}

function renderSummary() {
  const d = getFormData();
  const s = document.getElementById("summary");
  if (!s) return;

  s.innerHTML = `
    <div class="kv">
      <div><b>Medidas:</b> Hombros ${d.hombrosCm ?? "—"} / Pecho ${
    d.pechoCm ?? "—"
  } / Cintura ${d.cinturaCm ?? "—"} / Cadera ${d.caderaCm ?? "—"} cm</div>
      <div><b>Colorimetría:</b> Subtono ${d.subTono || "—"} | Tono ${
    d.tonoPiel || "—"
  }</div>
      <div><b>Estilo:</b> ${d.estiloPrincipal || "—"} | <b>Objetivo:</b> ${
    d.objetivo || "—"
  }</div>
      <div><b>Presupuesto:</b> ${d.presupuestoMin ?? "—"} a ${
    d.presupuestoMax ?? "—"
  }</div>
    </div>
  `;
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => showStep(Math.max(1, current - 1)));
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (!validateStep(current)) return;
    showStep(Math.min(steps.length, current + 1));
  });
}

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    if (msg) msg.innerHTML = "";
    const data = getFormData();

    try {
      // Guardar en backend (sin objetivo)
      const payload = { ...data };
      delete payload.objetivo;

      const r = await api("/api/profile/me", {
        method: "PUT",
        body: payload,
      });

      if (msg) {
        msg.innerHTML = `<div class="ok">Perfil guardado. Tipo de cuerpo detectado: <b>${r.tipoCuerpo}</b></div>`;
      }
      setTimeout(() => (window.location.href = "results.html"), 700);
    } catch (err) {
      if (msg) msg.innerHTML = `<div class="alert">${err.message}</div>`;
    }
  });
}

// ----------- UI helpers para tono de piel (precarga + label bonito) -----------
function setSkinToneUI(value) {
  const map = {
    clara: "#f5d7c5",
    media: "#e3b38f",
    morena: "#c58b5a",
    oscura: "#7a4a2b",
  };

  const label = document.getElementById("tonoPielLabel");
  const hidden = document.getElementById("tonoPiel");
  if (!label || !hidden || value === null || value === undefined) return;

  const v = String(value).toLowerCase().trim();
  const color = map[v] || "#e9e2d9";

  hidden.value = v;
  label.innerHTML = `
    <span style="display:flex; align-items:center; gap:10px;">
      <span class="swatch" style="background:${color};"></span>
      <span>${v.charAt(0).toUpperCase() + v.slice(1)}</span>
    </span>
  `;
}

// Precargar si ya hay perfil
(async function preload() {
  try {
    const p = await api("/api/profile/me");
    if (p) {
      // Medidas
      setIf(p.EstaturaCm, "estaturaCm");
      setIf(p.HombrosCm, "hombrosCm");
      setIf(p.PechoCm, "pechoCm");
      setIf(p.CinturaCm, "cinturaCm");
      setIf(p.CaderaCm, "caderaCm");

      // Colorimetría
      setIf(p.TonoPiel, "tonoPiel");  // hidden input
      setSkinToneUI(p.TonoPiel);      // UI bonito con swatch
      setIf(p.SubTono, "subTono");
      setIf(p.ColorOjos, "colorOjos");
      setIf(p.ColorCabello, "colorCabello");

      // Preferencias
      setIf(p.EstiloPrincipal, "estiloPrincipal");
      setIf(p.ColoresFavoritos, "coloresFavoritos");
      setIf(p.PrendasNoUsa, "prendasNoUsa");
      setIf(p.PresupuestoMin, "presupuestoMin");
      setIf(p.PresupuestoMax, "presupuestoMax");
    }
  } catch {
    // si falla, no pasa nada
  } finally {
    showStep(1);
  }
})();

function setIf(value, id) {
  if (value === null || value === undefined) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value;
}

// ------- Select personalizado: tono de piel con swatches -------
(function skinToneSelect() {
  const box = document.getElementById("tonoPielBox");
  if (!box) return; // si no existe el HTML del select personalizado, no hace nada

  const btn = document.getElementById("tonoPielBtn");
  const menu = document.getElementById("tonoPielMenu");
  const hidden = document.getElementById("tonoPiel");
  const label = document.getElementById("tonoPielLabel");

  if (!btn || !menu || !hidden || !label) return;

  function close() {
    box.classList.remove("open");
  }

  btn.addEventListener("click", () => {
    box.classList.toggle("open");
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest(".option");
    if (!opt) return;

    const value = (opt.dataset.value || "").toLowerCase().trim();
    const color = opt.dataset.color || "#e9e2d9";
    hidden.value = value;

    label.innerHTML = `
      <span style="display:flex; align-items:center; gap:10px;">
        <span class="swatch" style="background:${color};"></span>
        <span>${opt.querySelector(".label")?.textContent || value}</span>
      </span>
    `;

    close();
  });

  document.addEventListener("click", (e) => {
    if (!box.contains(e.target)) close();
  });
})();
