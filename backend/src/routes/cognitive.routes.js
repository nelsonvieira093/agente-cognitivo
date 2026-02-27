// E:\agente-cognitivo\backend\src\routes\cognitive.routes.js

const express = require("express");
const CognitiveService = require("../services/cognitive.service");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * 🔥 Processa entrada cognitiva da CEO
 * Endpoint principal do agente
 */
router.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        error: "Mensagem obrigatória.",
      });
    }

    const result = await CognitiveService.process(userId, message);

    if (!result) {
      return res.status(500).json({
        error: "Falha na análise cognitiva.",
      });
    }

    // 🔥 Se for QUERY, raw pode ser null
    if (!result.raw) {
      return res.status(200).json({
        response: result.formatted,
        metadata: null,
      });
    }

    // 🔎 Validação mínima do contrato ontológico
    const { hashtags, summary, priority } = result.raw;

    if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
      console.warn("⚠️ IA retornou sem hashtags válidas.");
    }

    if (!summary || !priority) {
      console.warn("⚠️ IA retornou estrutura incompleta.");
    }

    // 🔥 Resposta padrão
    return res.status(200).json({
      response: result.formatted,
      metadata: {
        hashtags: result.raw.hashtags,
        priority: result.raw.priority,
        rituals: result.raw.rituals,
      },
    });


  } catch (error) {
    console.error("❌ Erro no endpoint /analyze:", error);
    return res.status(500).json({
      error: "Erro ao processar entrada cognitiva.",
    });
  }
});

/**
 * 📌 Retorna follow-ups em aberto
 */
router.get("/followups", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const followups = await CognitiveService.getOpenFollowups(userId);

    return res.status(200).json({
      count: followups.length,
      data: followups,
    });
  } catch (err) {
    console.error("❌ Erro ao buscar followups:", err);
    return res.status(500).json({
      error: "Erro ao buscar follow-ups.",
    });
  }
});

/**
 * 🩺 Health check do sistema
 */
router.get("/health", (req, res) => {
  return res.status(200).json({
    status: "Agente Cognitivo operacional",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date(),
  });
});

//Semana weekly-digest
router.get("/weekly-digest", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const digest = await CognitiveService.getWeeklyDigest(userId);

    res.status(200).json(digest);
  } catch (error) {
    console.error("Erro ao gerar Weekly Digest:", error);
    res.status(500).json({ error: "Erro ao gerar Weekly Digest" });
  }
});

//  Board Intelligence
router.get("/board-report", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const report = await CognitiveService.getBoardReport(userId);
    res.status(200).json(report);
  } catch (error) {
    console.error("Erro ao gerar Board Report:", error);
    res.status(500).json({ error: "Erro ao gerar Board Report" });
  }
});

router.get("/followup-radar", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const radar = await CognitiveService.getFollowupRadar(userId);
    res.status(200).json(radar);
  } catch (error) {
    console.error("Erro no FollowUp Radar:", error);
    res.status(500).json({ error: "Erro ao gerar radar de follow-ups" });
  }
});

// 🔹 OneOnOne Agenda
router.get("/oneonone/:director", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const director = req.params.director;

    const agenda = await CognitiveService.getOneOnOneAgenda(userId, director);
    res.status(200).json(agenda);
  } catch (error) {
    console.error("Erro ao gerar OneOnOne:", error);
    res.status(500).json({ error: "Erro ao gerar pauta OneOnOne" });
  }
});

//🔹 Staff Meeting

router.get("/staff-agenda", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const agenda = await CognitiveService.getStaffMeetingAgenda(userId);
    res.status(200).json(agenda);
  } catch (error) {
    console.error("Erro StaffMeeting:", error);
    res.status(500).json({ error: "Erro ao gerar StaffMeeting" });
  }
});

//🔹 Board
router.get("/board-pauta", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pauta = await CognitiveService.getBoardPauta(userId);
    res.status(200).json(pauta);
  } catch (error) {
    console.error("Erro Board:", error);
    res.status(500).json({ error: "Erro ao gerar pauta Board" });
  }
});




router.get("/executive-dashboard", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await CognitiveService.generateExecutiveDashboard(userId);
    res.status(200).json(data);
  } catch (error) {
    console.error("Erro Dashboard Executivo:", error);
    res.status(500).json({ error: "Erro ao gerar dashboard executivo" });
  }
});

router.get("/strategic-fronts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const fronts =
      await CognitiveService.getStrategicFrontsDetailed(userId);

    res.status(200).json(fronts);
  } catch (error) {
    console.error("Erro ao buscar frentes estratégicas:", error);
    res.status(500).json({
      error: "Erro ao buscar frentes estratégicas",
    });
  }
});

module.exports = router;
