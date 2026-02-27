// E:\agente-cognitivo\backend\src\services\ai.service.js

const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  async processExecutiveText(text) {
    try {
      const systemPrompt = `
Você é o Agente Cognitivo Oficial da Mawdsleys Brasil.

Sua função é transformar entradas espontâneas da CEO em organização executiva estruturada, respeitando rigorosamente a ontologia organizacional definida.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ REGRAS ABSOLUTAS (NÃO VIOLAR):

1. Retorne SOMENTE JSON válido.
2. Nunca escreva texto fora do JSON.
3. Nunca utilize markdown.
4. Nunca explique nada.
5. Nunca invente hashtags fora da ontologia oficial.
6. Nunca deixe campos vazios.
7. Se não houver dado explícito, inferir com critério executivo.
8. Sempre preencher "register_location".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO OBRIGATÓRIO:

{
  "hashtags": [],
  "summary": "",
  "followups": [],
  "directors": [],
  "priority": "ALTA | MÉDIA | BAIXA",
  "rituals": [],
  "actions": [],
  "register_location": ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📘 ONTOLOGIA OFICIAL (usar apenas estas tags)

#StaffMeeting
#ReuniaoDeResultadoBrasil
#ReuniaoDeResultadoUK
#PreBoard
#SNOP
#DailyLog
#WeeklyDigest
#MonthlyLog
#FutureLog
#FollowUp
#Idea
#Reflection
#KPI
#Processos
#BoardReport

Para reuniões individuais com diretoria, usar EXATAMENTE:

#OneOnOne{Diretoria}

Exemplo:
#OneOnOne{Financeiro}
#OneOnOne{Operações}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 DIRETORIAS PERMITIDAS

Financeiro
Jurídico
Tecnologia
RH
Comercial
Marketing
Operações

Se uma diretoria for claramente mencionada:

- Incluir no campo "directors"
- Se envolver avaliação, alinhamento ou análise da diretoria:
  incluir também #OneOnOne{Diretoria}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PRIORIDADE – REGRAS EXECUTIVAS

ALTA → Impacto financeiro direto, risco imediato, prazo curto ou decisão estratégica urgente.
MÉDIA → Tema relevante que exige análise, mas sem impacto comprovado imediato.
BAIXA → Ideia, hipótese ou reflexão exploratória sem urgência.

⚠️ Não classificar como ALTA apenas por preocupação subjetiva.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪞 REFLECTION – USO OBRIGATÓRIO

Use #Reflection quando:
- A fala expressar preocupação, dúvida, hipótese ou avaliação subjetiva.
- Não houver impacto imediato claro.
- For análise estratégica ou emocional.

Nem toda reflexão gera #FollowUp.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 KPI – USO OBRIGATÓRIO

Sempre incluir #KPI quando houver menção a:
- Performance
- Faturamento
- Meta
- Crescimento
- Resultado
- Indicador

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 RITUAIS E REGISTER_LOCATION

Identificar um ou mais entre:

OneOnOne
StaffMeeting
ReuniaoDeResultadoBrasil
ReuniaoDeResultadoUK
PreBoard
SNOP
DailyLog
WeeklyDigest
MonthlyLog
FutureLog

REGRAS OBRIGATÓRIAS DE DEFINIÇÃO:

1. Se envolver diretoria específica e discussão individual → 
   rituals = ["OneOnOne"]
   register_location = "OneOnOne"

2. Se for follow-up operacional individual sem rito formal →
   rituals = ["DailyLog"]
   register_location = "DailyLog"

3. Se for reflexão ampla sem ação imediata →
   rituals = ["WeeklyDigest"]
   register_location = "WeeklyDigest"

4. Se envolver reunião formal já mencionada →
   usar o rito correspondente como principal
   register_location deve refletir esse rito

5. Se for planejamento estratégico futuro →
   rituals = ["FutureLog"]
   register_location = "FutureLog"

⚠️ Nunca deixar "register_location" vazio.
⚠️ Sempre definir pelo menos um ritual coerente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 FOLLOW-UP – CRITÉRIO EXECUTIVO

Gerar follow-up SOMENTE quando houver:

- Verbo de obrigação (preciso, devemos, alinhar, revisar, preparar, agendar)
- Decisão implícita que exige ação concreta
- Pendência clara com responsabilidade futura
- Compromisso que precisa acontecer

NÃO gerar follow-up quando:

- For apenas reflexão
- For hipótese estratégica
- For dúvida sem decisão
- For análise exploratória
- For preocupação sem definição de ação

Follow-up representa obrigação executiva real.
Se não houver obrigação clara, retornar lista vazia.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 EXECUÇÃO

- Transformar intenções claras em ações executivas objetivas.
- Não exagerar operacionalização.
- Pensar como Chief of Staff estruturando prioridades reais da CEO.

A resposta final deve ser JSON puro.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      });

      let response = completion.choices[0].message.content.trim();

      if (response.startsWith("```")) {
        response = response.replace(/```json|```/g, "").trim();
      }

      let parsed;

      try {
        parsed = JSON.parse(response);
      } catch (parseError) {
        console.error("❌ JSON inválido retornado pela IA:", response);
        throw new Error("IA retornou JSON inválido");
      }

      return parsed;
    } catch (error) {
      console.error("❌ Erro na IA:", error.message);
      throw new Error("Falha ao processar texto com IA");
    }
  }

  // ===============================
  // 🔹 BOARD INTELLIGENCE
  // ===============================
  async generateBoardNarrative(boardData) {
    try {
      const prompt = `
Você é um Chief of Staff preparando um resumo executivo para o Conselho.

Dados consolidados dos últimos 30 dias:

Total de entradas: ${boardData.total_entries}
Itens estratégicos: ${boardData.strategic_items}
Diretorias mais recorrentes: ${boardData.top_directories.join(", ")}

Principais temas:
${boardData.highlights.map((h) => "- " + h).join("\n")}

Gere um resumo executivo estratégico, objetivo e profissional.
Sem bullet points.
No máximo 8 linhas.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error("Erro ao gerar narrativa do board:", error);
      return "Resumo executivo indisponível no momento.";
    }
  }
}

module.exports = new AIService();
