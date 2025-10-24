// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js (versão estável e compatível)
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
  console.warn("⚠️ Defina AIRTABLE_API_KEY e AIRTABLE_BASE_ID nas variáveis do Render.");
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// ============================================================
// ⚙️ Helpers
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
    // 💌 CARTINHAS
    // ============================================================
    if ((pathname === "/api/cartinhas" || rota === "cartinhas") && method === "GET") {
      const registros = await base("cartinhas")
        .select({ filterByFormula: "IF({status}='disponível', TRUE(), FALSE())" })
        .all();
      const cartinhas = registros.map((r) => ({
        id: r.id,
        nome: r.fields.nome_crianca || r.fields.primeiro_nome || "Anônimo",
        idade: r.fields.idade || "",
        sonho: r.fields.sonho || "",
        ponto_coleta: r.fields.ponto_coleta || "",
        imagem_cartinha: r.fields.imagem_cartinha?.[0]?.url || "",
        status: r.fields.status || "disponível",
      }));
      return sendJson(res, 200, cartinhas);
    }

    // ============================================================
    // 🧍 CADASTRO — cria novo doador
    // ============================================================
    if ((pathname === "/api/cadastro" || rota === "cadastro") && method === "POST") {
      const body = await parseJsonBody(req);
      if (body === null) return sendJson(res, 400, { error: "Corpo inválido" });

      const { nome, email, senha, telefone, cidade } = body;
      if (!nome || !email || !senha)
        return sendJson(res, 400, { error: "Campos obrigatórios faltando." });

      const existentes = await base("doador")
        .select({ filterByFormula: `{email} = "${email}"`, maxRecords: 1 })
        .firstPage();
      if (existentes.length > 0)
        return sendJson(res, 409, { error: "E-mail já cadastrado." });

      const novo = await base("doador").create([
        {
          fields: {
            nome,
            primeiro_nome: nome.split(" ")[0],
            email,
            telefone: telefone || "",
            cidade: cidade || "",
            senha,
            status: "ativo",
            data_cadastro: new Date().toISOString().split("T")[0], // ✅ corrigido
          },
        },
      ]);

      try {
        await enviarEmail(
          email,
          "Bem-vindo ao Varal dos Sonhos 💙",
          `Olá ${nome}, seu cadastro foi realizado com sucesso!`
        );
      } catch (err) {
        console.warn("Falha ao enviar e-mail de boas-vindas:", err);
      }

      return sendJson(res, 200, {
        sucesso: true,
        message: "Usuário cadastrado com sucesso.",
        id: novo[0].id,
      });
    }

    // ============================================================
    // 💝 ADOÇÕES
    // ============================================================
    if ((pathname === "/api/adocoes" || rota === "adocoes") && method === "POST") {
      const body = await parseJsonBody(req);
      if (body === null) return sendJson(res, 400, { error: "Corpo inválido" });

      const { usuarioEmail, cartinhas, ponto_coleta } = body;
      if (!usuarioEmail || !Array.isArray(cartinhas))
        return sendJson(res, 400, { error: "Dados inválidos." });

      for (const c of cartinhas) {
        await base("doacoes").create([
          {
            fields: {
              doador: usuarioEmail,
              cartinha: c.nome || c.id || "",
              ponto_coleta: ponto_coleta || c.ponto_coleta || "",
              data_doacao: new Date().toISOString().split("T")[0],
              status_doacao: "aguardando_entrega",
              mensagem_confirmacao: `Adoção registrada para ${usuarioEmail}`,
            },
          },
        ]);
      }

      try {
        await enviarEmail(
          usuarioEmail,
          "Confirmação de Adoção 💙",
          `Recebemos sua adoção de ${cartinhas.length} cartinha(s). Obrigado por espalhar sonhos!`
        );
      } catch (err) {
        console.warn("Erro ao enviar e-mail de confirmação:", err);
      }

      return sendJson(res, 200, {
        sucesso: true,
        message: "Adoções registradas com sucesso!",
      });
    }

    // ============================================================
    // 🚫 Rota não encontrada
    // ============================================================
    return sendJson(res, 404, { erro: "Rota não encontrada." });
  } catch (erro) {
    console.error("❌ Erro interno:", erro);
    return sendJson(res, 500, {
      erro: "Erro interno no servidor.",
      detalhe: erro.message || String(erro),
    });
  }
}

// ============================================================
// 🚀 Inicialização do servidor
// ============================================================
const PORT = process.env.PORT || 5000;
http.createServer(handler).listen(PORT, () => {
  console.log(`🚀 Servidor Varal dos Sonhos rodando na porta ${PORT}`);
});


