const { GoogleGenerativeAI } = require("@google/generative-ai");

function buildPrompt({ perfil, prendas }) {
  const items = prendas.map((p) => ({
    id: p.Id,
    nombre: p.Nombre,
    categoria: p.Categoria,
    color: p.Color,
    precio: Number(p.Precio),
    tags: p.Tags || [],
  }));

  return `
Eres un asesor de imagen profesional y estilista.
Quiero que generes recomendaciones PERSONALIZADAS usando:
- Perfil del usuario (tipo de cuerpo, medidas, subtono, estilo, presupuesto, prendas a evitar)
- Un catálogo real de prendas con colores, precios y tags

REGLAS:
1) Devuelve SOLO JSON válido (sin texto extra, sin markdown).
2) Recomienda outfits coherentes con:
   - tipo_cuerpo: ${perfil.TipoCuerpo || "desconocido"}
   - subtono: ${perfil.SubTono || "neutro"}
   - tono_piel: ${perfil.TonoPiel || "no indicado"}
   - estilo: ${perfil.EstiloPrincipal || "casual"}
   - presupuesto_min: ${perfil.PresupuestoMin ?? 0}
   - presupuesto_max: ${perfil.PresupuestoMax ?? 999999}
   - prendas_no_usa: ${perfil.PrendasNoUsa || ""}
3) Cada outfit debe incluir 3 a 5 prendas del catálogo (por id) y explicar el porqué.
4) Incluye consejos: colores recomendados, cortes, y 2 “errores a evitar”.
5) Si faltan datos del perfil, asume lo mínimo y dilo en "notas".

FORMATO JSON EXACTO:
{
  "outfits": [
    {
      "nombre": "string",
      "prendas": [
        { "id": number, "motivo": "string breve" }
      ],
      "explicacion": "string",
      "colores_clave": ["string", "string"],
      "total_estimado": number
    }
  ],
  "consejos_rapidos": ["string", "string", "string"],
  "errores_a_evitar": ["string", "string"],
  "notas": "string"
}

CATALOGO (JSON):
${JSON.stringify(items).slice(0, 12000)}
`;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(text.slice(first, last + 1));
    }
    throw new Error("Gemini no devolvió JSON válido");
  }
}

async function geminiOutfits({ perfil, prendas }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en .env");

  const genAI = new GoogleGenerativeAI(apiKey);

  // ✅ IMPORTANTE:
  // Tu error fue porque gemini-1.5-flash no está disponible/soportado en tu endpoint.
  // Usamos fallback automático para que siempre intente modelos compatibles.
  const candidates = [
    process.env.GEMINI_MODEL, // el que configures en .env
    "gemini-1.5-pro",
    "gemini-1.0-pro",
  ].filter(Boolean);

  const prompt = buildPrompt({ perfil, prendas });

  let lastErr = null;

  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 900,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return safeParseJson(text);
    } catch (err) {
      lastErr = err;

      const msg = String(err?.message || err);

      // Si el modelo no existe o no soporta generateContent → probamos el siguiente
      if (
        msg.includes("not found") ||
        msg.includes("not supported") ||
        msg.includes("ListModels")
      ) {
        continue;
      }

      // Otros errores (API key inválida, red, permisos) → salimos ya
      throw err;
    }
  }

  throw new Error(
    `No se pudo usar ningún modelo Gemini. Último error: ${lastErr?.message || lastErr}`
  );
}

module.exports = { geminiOutfits };
