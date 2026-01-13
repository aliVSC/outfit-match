require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const catalogRoutes = require("./routes/catalog.routes");
const recommendRoutes = require("./routes/recommend.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ ok: true, name: "OUTFIT MATCH API" }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/recommend", recommendRoutes);

const PORT = process.env.PORT || 8012;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
