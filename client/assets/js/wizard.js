requireAuth();

const steps = Array.from(document.querySelectorAll(".step"));
const bar = document.getElementById("bar");
const msg = document.getElementById("msg");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const saveBtn = document.getElementById("saveBtn");

let current = 1;

// -----------------------------
// Wizard steps
// -----------------------------
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

function val(id) {
  return (document.getElementById(id)?.value ?? "").trim();
}

function toNum(id) {
  const v = val(id);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getFormData() {
  return {
    // ✅ nuevos
    nombresApellidos: val("nombresApellidos"),
    rangoEdad: val("rangoEdad"),

    // medidas
    estaturaCm: toNum("estaturaCm"),
    hombrosCm: toNum("hombrosCm"),
    pechoCm: toNum("pechoCm"),
    cinturaCm: toNum("cinturaCm"),
    caderaCm: toNum("caderaCm"),

    // colorimetría (sin subtono)
    tonoPiel: val("tonoPiel"),
    colorOjos: val("colorOjos"),
    colorCabello: val("colorCabello"),
    coloresFavoritos: val("coloresFavoritos"),

    // extra solo UI
    objetivo: val("objetivo"),

    // ✅ foto opcional (base64)
    fotoBase64: val("fotoBase64"),
  };
}

function validateStep(n) {
  if (msg) msg.innerHTML = "";

  // Paso 1: datos cliente + medidas mínimas para bodytype
  if (n === 1) {
    if (!val("nombresApellidos")) {
      if (msg) msg.innerHTML = `<div class="alert">Ingresa Nombres y apellidos.</div>`;
      return false;
    }

    const hombros = toNum("hombrosCm");
    const pecho = toNum("pechoCm");
    const cintura = toNum("cinturaCm");
    const cadera = toNum("caderaCm");

    if (!hombros || !pecho || !cintura || !cadera) {
      if (msg) {
        msg.innerHTML = `<div class="alert">Completa hombros, pecho, cintura y cadera para detectar el tipo de cuerpo.</div>`;
      }
      return false;
    }
  }

  // Paso 2: tono de piel recomendado pero no obligatorio
  if (n === 2) {
    // Si lo quieres obligatorio, descomenta:
    // if (!val("tonoPiel")) {
    //   if (msg) msg.innerHTML = `<div class="alert">Selecciona el tono de piel.</div>`;
    //   return false;
    // }
  }

  // Paso 3: foto opcional (no valida nada)
  return true;
}

function renderSummary() {
  const d = getFormData();
  const s = document.getElementById("summary");
  if (!s) return;

  const edad = d.rangoEdad ? d.rangoEdad : "—";
  const tono = d.tonoPiel ? d.tonoPiel : "—";
  const foto = d.fotoBase64 ? "Sí" : "No";

  s.innerHTML = `
    <div class="kv">
      <div><b>Cliente:</b> ${d.nombresApellidos || "—"} | <b>Edad:</b> ${edad}</div>
      <div><b>Medidas (cm):</b> Hombros ${d.hombrosCm ?? "—"} / Pecho ${d.pechoCm ?? "—"} / Cintura ${d.cinturaCm ?? "—"} / Cadera ${d.caderaCm ?? "—"}</div>
      <div><b>Colorimetría:</b> Tono ${tono} | Ojos ${d.colorOjos || "—"} | Cabello ${d.colorCabello || "—"}</div>
      <div><b>Colores favoritos:</b> ${d.coloresFavoritos || "—"} | <b>Objetivo:</b> ${d.objetivo || "—"}</div>
      <div><b>Foto para probador:</b> ${foto}</div>
    </div>
  `;
}

// botones
if (prevBtn) prevBtn.addEventListener("click", () => showStep(Math.max(1, current - 1)));

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
      // Backend actual: /api/profile/me
      // ✅ quitamos "objetivo" si tu DB no lo tiene
      const payload = { ...data };
      delete payload.objetivo;

      // Si tu backend todavía NO acepta nombres/edad/foto,
      // igual lo enviamos; en server puedes ignorarlo sin romper.
      const r = await api("/api/profile/me", {
        method: "PUT",
        body: payload,
      });

      if (msg) msg.innerHTML = `<div class="ok">Perfil guardado. Tipo de cuerpo detectado: <b>${r.tipoCuerpo}</b></div>`;
      setTimeout(() => (window.location.href = "results.html"), 700);
    } catch (err) {
      if (msg) msg.innerHTML = `<div class="alert">${err.message}</div>`;
    }
  });
}

// -----------------------------
// Select personalizado tono de piel (swatches)
// -----------------------------
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

(function skinToneSelect() {
  const box = document.getElementById("tonoPielBox");
  if (!box) return;

  const btn = document.getElementById("tonoPielBtn");
  const menu = document.getElementById("tonoPielMenu");
  const hidden = document.getElementById("tonoPiel");
  const label = document.getElementById("tonoPielLabel");
  if (!btn || !menu || !hidden || !label) return;

  function close() {
    box.classList.remove("open");
  }

  btn.addEventListener("click", () => box.classList.toggle("open"));

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

// -----------------------------
// FOTO (cámara) - opcional
// -----------------------------
let stream = null;

const cam = document.getElementById("cam");
const shot = document.getElementById("shot");
const fotoBase64 = document.getElementById("fotoBase64");

const startCamBtn = document.getElementById("startCamBtn");
const snapBtn = document.getElementById("snapBtn");
const stopCamBtn = document.getElementById("stopCamBtn");

async function startCam() {
  if (!cam) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    if (msg) msg.innerHTML = `<div class="alert">Tu navegador no soporta cámara.</div>`;
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    cam.srcObject = stream;
  } catch (err) {
    if (msg) msg.innerHTML = `<div class="alert">No se pudo acceder a la cámara: ${err.message}</div>`;
  }
}

function stopCam() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  if (cam) cam.srcObject = null;
}

function takePhoto() {
  if (!cam || !shot || !fotoBase64) return;
  const w = cam.videoWidth || 640;
  const h = cam.videoHeight || 480;

  shot.width = w;
  shot.height = h;

  const ctx = shot.getContext("2d");
  ctx.drawImage(cam, 0, 0, w, h);

  // base64 png
  const dataUrl = shot.toDataURL("image/png");
  fotoBase64.value = dataUrl;
  if (msg) msg.innerHTML = `<div class="ok">Foto capturada ✅</div>`;
}

startCamBtn?.addEventListener("click", startCam);
stopCamBtn?.addEventListener("click", stopCam);
snapBtn?.addEventListener("click", takePhoto);

// -----------------------------
// Preload (si ya hay perfil)
// -----------------------------
(async function preload() {
  try {
    const p = await api("/api/profile/me");
    if (p) {
      // Si tu backend no tiene estos campos, simplemente no cargará nada
      setIf(p.NombresApellidos || p.Nombres || p.Nombre, "nombresApellidos");
      setIf(p.RangoEdad, "rangoEdad");

      setIf(p.EstaturaCm, "estaturaCm");
      setIf(p.HombrosCm, "hombrosCm");
      setIf(p.PechoCm, "pechoCm");
      setIf(p.CinturaCm, "cinturaCm");
      setIf(p.CaderaCm, "caderaCm");

      // Colorimetría
      if (p.TonoPiel) {
        setIf(p.TonoPiel, "tonoPiel");
        setSkinToneUI(p.TonoPiel);
      }
      setIf(p.ColorOjos, "colorOjos");
      setIf(p.ColorCabello, "colorCabello");
      setIf(p.ColoresFavoritos, "coloresFavoritos");

      // Foto (si algún día la guardas en DB y la regresas)
      // setIf(p.FotoBase64, "fotoBase64");
    }
  } catch {
    // nada
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
