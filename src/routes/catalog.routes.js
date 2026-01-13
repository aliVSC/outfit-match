const router = require("express").Router();
const auth = require("../middleware/auth");
const { getPool, sql } = require("../config/db");

router.get("/smart", auth, async (req, res) => {
  const pool = await getPool();

  const p = await pool.request()
    .input("UsuarioId", sql.Int, req.user.id)
    .query("SELECT TipoCuerpo, SubTono, EstiloPrincipal, PresupuestoMin, PresupuestoMax FROM PerfilUsuario WHERE UsuarioId=@UsuarioId");

  const perfil = p.recordset[0];
  if (!perfil) return res.status(404).json({ message: "Perfil no encontrado" });

  const tipo = perfil.TipoCuerpo || "desconocido";
  const sub = (perfil.SubTono || "neutro").toLowerCase();
  const estilo = (perfil.EstiloPrincipal || "casual").toLowerCase();
  const min = perfil.PresupuestoMin ?? 0;
  const max = perfil.PresupuestoMax ?? 999999;

  const q = await pool.request()
    .input("Tipo", sql.NVarChar, tipo)
    .input("Sub", sql.NVarChar, sub)
    .input("Estilo", sql.NVarChar, estilo)
    .input("Min", sql.Decimal(10,2), min)
    .input("Max", sql.Decimal(10,2), max)
    .query(`
      SELECT pr.Id, pr.Nombre, pr.Categoria, pr.Color, pr.Precio, pr.ImagenUrl, pr.Stock
      FROM Prendas pr
      WHERE pr.Activo = 1
        AND pr.Precio BETWEEN @Min AND @Max
        AND pr.Id IN (
          SELECT pt.PrendaId
          FROM PrendaTags pt
          JOIN Tags t ON t.Id = pt.TagId
          WHERE t.Nombre IN (@Tipo, @Sub, @Estilo)
        )
      ORDER BY pr.Precio ASC
    `);

  res.json({ ok: true, items: q.recordset });
});

module.exports = router;
