const router = require("express").Router();
const auth = require("../middleware/auth");
const { getPool, sql } = require("../config/db");
const { recommendedPalette } = require("../services/colorimetry.service");

function clothingTipsByBodyType(tipo) {
  const map = {
    reloj_arena: {
      ideal: ["prendas entalladas", "vestidos wrap", "tiro alto", "cinturones"],
      evita: ["oversize sin forma", "cortes rectos sin cintura"]
    },
    pera: {
      ideal: ["tops con estructura", "hombreras suaves", "colores claros arriba", "faldas A"],
      evita: ["pitillos muy ajustados con colores llamativos abajo"]
    },
    triangulo_invertido: {
      ideal: ["pantalones con volumen moderado", "faldas A", "escotes V", "colores oscuros arriba"],
      evita: ["hombreras fuertes", "rayas horizontales en hombros"]
    },
    manzana: {
      ideal: ["escote V", "líneas verticales", "blazers abiertos", "tiro medio/alto cómodo"],
      evita: ["prendas ultra ajustadas en cintura", "cinturones muy marcados"]
    },
    rectangulo: {
      ideal: ["capas", "cinturones", "cortes peplum", "texturas para crear curvas"],
      evita: ["looks totalmente rectos sin estructura"]
    }
  };
  return map[tipo] || { ideal: ["básicos favorecedores"], evita: ["—"] };
}

router.get("/my-recommendation", auth, async (req, res) => {
  const pool = await getPool();

  const p = await pool.request()
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
    palette
  });
});

module.exports = router;

const { recommendWithAI } = require("../services/ai.service");

router.post("/ai-outfits", auth, async (req, res) => {
  const pool = await getPool();

  const p = await pool.request()
    .input("UsuarioId", sql.Int, req.user.id)
    .query("SELECT * FROM PerfilUsuario WHERE UsuarioId=@UsuarioId");

  const perfil = p.recordset[0];
  if (!perfil) return res.status(404).json({ message: "Perfil no encontrado" });

  const prendas = await pool.request()
    .query("SELECT TOP 30 * FROM Prendas WHERE Activo=1 AND Stock>0 ORDER BY NEWID()");

  const ai = await recommendWithAI({ perfil, prendas: prendas.recordset });

  // Guardar recomendación
  await pool.request()
    .input("UsuarioId", sql.Int, req.user.id)
    .input("Tipo", sql.NVarChar, "ia")
    .input("Resumen", sql.NVarChar, "Recomendación IA")
    .input("Detalle", sql.NVarChar, JSON.stringify(ai))
    .query("INSERT INTO Recomendaciones (UsuarioId, Tipo, Resumen, Detalle) VALUES (@UsuarioId,@Tipo,@Resumen,@Detalle)");

  res.json({ ok: true, ...ai });
});
