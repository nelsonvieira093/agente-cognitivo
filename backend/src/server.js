//E:\agente-cognitivo\backend\src\server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const cognitiveRoutes = require("./routes/cognitive.routes");

const app = express();

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://agente-cognitivo.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());
app.use(express.json());

// ✅ Rota raiz
app.get("/", (req, res) => {
  res.send("Agente Cognitivo Online 🚀");
});

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/cognitive", cognitiveRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "Agente Cognitivo operacional",
    timestamp: new Date(),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Agente Cognitivo rodando na porta ${PORT}`);
});