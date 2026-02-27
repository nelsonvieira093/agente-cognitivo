//E:\agente-cognitivo\backend\src\engine\cognitive.engine.js

class CognitiveEngine {
  static analyze(text) {
    const lower = text.toLowerCase();

    const result = {
      hashtags: [],
      structured_summary: "",
      followups: [],
      directors: [],
      rituals: [],
      priority: "NORMAL",
      raw_text: text,
    };

    const directorMap = {
      Financeiro: ["financeiro", "orçamento", "valor", "custo"],
      Jurídico: ["contrato", "jurídico", "cláusula"],
      RH: ["equipe", "contratação"],
      Comercial: ["cliente", "proposta", "venda"],
      Tecnologia: ["sistema", "api", "software"],
    };

    Object.entries(directorMap).forEach(([director, keywords]) => {
      if (keywords.some((k) => lower.includes(k))) {
        result.hashtags.push(`#${director}`);
        result.directors.push(director);
      }
    });

    if (lower.includes("urgente") || lower.includes("imediato")) {
      result.priority = "ALTA";
    }

    const actionVerbs = [
      "preciso",
      "revisar",
      "analisar",
      "falar",
      "verificar",
      "resolver",
      "definir",
      "aprovar",
    ];

    const sentences = text.split(/[.!?]/);

    sentences.forEach((sentence) => {
      const s = sentence.trim();
      if (!s) return;

      if (actionVerbs.some((v) => s.toLowerCase().includes(v))) {
        result.followups.push(s);
      }
    });

    if (result.hashtags.length === 0) {
      result.hashtags.push("#DailyLog");
    }

    result.structured_summary =
      text.length > 200 ? text.substring(0, 200) + "..." : text;

    return result;
  }
}

module.exports = CognitiveEngine;
