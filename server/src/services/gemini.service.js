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

  // ⚠️ prompt más estricto (y con ejemplo)
  return `
Eres un asesor de imagen profesional y estilista.
Tu tarea: generar recomendaciones PERSONALIZADAS basadas en el PERFIL y el CATÁLOGO.

REGLA CRÍTICA:
- Responde ÚNICAMENTE con JSON válido.
- NO incluyas texto extra.
- NO incluyas markdown.
- NO uses \`\`\`.
- El primer carácter de tu respuesta debe ser { y el último debe ser }.

PERFIL:
- tipo_cuerpo: ${perfil.TipoCuerpo || "desconocido"}
- subtono: ${perfil.SubTono || "neutro"}
- tono_piel: ${perfil.TonoPiel || "no indicado"}
- estilo: ${perfil.EstiloPrincipal || "casual"}
- presupuesto_min: ${perfil.PresupuestoMin ?? 0}
- presupuesto_max: ${perfil.PresupuestoMax ?? 999999}
- prendas_no_usa: ${perfil.PrendasNoUsa || ""}

REGLAS DE RECOMENDACIÓN:
- Genera 2 a 4 outfits.
- Cada outfit debe incluir 3 a 5 prendas del catálogo (por id).
- Evita prendas que el usuario no usa.
- Mantente dentro del presupuesto (total_estimado debe respetar max en lo posible).
- Explica por qué favorece al tipo de cuerpo y por qué los colores combinan con el subtono.

FORMATO JSON EXACTO (sin campos extra):
{
  "outfits": [
    {
      "nombre": "string",
      "prendas": [
        { "id": 1, "motivo": "string breve" }
      ],
      "explicacion": "string",
      "colores_clave": ["string", "string"],
      "total_estimado": 0
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

// ✅ Parser más tolerante (acepta ```json ...``` y extrae { ... })
function safeParseJson(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Gemini devolvió una respuesta vacía");
  }

  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  // 1) intento directo
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 2) extraer primer bloque { ... }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    const slice = cleaned.slice(first, last + 1);
    return JSON.parse(slice);
  }

  throw new Error("Gemini no devolvió JSON válido");
}

// ✅ Si falla, hacemos “reparación” pidiendo a Gemini que convierta a JSON
async function repairToJson(model, rawText) {
  const repairPrompt = `
Convierte el siguiente contenido en JSON válido con el formato EXACTO indicado.
Reglas:
- Devuelve SOLO JSON (sin markdown, sin texto).
- Debe comenzar con { y terminar con }.
- No inventes campos extra.

FORMATO JSON EXACTO:
{
  "outfits": [
    {
      "nombre": "string",
      "prendas": [
        { "id": 1, "motivo": "string breve" }
      ],
      "explicacion": "string",
      "colores_clave": ["string", "string"],
      "total_estimado": 0
    }
  ],
  "consejos_rapidos": ["string", "string", "string"],
  "errores_a_evitar": ["string", "string"],
  "notas": "string"
}

CONTENIDO A CONVERTIR:
${rawText}
`;

  const result = await model.generateContent(repairPrompt);
  return result.response.text();
}

async function geminiOutfits({ perfil, prendas }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en .env");

  const genAI = new GoogleGenerativeAI(apiKey);

  // ✅ usa el modelo real que ya configuraste
  const modelName = process.env.GEMINI_MODEL;
  if (!modelName) {
    throw new Error("Falta GEMINI_MODEL en .env (usa models/... del listado)");
  }

  // ✅ configuración más estable para JSON
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.55, // 👈 bajamos para respuestas estructuradas
      topP: 0.9,
      maxOutputTokens: 900,
    },
  });

  const prompt = buildPrompt({ perfil, prendas });

  // 1) Primer intento
  const result1 = await model.generateContent(prompt);
  const text1 = result1.response.text();

  try {
    return safeParseJson(text1);
  } catch (e1) {
    // 2) Reparación (segundo intento usando el texto anterior)
    const repairedText = await repairToJson(model, text1);
    return safeParseJson(repairedText);
  }
}

module.exports = { geminiOutfits };
