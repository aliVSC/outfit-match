requireAuth();

const msg = document.getElementById("msg");
const itemsEl = document.getElementById("items");
const searchEl = document.getElementById("search");
const reloadBtn = document.getElementById("reloadBtn");

let allItems = [];

function render(list) {
  itemsEl.innerHTML = "";

  if (!list.length) {
    itemsEl.innerHTML = `<div class="alert">No hay prendas recomendadas con tu perfil actual. Ajusta presupuesto o revisa tags/stock.</div>`;
    return;
  }

  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="top">
        <div>
          <div style="font-weight:800;">${p.Nombre}</div>
          <div class="muted" style="font-size:13px;">${p.Categoria} • ${p.Color}</div>
        </div>
        <div class="price">$${Number(p.Precio).toFixed(2)}</div>
      </div>
      <div class="kv">
        <div>Stock: ${p.Stock}</div>
        <div>ID: ${p.Id}</div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn small" onclick="alert('Aquí puedes implementar favoritos luego')">Favorito</button>
        <button class="btn small primary" onclick="alert('Aquí puedes armar outfit con 2-3 prendas')">Agregar a outfit</button>
      </div>
    `;
    itemsEl.appendChild(div);
  });
}

async function load() {
  msg.innerHTML = "";
  itemsEl.innerHTML = "";

  try {
    const r = await api("/api/catalog/smart");
    allItems = r.items || [];
    render(allItems);
  } catch (err) {
    msg.innerHTML = `<div class="alert">${err.message}. Completa tu perfil o revisa el endpoint.</div>`;
  }
}

function applySearch() {
  const q = searchEl.value.trim().toLowerCase();
  if (!q) return render(allItems);

  const filtered = allItems.filter(p => {
    const s = `${p.Nombre} ${p.Categoria} ${p.Color}`.toLowerCase();
    return s.includes(q);
  });
  render(filtered);
}

searchEl.addEventListener("input", applySearch);
reloadBtn.addEventListener("click", load);

load();
