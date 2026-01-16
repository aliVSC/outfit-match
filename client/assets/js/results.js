requireAuth();

const msg = document.getElementById("msg");
const content = document.getElementById("content");
const aiBtn = document.getElementById("aiBtn");
const aiBox = document.getElementById("aiBox");

// ✅ mapa de imágenes por tipo de cuerpo
const bodyTypeImages = {
  pera: "assets/img/body/pera.png",
  manzana: "assets/img/body/manzana.png",
  reloj_arena: "assets/img/body/reloj_arena.png",
  rectangulo: "assets/img/body/rectangulo.png",
  triangulo_invertido: "assets/img/body/triangulo_invertido.png",
  desconocido: "assets/img/body/default.png",
};

function setBodyTypeImage(tipo) {
  const img = document.getElementById("bodyTypeImg");
  if (!img) return;

  const key = (tipo || "desconocido").toLowerCase().trim();
  img.src = bodyTypeImages[key] || "assets/img/body/default.png";
  img.alt = `Tipo de cuerpo: ${prettyTipo(key)}`;
}

function toCssColor(name) {
  const map = {
    beige: "#d9c4a7",
    camel: "#c19a6b",
    marrón: "#7a4a2b",
    marfil: "#f4efe6",
    negro: "#111111",
    gris: "#8d8d8d",
    "blanco puro": "#ffffff",
    "blanco hueso": "#f5f1ea",
    taupe: "#b8a89a",
    "azul denim": "#4a6fa5",
    "azul marino": "#14213d",

    mostaza: "#d4a017",
    terracota: "#c96b4b",
    "verde oliva": "#6b7b3d",
    "rojo ladrillo": "#b23a2f",
    naranja: "#f08c2b",

    vino: "#6d0f2c",
    "azul rey": "#1d4ed8",
    esmeralda: "#10b981",
    morado: "#6d28d9",

    "verde bosque": "#1f4d3a",
    "rosa palo": "#d8a7b1",
    "azul petróleo": "#1f6f78",
    "plateado muy frío": "#cfd8dc",
    "fucsia azulado": "#c2185b",
    "neones extremos": "#39ff14",
  };

  const key = (name || "").toLowerCase().trim();
  return map[key] || "#e9e2d9";
}

function colorChipList(el, arr) {
  if (!el) return;
  el.innerHTML = "";
  (arr || []).forEach((name) => {
    const chip = document.createElement("span");
    chip.className = "color-chip";
    chip.innerHTML = `<span class="swatch" style="background:${toCssColor(
      name
    )};"></span>${name}`;
    el.appendChild(chip);
  });
}

function pillList(el, arr) {
  if (!el) return;
  el.innerHTML = "";
  (arr || []).forEach((x) => {
    const s = document.createElement("span");
    s.className = "pill";
    s.textContent = x;
    el.appendChild(s);
  });
}

function prettyTipo(tipo) {
  const map = {
    reloj_arena: "Reloj de arena",
    pera: "Pera",
    manzana: "Manzana",
    rectangulo: "Rectángulo",
    triangulo_invertido: "Triángulo invertido",
    desconocido: "No determinado",
  };
  return map[tipo] || tipo || "No determinado";
}

(async function load() {
  msg.innerHTML = "";
  try {
    const r = await api("/api/recommend/my-recommendation");
    content.style.display = "block";

    document.getElementById("tipo").textContent = `Tipo de cuerpo: ${prettyTipo(
      r.tipoCuerpo
    )}`;

    // ✅ Imagen tipo de cuerpo
    setBodyTypeImage(r.tipoCuerpo);

    pillList(document.getElementById("ideal"), r.tips?.ideal);
    pillList(document.getElementById("evita"), r.tips?.evita);

    colorChipList(document.getElementById("base"), r.palette?.base);
    colorChipList(document.getElementById("fuertes"), r.palette?.fuertes);
    colorChipList(document.getElementById("palEvita"), r.palette?.evita);
  } catch (err) {
    msg.innerHTML = `<div class="alert">${err.message}. Completa tu perfil primero.</div>`;
  }
})();

aiBtn?.addEventListener("click", async () => {
  aiBox.innerHTML = "";
  aiBtn.disabled = true;
  aiBtn.textContent = "Generando...";

  try {
    const r = await api("/api/recommend/ai-outfits", {
      method: "POST",
      body: {},
    });

    const outfits = r.outfits || [];
    if (!outfits.length) {
      aiBox.innerHTML = `<div class="alert">La IA no devolvió outfits. Revisa tu endpoint.</div>`;
      return;
    }

    aiBox.innerHTML = outfits
      .map((o) => {
        const pills = (o.prendas || [])
          .map((p) => `<span class="pill">#${p.id}${p.nombre ? " " + p.nombre : ""}</span>`)
          .join("");

        return `
          <div class="card" style="padding:14px; margin-top:10px;">
            <h3 style="margin:0 0 6px;">${o.nombre || "Outfit"}</h3>
            <div class="muted" style="font-size:13px; margin-bottom:10px;">
              ${o.explicacion || o.razon || ""}
            </div>
            <div class="pills">${pills}</div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    aiBox.innerHTML = `<div class="alert">${err.message}</div>`;
  } finally {
    aiBtn.disabled = false;
    aiBtn.textContent = "Recomendar outfits con IA";
  }
});
