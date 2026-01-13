const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPool, sql } = require("../config/db");

router.post("/register", async (req, res) => {
  const { nombres, email, password } = req.body;
  if (!nombres || !email || !password) return res.status(400).json({ message: "Faltan campos" });

  const pool = await getPool();

  const exists = await pool.request()
    .input("Email", sql.NVarChar, email)
    .query("SELECT Id FROM Usuarios WHERE Email = @Email");

  if (exists.recordset.length) return res.status(409).json({ message: "Email ya existe" });

  const hash = await bcrypt.hash(password, 10);

  const result = await pool.request()
    .input("Nombres", sql.NVarChar, nombres)
    .input("Email", sql.NVarChar, email)
    .input("PasswordHash", sql.NVarChar, hash)
    .query(`
      INSERT INTO Usuarios (Nombres, Email, PasswordHash)
      OUTPUT INSERTED.Id
      VALUES (@Nombres, @Email, @PasswordHash)
    `);

  const userId = result.recordset[0].Id;

  await pool.request()
    .input("UsuarioId", sql.Int, userId)
    .query("INSERT INTO PerfilUsuario (UsuarioId) VALUES (@UsuarioId)");

  res.json({ ok: true, userId });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Faltan campos" });

  const pool = await getPool();
  const result = await pool.request()
    .input("Email", sql.NVarChar, email)
    .query("SELECT Id, Email, PasswordHash FROM Usuarios WHERE Email = @Email");

  if (!result.recordset.length) return res.status(401).json({ message: "Credenciales inválidas" });

  const user = result.recordset[0];
  const ok = await bcrypt.compare(password, user.PasswordHash);
  if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

  const token = jwt.sign({ id: user.Id, email: user.Email }, process.env.JWT_SECRET, { expiresIn: "2h" });
  res.json({ ok: true, token });
});

module.exports = router;
