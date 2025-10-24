// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js (VERSÃO FINAL)
// ------------------------------------------------------------
// 🔧 Integrações:
//   • Airtable — armazenamento principal
//   • EmailJS — envio de confirmações
//   • .NET MAUI / Vercel — consumo de rotas REST
// ============================================================

import dotenv from "dotenv";
dotenv.config();

import Airtable from "airtable";
import enviarEmail from "./lib/enviarEmail.js";
import http from "http";

// ============================================================
// 🔑 Configuração Airtable
// ============================================================
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.warn("⚠️ Defina AIRTABLE_API_KEY e AIRTABLE_BASE_ID nas variáveis de ambiente.");
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// ============================================================
// ⚙️ Funções auxiliares
// ============================================================
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data, null, 2));
}

async function parseJsonBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    return null;
  }
}

function getRotaFromUrl(reqUrl, headers) {
  try {
    const u = new URL(reqUrl, `http://${headers.host}`);
    return { fullUrl: u, rota: u.searchParams.get("rota") };
  } catch {
    const parts = reqUrl.split("?rota=");
    return { fullUrl: null, rota: parts[1] || null };
  }
}

// ============================================================
// 🌈 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.end();
    return;
  }

  const { method, url, headers } = req;
  const { fullUrl, rota } = getRotaFromUrl(url, headers);
  const pathname = fullUrl ? fullUrl.pathname : url.split("?")[0];

  try {
    // ============================================================
    // 🗓️ EVENTOS
    // ============================================================
    if ((pathname === "/api/eventos" || rota === "eventos") && method === "GET") {
      const records = await base("eventos")
        .select({
          filterByFormula: "IF({destaque_home}=TRUE(), TRUE(), FALSE())",
          sort: [{ field: "data_inicio", direction: "asc" }],
        })
        .all();

      const eventos = records.map((r) => ({
        id: r.id,
        nome: r.fields.nome_evento || r.fields.nome || "Evento sem nome",
        data_inicio: r.fields.data_inicio || "",
        descricao: r.fields.descricao || "",
        imagem:
          r.fields.imagem_evento?.[0]?.url ||
          r.fields.Imagem_evento?.[0]?.url ||
          "/imagens/evento-padrao.jpg",
      }));

      return sendJson(res, 200, eventos);
    }

    // ============================================================
    // 💌 CARTINHAS
    // ============================================================
    if ((pathname === "/api/cartinhas" || rota === "cartinhas") && method === "GET") {
      const registros = await base("cartinhas")
        .select({ filterByFormula: "IF({status}='disponível', TRUE(), FALSE())" })
        .all();

      const cartinhas = registros.map((r) => {
        const f = r.fields;
        return {
          id: r.id,
          nome: f.nome_crianca || f.primeiro_nome || "Anônimo",
          idade: f.idade || "",
          sonho: f.sonho || "",
          ponto_coleta: f.ponto_coleta || "",
          imagem_cartinha: f.imagem_cartinha?.[0]?.url || "",
          status: f.status || "disponível",
        };
      });

      return sendJson(res, 200, cartinhas);
    }

    // ============================================================
    // 📍 PONTOS DE COLETA
    // ============================================================
    if ((pathname === "/api/pontosdecoleta" || rota === "pontosdecoleta") && method === "GET") {
      const registros = await base("pontosdecoleta").select().all();
      const pontos = registros.map((r) => ({
        id: r.id,
        nome_local: r.fields.nome_local || "",
        endereco: r.fields.endereco || "",
        telefone: r.fields.telefone || "",
        email: r.fields.email || "",
        horario_funcionamento: r.fields.horario_funcionamento || "",
        responsavel: r.fields.responsavel || "",
        lat: r.fields.lat || null,
        lng: r.fields.lng || null,
      }));
      return sendJson(res, 200, pontos);
    }

    // ============================================================
    // 🧍 CADASTRO
    // ============================================================
    if ((pathname === "/api/cadastro" || rota === "cadastro") && method === "POST") {
      const body = await parseJsonBody(req);
      if (body === null) return sendJson(res, 400, { error: "Corpo inválido" });

      const { nome, email, senha } = body;
      if (!nome || !email || !senha)
        return sendJson(res, 400, { error: "Campos obrigatórios faltando." });

      const existentes = await base("usuario")
        .select({ filterByFormula: `{email} = "${email}"`, maxRecords: 1 })
        .firstPage();
      if (existentes.length > 0)
        return sendJson(res, 409, { error: "E-mail já cadastrado." });

      await base("usuario").create([
        {
          fields: {
            nome,
            email,
            senha,
            tipo_usuario: "doador",
            status: "ativo",
            data_cadastro: new Date().toISOString().split("T")[0],
          },
        },
      ]);

      await enviarEmail(email, "Bem-vindo ao Varal dos Sonhos", `Olá ${nome}, seu cadastro foi realizado!`);
      return sendJson(res, 200, { message: "Usuário cadastrado com sucesso." });
    }

    // ============================================================
    // 💝 ADOÇÕES — corrigido
    // ============================================================
    if ((pathname === "/api/adocoes" || rota === "adocoes") && method === "POST") {
      const body = await parseJsonBody(req);
      if (body === null)
        return sendJson(res, 400, { error: "Corpo inválido ou JSON malformado." });

      const { usuarioEmail, cartinhas } = body;

      if (!usuarioEmail || !Array.isArray(cartinhas) || cartinhas.length === 0) {
        return sendJson(res, 400, { error: "Dados inválidos. Envie e-mail e cartinhas." });
      }

      console.log("📦 Registrando adoções para:", usuarioEmail);

      for (const c of cartinhas) {
        await base("doacoes").create([
          {
            fields: {
              doador: usuarioEmail, // ✅ compatível com texto simples ou long text
              cartinha: c.id_cartinha || c.id || "",
              ponto_coleta: c.ponto_coleta || "",
              data_doacao: new Date().toISOString().split("T")[0],
              status_doacao: "aguardando_entrega",
              mensagem_confirmacao: `Adoção registrada para ${usuarioEmail}`,
            },
          },
        ]);
      }

      await enviarEmail(
        usuarioEmail,
        "Confirmação de Adoção 💙",
        `Recebemos sua adoção de ${cartinhas.length} cartinha(s). Obrigado por espalhar sonhos! 🌟`
      );

      return sendJson(res, 200, { success: true, message: "Adoções registradas com sucesso!" });
    }

    // ============================================================
    // 🚫 Rota não encontrada
    // ============================================================
    return sendJson(res, 404, { erro: "Rota não encontrada." });
  } catch (erro) {
    console.error("❌ Erro interno:", erro);
    return sendJson(res, 500, { erro: "Erro interno no servidor.", detalhe: erro.message });
  }
}

// ============================================================
// 🚀 Inicialização do servidor local
// ============================================================
const PORT = process.env.PORT || 5000;
const server = http.createServer(handler);
server.listen(PORT, () => console.log(`Servidor Varal dos Sonhos rodando na porta ${PORT} 🚀`));
