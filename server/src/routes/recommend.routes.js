const router = require("express").Router();
const auth = require("../middleware/auth");
const { getPool, sql } = require("../config/db");
const { recommendedPalette } = require("../services/colorimetry.service");
const { geminiOutfits } = require("../services/gemini.service"); // ✅ Gemini

function clothingTipsByBodyType(tipo) {
  const map = {
    reloj_arena: {
      ideal: ["prendas entalladas", "vestidos wrap", "tiro alto", "cinturones"],
      evita: ["oversize sin forma", "cortes rectos sin cintura"],
    },
    pera: {
      ideal: ["tops con estructura", "hombreras suaves", "colores claros arriba", "faldas A"],
      evita: ["jeans muy ajustados con colores llamativos abajo"],
    },
    triangulo_invertido: {
      ideal: ["pantalones con volumen moderado", "faldas A", "escotes V", "colores oscuros arriba"],
      evita: ["hombreras fuertes", "rayas horizontales en hombros"],
    },
    manzana: {
      ideal: ["escote V", "líneas verticales", "blazers abiertos", "tiro medio/alto cómodo"],
      evita: ["prendas ultra ajustadas en cintura", "cinturones muy marcados"],
    },
    rectangulo: {
      ideal: ["capas", "cinturones", "cortes peplum", "texturas para crear curvas"],
      evita: ["looks totalmente rectos sin estructura"],
    },
  };
  return map[tipo] || { ideal: ["básicos favorecedores"], evita: ["—"] };
}

/**
 * ✅ Recomendación básica (predeterminada + reglas)
 */
router.get("/my-recommendation", auth, async (req, res) => {
  try {
    const pool = await getPool();

    const p = await pool
      .request()
      .input("UsuarioId", sql.Int, req.user.id)
      .query("SELECT * FROM PerfilUsuario WHERE UsuarioId=@UsuarioId");

    const perfil = p.recordset[0];
    if (!perfil) return res.status(404).json({ message: "Perfil no encontrado" });

    const tips = clothingTipsByBodyType(perfil.TipoCuerpo);
    const palette = recommendedPalette({ subTono: perfil.SubTono });

    res.json({
      ok: true,
      tipoCuerpo: perfil.TipoCuerpo,
      tips,
      palette,
    });
  } catch (err) {
    console.error("my-recommendation error:", err);
    res.status(500).json({ message: "Error interno en recomendaciones" });
  }
});

/**
 * ✅ Outfits con IA (Gemini) usando perfil + catálogo real
 */
router.post("/ai-outfits", auth, async (req, res) => {
  try {
    const pool = await getPool();

    // 1) Perfil
    const p = await pool
      .request()
      .input("UsuarioId", sql.Int, req.user.id)
      .query("SELECT * FROM PerfilUsuario WHERE UsuarioId=@UsuarioId");

    const perfil = p.recordset[0];
    if (!perfil) return res.status(404).json({ message: "Perfil no encontrado" });

    // 2) Prendas (catálogo real)
    const prendasRaw = await pool.request().query(`
      SELECT TOP 60 Id, Nombre, Categoria, Color, Precio, ImagenUrl, Stock
      FROM Prendas
      WHERE Activo=1 AND Stock>0
      ORDER BY NEWID()
    `);

    // 3) (Opcional) Tags por prenda (si tienes estas tablas)
    //    Si no tienes PrendaTags/Tags, NO PASA NADA: lo saltamos sin romper.
    let prendas = prendasRaw.recordset.map((x) => ({ ...x, Tags: [] }));

    try {
      const ids = prendas.map((x) => x.Id);
      if (ids.length) {
        // ⚠️ Si tus tablas se llaman distinto, dime y lo ajusto
        const tagsRes = await pool.request().query(`
          SELECT pt.PrendaId, t.Nombre as Tag
          FROM PrendaTags pt
          JOIN Tags t ON t.Id = pt.TagId
        `);

        const tagsMap = tagsRes.recordset.reduce((acc, r) => {
          acc[r.PrendaId] = acc[r.PrendaId] || [];
          acc[r.PrendaId].push(r.Tag);
          return acc;
        }, {});

        prendas = prendas.map((x) => ({ ...x, Tags: tagsMap[x.Id] || [] }));
      }
    } catch (tagErr) {
      // Si no existen tablas de tags, seguimos sin tags.
      // console.log("Tags no disponibles (ok en prototipo):", tagErr.message);
    }

    // 4) Llamar a Gemini
    const ai = await geminiOutfits({ perfil, prendas });

    // 5) Guardar recomendación IA
    await pool
      .request()
      .input("UsuarioId", sql.Int, req.user.id)
      .input("Tipo", sql.NVarChar, "ia")
      .input("Resumen", sql.NVarChar, "Recomendación IA (Gemini)")
      .input("Detalle", sql.NVarChar, JSON.stringify(ai))
      .query(
        "INSERT INTO Recomendaciones (UsuarioId, Tipo, Resumen, Detalle) VALUES (@UsuarioId,@Tipo,@Resumen,@Detalle)"
      );

    res.json({ ok: true, ...ai });
  } catch (err) {
    console.error("ai-outfits error:", err);
    res.status(500).json({
      message: "Error al generar recomendaciones con IA",
      detail: err.message,
    });
  }
});

module.exports = router;
