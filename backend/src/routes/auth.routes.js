// E:\agente-cognitivo\backend\src\routes\auth.routes.js
const express = require("express");
const AuthService = require("../services/auth.service");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Dados obrigatórios." });
  }

  try {
    const user = await AuthService.signup(name, email, password);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/logout", (req, res) => {
  res.json({ message: "Logout realizado. Apague o token no frontend." });
});

module.exports = router;
