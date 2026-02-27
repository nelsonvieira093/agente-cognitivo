// E:\agente-cognitivo\backend\src\services\cognitive.service.js

const db = require("../database/database");
const CognitiveEngine = require("../engine/cognitive.engine");
const AIService = require("./ai.service");

class CognitiveService {
  // 🔥 NOVO: detectar se é consulta contextual
  static isContextualQuery(message) {
    const patterns = [
      "o que ficou",
      "quais são",
      "me dê",
      "listar",
      "pendente",
      "aberto",
      "contratos",
      "follow-ups",
      "resumo",
      "digest",
    ];

    const lower = message.toLowerCase();
    return patterns.some((p) => lower.includes(p));
  }

  // 🔥 Criar Metodo Inteligente

  static async getStrategicFrontsDetailed(userId) {
    console.log("BUSCANDO FRENTES PARA USER:", userId);
    return new Promise((resolve, reject) => {
      db.all(
        `
      SELECT sf.id, sf.title, sf.status, sf.updated_at
      FROM strategic_fronts sf
      WHERE sf.user_id = ?
      AND sf.status = 'OPEN'
      ORDER BY sf.updated_at DESC
      `,
        [userId],
        async (err, fronts) => {
          if (err) return reject(err);

          const detailedFronts = await Promise.all(
            fronts.map(async (front) => {
              const followups = await new Promise((res, rej) => {
                db.all(
                  `
                SELECT f.id, e.structured_output
                FROM followups f
                LEFT JOIN entries e ON e.id = f.entry_id
                WHERE f.strategic_front_id = ?
                AND f.status = 'OPEN'
                `,
                  [front.id],
                  (err, rows) => {
                    if (err) rej(err);
                    else res(rows);
                  },
                );
              });

              let highPriority = 0;
              const directorsSet = new Set();

              followups.forEach((f) => {
                if (f.structured_output) {
                  try {
                    const parsed = JSON.parse(f.structured_output);

                    if (parsed.priority === "ALTA") {
                      highPriority++;
                    }

                    if (Array.isArray(parsed.directors)) {
                      parsed.directors.forEach((d) => directorsSet.add(d));
                    }
                  } catch {}
                }
              });

              return {
                id: front.id,
                name: front.title,
                status: front.status,
                total_followups: followups.length,
                high_priority_count: highPriority,
                directors_involved: Array.from(directorsSet),
                last_update: front.updated_at,
              };
            }),
          );

          resolve(detailedFronts);
        },
      );
    });
  }

  // 🔹 getOneOnOneAgenda(director)
  static async getOneOnOneAgenda(userId, director) {
    return new Promise((resolve, reject) => {
      db.all(
        `
      SELECT e.structured_output
      FROM entries e
      WHERE e.user_id = ?
      AND e.structured_output LIKE ?
      ORDER BY e.created_at DESC
      `,
        [userId, `%#OneOnOne{${director}}%`],
        (err, rows) => {
          if (err) return reject(err);

          const items = rows
            .map((r) => {
              try {
                return JSON.parse(r.structured_output);
              } catch {
                return null;
              }
            })
            .filter(Boolean);

          const followups = [];
          const kpis = [];
          const summaries = [];

          items.forEach((item) => {
            if (item.followups) followups.push(...item.followups);
            if (item.hashtags?.includes("#KPI")) kpis.push(item.summary);
            if (item.summary) summaries.push(item.summary);
          });

          resolve({
            rito: `OneOnOne ${director}`,
            total_items: items.length,
            pautas: [...new Set(summaries)],
            followups: [...new Set(followups)],
            kpis: [...new Set(kpis)],
          });
        },
      );
    });
  }

  // 🔹 getStaffMeetingAgenda()

  static async getStaffMeetingAgenda(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `
      SELECT e.structured_output
      FROM entries e
      WHERE e.user_id = ?
      AND e.structured_output LIKE '%#StaffMeeting%'
      ORDER BY e.created_at DESC
      `,
        [userId],
        (err, rows) => {
          if (err) return reject(err);

          const items = rows
            .map((r) => {
              try {
                return JSON.parse(r.structured_output);
              } catch {
                return null;
              }
            })
            .filter(Boolean);

          const followups = [];
          const summaries = [];

          items.forEach((item) => {
            if (item.followups) followups.push(...item.followups);
            if (item.summary) summaries.push(item.summary);
          });

          resolve({
            rito: "StaffMeeting",
            total_items: items.length,
            pautas: [...new Set(summaries)],
            followups: [...new Set(followups)],
          });
        },
      );
    });
  }

  //🔹 getBoardPauta()

  static async getBoardPauta(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `
      SELECT e.structured_output
      FROM entries e
      WHERE e.user_id = ?
      AND (
        e.structured_output LIKE '%#BoardReport%' OR
        e.structured_output LIKE '%#PreBoard%' OR
        e.structured_output LIKE '%#KPI%'
      )
      ORDER BY e.created_at DESC
      `,
        [userId],
        (err, rows) => {
          if (err) return reject(err);

          const items = rows
            .map((r) => {
              try {
                return JSON.parse(r.structured_output);
              } catch {
                return null;
              }
            })
            .filter(Boolean);

          const strategicSummaries = [];
          const followups = [];

          items.forEach((item) => {
            if (item.summary) strategicSummaries.push(item.summary);
            if (item.followups) followups.push(...item.followups);
          });

          resolve({
            rito: "Board",
            total_items: items.length,
            pautas_estrategicas: [...new Set(strategicSummaries)],
            followups_criticos: [...new Set(followups)],
          });
        },
      );
    });
  }

  // FUNÇÃO: NORMALIZAR TÍTULO (evita duplicação semântica)
  static normalizeTitle(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .trim();
  }

  // FUNÇÃO: DETECTAR OU CRIAR FRENTE ESTRATÉGICA
  static async detectStrategicFront(userId, analysis) {
    if (
      !analysis ||
      !analysis.summary ||
      !Array.isArray(analysis.followups) ||
      analysis.followups.length === 0
    ) {
      return null;
    }

    const titleBase = analysis.summary;
    const normalized = CognitiveService.normalizeTitle(titleBase);

    return new Promise((resolve, reject) => {
      db.get(
        `
      SELECT * FROM strategic_fronts
      WHERE user_id = ?
      AND status = 'OPEN'
      `,
        [userId],
        (err, row) => {
          if (err) return reject(err);

          if (row) {
            const existingNormalized = CognitiveService.normalizeTitle(
              row.title,
            );

            if (existingNormalized === normalized) {
              db.run(
                `
              UPDATE strategic_fronts
              SET updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
              `,
                [row.id],
              );
              return resolve(row.id);
            }
          }

          db.run(
            `
          INSERT INTO strategic_fronts
          (user_id, title, description, priority)
          VALUES (?, ?, ?, ?)
          `,
            [userId, titleBase, analysis.summary, analysis.priority || "MÉDIA"],
            function (insertErr) {
              if (insertErr) return reject(insertErr);
              resolve(this.lastID);
            },
          );
        },
      );
    });
  }
  // 🔥 NOVO: buscar contexto recente
  static async getRecentContext(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT raw_text, structured_output
        FROM entries
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
        `,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });
  }

  // FUNÇÃO: LISTAR FRENTES ESTRATÉGICAS
  static async getStrategicFronts(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `
      SELECT *
      FROM strategic_fronts
      WHERE user_id = ?
      AND status = 'OPEN'
      ORDER BY updated_at DESC
      `,
        [userId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 🔥 NOVO: montar memória estruturada
  static buildMemoryContext(entries, followups) {
    const lastEntries = entries
      .map((e) => {
        try {
          const parsed = JSON.parse(e.structured_output);
          return `- ${parsed.summary} (Prioridade: ${parsed.priority})`;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .join("\n");

    const openFollowups = followups
      .map((f) => `- ${f.description} (Prioridade: ${f.priority})`)
      .join("\n");

    return `
CONTEXTO EXECUTIVO RECENTE:

Entradas recentes:
${lastEntries || "Nenhuma"}

Follow-ups abertos:
${openFollowups || "Nenhum"}
`;
  }

  // NOVO detectIntent
  static detectIntent(message) {
    const text = message.toLowerCase();

    const queryPatterns = [
      "pendente",
      "pendências",
      "follow-up",
      "aberto",
      "ainda não",
      "não resolvi",
      "estou esquecendo",
      "me atualize",
      "o que ficou",
      "prioridade",
      "urgente",
      "status",
      "resumo",
      "listar",
    ];

    const isQuery = queryPatterns.some((p) => text.includes(p));

    return isQuery ? "QUERY" : "REGISTER";
  }

  // NOVO handleQuery
  static async handleQuery(userId, message) {
    const radar = await CognitiveService.getFollowupRadar(userId);
    const items = radar.items || [];

    if (items.length === 0) {
      return {
        raw: null,
        formatted: `#FollowUp
#Processos

Status Atual

Você não possui follow-ups abertos.`,
      };
    }

    const list = items
      .map(
        (f, index) =>
          `${index + 1}. ${f.description} (Prioridade: ${f.priority})`,
      )
      .join("\n");

    const summary = `
#FollowUp
#Processos

Status Atual de Pendências

Você possui ${items.length} follow-ups abertos.

${list}

Resumo por prioridade:
ALTA: ${radar.by_priority.ALTA}
MÉDIA: ${radar.by_priority.MÉDIA}
BAIXA: ${radar.by_priority.BAIXA}
`.trim();

    return {
      raw: null,
      formatted: summary,
    };
  }
  // MOTOR DO DASHBOARD EXECUTIVO

  static async generateExecutiveDashboard(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `
      SELECT * FROM strategic_fronts
      WHERE user_id = ?
      AND status = 'OPEN'
      `,
        [userId],
        (err, fronts) => {
          if (err) return reject(err);

          db.all(
            `
          SELECT * FROM followups
          WHERE user_id = ?
          AND status = 'OPEN'
          `,
            [userId],
            (err2, followups) => {
              if (err2) return reject(err2);

              const totalFronts = fronts.length;
              const totalFollowups = followups.length;

              const alta = followups.filter(
                (f) => f.priority === "ALTA",
              ).length;
              const media = followups.filter(
                (f) => f.priority === "MÉDIA",
              ).length;
              const baixa = followups.filter(
                (f) => f.priority === "BAIXA",
              ).length;

              const frontCount = {};

              followups.forEach((f) => {
                if (!frontCount[f.strategic_front_id]) {
                  frontCount[f.strategic_front_id] = 0;
                }
                frontCount[f.strategic_front_id]++;
              });

              let mostCriticalFront = null;
              let max = 0;

              for (let key in frontCount) {
                if (frontCount[key] > max) {
                  max = frontCount[key];
                  mostCriticalFront = key;
                }
              }

              resolve({
                total_fronts: totalFronts,
                total_followups: totalFollowups,
                by_priority: {
                  ALTA: alta,
                  MÉDIA: media,
                  BAIXA: baixa,
                },
                most_critical_front_id: mostCriticalFront,
              });
            },
          );
        },
      );
    });
  }
  // AQUI COMEÇA O PROCESS
  static async process(userId, message) {
    try {
      const intent = CognitiveService.detectIntent(message);

      // 🔥 QUERY → NÃO REGISTRA
      if (intent === "QUERY") {
        return await CognitiveService.handleQuery(userId, message);
      }

      // 🔥 MEMÓRIA CONTEXTUAL
      let enrichedMessage = message;

      try {
        const recentEntries = await CognitiveService.getRecentContext(userId);
        const radar = await CognitiveService.getFollowupRadar(userId);

        const memoryContext = CognitiveService.buildMemoryContext(
          recentEntries || [],
          (radar && radar.items) || [],
        );

        enrichedMessage = `
${memoryContext}

PERGUNTA ATUAL:
${message}
`;
      } catch (err) {
        console.warn("⚠️ Falha ao montar memória:", err);
      }

      // 🔥 IA BLINDADA
      let analysis;

      try {
        analysis = await AIService.processExecutiveText(enrichedMessage);

        if (!analysis || typeof analysis !== "object") {
          throw new Error("IA retornou inválido");
        }
      } catch (error) {
        console.warn("⚠️ IA falhou. Usando fallback seguro.");

        analysis = {
          summary: message,
          priority: "MÉDIA",
          hashtags: ["#Processos"],
          followups: [],
          directors: [],
          rituals: [],
          actions: [],
          register_location: "Análise Cognitiva",
        };
      }

      // 🔥 CONTRATO DEFENSIVO
      analysis = CognitiveService.enforceOntologyContract(analysis);
      console.log("ANALYSIS COMPLETO:", analysis);

      const frontId = await CognitiveService.detectStrategicFront(
        userId,
        analysis,
      );

      console.log("SUMMARY:", analysis.summary);
      console.log("FRONT ID GERADO:", frontId);

      let entryId;

      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO entries 
         (user_id, raw_text, structured_output)
         VALUES (?, ?, ?)`,
          [userId, message, JSON.stringify(analysis)],
          function (err) {
            if (err) reject(err);
            else {
              entryId = this.lastID;
              resolve();
            }
          },
        );
      });

      if (analysis.followups && analysis.followups.length > 0) {
        for (const f of analysis.followups) {
          const existing = await new Promise((resolve, reject) => {
            db.get(
              `SELECT id FROM followups
         WHERE user_id = ?
         AND description = ?
         AND status = 'OPEN'`,
              [userId, f],
              (err, row) => {
                if (err) reject(err);
                else resolve(row);
              },
            );
          });

          if (existing) {
            continue;
          }

          if (!frontId) continue; // 🔥 NÃO INSERE SEM FRENTE

          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO followups 
         (user_id, entry_id, description, strategic_front_id)
         VALUES (?, ?, ?, ?)`,
              [userId, entryId, f, frontId],
              function (err) {
                if (err) reject(err);
                else resolve();
              },
            );
          });
        }
      }
      return {
        raw: analysis,
        formatted: CognitiveService.formatForChat(analysis),
      };
    } catch (fatalError) {
      console.error("🚨 ERRO CRÍTICO NO PROCESS:", fatalError);

      // 🔥 NUNCA MAIS DEVOLVE 500 POR ERRO COGNITIVO
      return {
        raw: null,
        formatted: `
#Processos

Falha controlada na análise cognitiva.
O sistema permaneceu estável.
`,
      };
    }
  }

  // 🔐 Garante contrato da ontologia mesmo se IA falhar parcialmente
  static enforceOntologyContract(data) {
    const allowedDirectors = [
      "Financeiro",
      "Jurídico",
      "Tecnologia",
      "RH",
      "Comercial",
      "Marketing",
      "Operações",
    ];

    // Garantir arrays
    data.hashtags = Array.isArray(data.hashtags) ? data.hashtags : [];
    data.followups = Array.isArray(data.followups) ? data.followups : [];
    data.directors = Array.isArray(data.directors) ? data.directors : [];
    data.rituals = Array.isArray(data.rituals) ? data.rituals : [];

    // 🔥 Filtrar apenas diretorias válidas
    data.directors = data.directors.filter((dir) =>
      allowedDirectors.includes(dir),
    );

    // 🔥 Garantir prioridade
    if (!["ALTA", "MÉDIA", "BAIXA"].includes(data.priority)) {
      data.priority = "MÉDIA";
    }

    // 🔥 Forçar hashtag #OneOnOne{Diretoria} se ritual for OneOnOne
    if (data.rituals.includes("OneOnOne")) {
      data.directors.forEach((dir) => {
        if (allowedDirectors.includes(dir)) {
          const tag = `#OneOnOne{${dir}}`;
          if (!data.hashtags.includes(tag)) {
            data.hashtags.push(tag);
          }
        }
      });
    }

    // 🔥 Garantir multilayer mínimo
    if (data.followups.length > 0 && !data.hashtags.includes("#FollowUp")) {
      data.hashtags.push("#FollowUp");
    }

    if (!data.hashtags.includes("#Processos")) {
      data.hashtags.push("#Processos");
    }

    // Remover duplicatas
    data.hashtags = [...new Set(data.hashtags)];

    return data;
  }

  // 🎯 Formatação final para CEO
  static formatForChat(data) {
    const hashtags = data.hashtags.length
      ? data.hashtags.join("\n")
      : "#Processos";

    const followups = data.followups.length
      ? data.followups.map((f) => `- ${f}`).join("\n")
      : "Nenhum identificado";

    const directors = data.directors.length
      ? data.directors.join(", ")
      : "Não identificado";

    const rituals = data.rituals.length
      ? data.rituals.join(", ")
      : "Não identificado";

    const actions =
      data.actions && data.actions.length
        ? data.actions.map((a) => `- ${a}`).join("\n")
        : "Nenhuma definida";

    return `
${hashtags}

Resumo Estruturado

1. Síntese da fala  
${data.summary}

2. Follow-ups identificados  
${followups}

3. Rito(s) relacionado(s)  
${rituals}

4. Diretoria(s) envolvida(s)  
${directors}

5. Prioridade  
${data.priority}

6. Ações necessárias  
${actions}

7. Onde deve ser registrado  
${data.register_location}
`.trim();
  }

  static getOpenFollowups(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM followups
         WHERE user_id = ? AND status = 'OPEN'
         ORDER BY created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });
  }

  static async getWeeklyDigest(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `
      SELECT * FROM entries
      WHERE user_id = ?
      AND created_at >= datetime('now', '-7 days')
      ORDER BY created_at DESC
      `,
        [userId],
        (err, rows) => {
          if (err) return reject(err);

          const entries = rows.map((r) => JSON.parse(r.structured_output));

          const total = entries.length;

          const directorsCount = {};
          const highPriority = entries.filter(
            (e) => e.priority === "ALTA",
          ).length;

          entries.forEach((e) => {
            if (Array.isArray(e.directors)) {
              e.directors.forEach((d) => {
                directorsCount[d] = (directorsCount[d] || 0) + 1;
              });
            }
          });

          const topDirectors = Object.entries(directorsCount)
            .sort((a, b) => b[1] - a[1])
            .map((d) => d[0]);

          resolve({
            period: "Últimos 7 dias",
            total_entries: total,
            high_priority_items: highPriority,
            top_directories: topDirectors,
          });
        },
      );
    });
  }

  static async getBoardReport(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `
      SELECT * FROM entries
      WHERE user_id = ?
      AND created_at >= datetime('now', '-30 days')
      ORDER BY created_at DESC
      `,
        [userId],
        async (err, rows) => {
          if (err) return reject(err);

          const entries = rows.map((r) => JSON.parse(r.structured_output));

          const strategic = entries.filter(
            (e) =>
              e.priority === "ALTA" ||
              (Array.isArray(e.hashtags) && e.hashtags.includes("#KPI")),
          );

          const directorsCount = {};
          strategic.forEach((e) => {
            if (Array.isArray(e.directors)) {
              e.directors.forEach((d) => {
                directorsCount[d] = (directorsCount[d] || 0) + 1;
              });
            }
          });

          const topDirectors = Object.entries(directorsCount)
            .sort((a, b) => b[1] - a[1])
            .map((d) => d[0]);

          // 🔥 Correção para não repetir highlights
          const uniqueSummaries = [
            ...new Set(
              strategic
                .map((e) => e.summary)
                .filter((s) => s && s.trim() !== ""),
            ),
          ];

          const highlights = uniqueSummaries.slice(0, 5);

          const boardData = {
            period: "Últimos 30 dias",
            total_entries: entries.length,
            strategic_items: strategic.length,
            top_directories: topDirectors,
            highlights,
          };

          // 🔥 AQUI CHAMA A IA PARA GERAR A NARRATIVA
          const executiveSummary =
            await AIService.generateBoardNarrative(boardData);

          resolve({
            ...boardData,
            executive_summary: executiveSummary,
          });
        },
      );
    });
  }

  static async getFollowupRadar(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `
      SELECT f.*, e.structured_output
      FROM followups f
      LEFT JOIN entries e ON e.id = f.entry_id
      WHERE f.user_id = ?
      AND f.status = 'OPEN'
      ORDER BY f.created_at DESC
      `,
        [userId],
        (err, rows) => {
          if (err) return reject(err);

          const followups = rows.map((r) => {
            let priority = "MÉDIA";
            let directors = [];

            if (r.structured_output) {
              try {
                const parsed = JSON.parse(r.structured_output);
                priority = parsed.priority || "MÉDIA";
                directors = Array.isArray(parsed.directors)
                  ? parsed.directors
                  : [];
              } catch (err) {
                console.warn("Erro ao parsear structured_output:", err);
              }
            }
            return {
              id: r.id,
              description: r.description,
              priority,
              directors,
              created_at: r.created_at,
            };
          });

          const total = followups.length;

          const byPriority = {
            ALTA: followups.filter((f) => f.priority === "ALTA").length,
            MÉDIA: followups.filter((f) => f.priority === "MÉDIA").length,
            BAIXA: followups.filter((f) => f.priority === "BAIXA").length,
          };

          const directorsCount = {};
          followups.forEach((f) => {
            f.directors.forEach((d) => {
              directorsCount[d] = (directorsCount[d] || 0) + 1;
            });
          });

          resolve({
            total_open_followups: total,
            by_priority: byPriority,
            by_director: directorsCount,
            items: followups.sort((a, b) => {
              const order = { ALTA: 1, MÉDIA: 2, BAIXA: 3 };
              return order[a.priority] - order[b.priority];
            }),
          });
        },
      );
    });
  }
}

module.exports = CognitiveService;
