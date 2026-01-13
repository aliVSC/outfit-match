require("dotenv").config();

(async () => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Falta GEMINI_API_KEY en .env");

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
      key
    )}`;

    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok) {
      throw new Error(
        `HTTP ${r.status} ${r.statusText}: ${JSON.stringify(data)}`
      );
    }

    const models = data.models || [];
    console.log("\nMODELOS DISPONIBLES (filtrando los que soportan generateContent):\n");

    const usable = models.filter((m) =>
      (m.supportedGenerationMethods || []).includes("generateContent")
    );

    if (!usable.length) {
      console.log("❌ No se encontró ningún modelo con generateContent en esta API Key.");
      console.log("Salida completa (primeros 3):", models.slice(0, 3));
      return;
    }

    for (const m of usable) {
      console.log(`- ${m.name} | methods: ${(m.supportedGenerationMethods || []).join(", ")}`);
    }

    console.log("\n✅ Copia uno de los modelos (m.name) y pégalo en .env como GEMINI_MODEL.\n");
  } catch (e) {
    console.error("❌ Error listando modelos:", e.message);
  }
})();
