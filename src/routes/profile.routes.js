const router = require("express").Router();
const auth = require("../middleware/auth");
const { getPool, sql } = require("../config/db");
const { bodyTypeFromMeasures } = require("../services/bodyType.service");

router.get("/me", auth, async (req, res) => {
  const pool = await getPool();
  const r = await pool.request()
    .input("UsuarioId", sql.Int, req.user.id)
    .query("SELECT * FROM PerfilUsuario WHERE UsuarioId = @UsuarioId");
  res.json(r.recordset[0] || null);
});

router.put("/me", auth, async (req, res) => {
  const {
    estaturaCm, hombrosCm, pechoCm, cinturaCm, caderaCm,
    tonoPiel, subTono, colorOjos, colorCabello,
    estiloPrincipal, coloresFavoritos, prendasNoUsa,
    presupuestoMin, presupuestoMax
  } = req.body;

  const tipoCuerpo = bodyTypeFromMeasures({
    hombros: hombrosCm, pecho: pechoCm, cintura: cinturaCm, cadera: caderaCm
  });

  const pool = await getPool();
  await pool.request()
    .input("UsuarioId", sql.Int, req.user.id)
    .input("EstaturaCm", sql.Int, estaturaCm ?? null)
    .input("HombrosCm", sql.Decimal(5,2), hombrosCm ?? null)
    .input("PechoCm", sql.Decimal(5,2), pechoCm ?? null)
    .input("CinturaCm", sql.Decimal(5,2), cinturaCm ?? null)
    .input("CaderaCm", sql.Decimal(5,2), caderaCm ?? null)
    .input("TonoPiel", sql.NVarChar, tonoPiel ?? null)
    .input("SubTono", sql.NVarChar, subTono ?? null)
    .input("ColorOjos", sql.NVarChar, colorOjos ?? null)
    .input("ColorCabello", sql.NVarChar, colorCabello ?? null)
    .input("EstiloPrincipal", sql.NVarChar, estiloPrincipal ?? null)
    .input("ColoresFavoritos", sql.NVarChar, coloresFavoritos ?? null)
    .input("PrendasNoUsa", sql.NVarChar, prendasNoUsa ?? null)
    .input("PresupuestoMin", sql.Decimal(10,2), presupuestoMin ?? null)
    .input("PresupuestoMax", sql.Decimal(10,2), presupuestoMax ?? null)
    .input("TipoCuerpo", sql.NVarChar, tipoCuerpo)
    .query(`
      UPDATE PerfilUsuario SET
        EstaturaCm=@EstaturaCm, HombrosCm=@HombrosCm, PechoCm=@PechoCm, CinturaCm=@CinturaCm, CaderaCm=@CaderaCm,
        TonoPiel=@TonoPiel, SubTono=@SubTono, ColorOjos=@ColorOjos, ColorCabello=@ColorCabello,
        EstiloPrincipal=@EstiloPrincipal, ColoresFavoritos=@ColoresFavoritos, PrendasNoUsa=@PrendasNoUsa,
        PresupuestoMin=@PresupuestoMin, PresupuestoMax=@PresupuestoMax,
        TipoCuerpo=@TipoCuerpo,
        FechaActualizacion=SYSDATETIME()
      WHERE UsuarioId=@UsuarioId
    `);

  res.json({ ok: true, tipoCuerpo });
});

module.exports = router;
