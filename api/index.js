// ============================================================
// 💙 VARAL DOS SONHOS — API UNIFICADA (Render)
// ============================================================

import dotenv from "dotenv";
dotenv.config();
import Airtable from "airtable";
import enviarEmail from "./lib/enviarEmail.js";
import http from "http";

// ============================================================
// 🔑 CONFIGURAÇÃO AIRTABLE
// ============================================================
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.warn("⚠️ Variáveis do Airtable não configuradas corretamente.");
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// ============================================================
// ⚙️ FUNÇÕES AUXILIARES
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
    // 🧍 CADASTRO DE DOADOR
    // ============================================================
    if ((pathname === "/api/cadastro" || rota === "cadastro") && method === "POST") {
      const body = await parseJsonBody(req);
      if (!body) return sendJson(res, 400, { error: "Corpo inválido" });

      const { nome, email, telefone, senha, cidade } = body;
      if (!nome || !email || !senha)
        return sendJson(res, 400, { error: "Campos obrigatórios faltando." });

      const existentes = await base("doadores")
        .select({ filterByFormula: `{email} = '${email}'`, maxRecords: 1 })
        .firstPage();

      if (existentes.length > 0)
        return sendJson(res, 409, { error: "E-mail já cadastrado." });

      const primeiro_nome = nome.split(" ")[0];

      const novo = await base("doadores").create([
        {
          fields: {
            nome,
            primeiro_nome,
            email,
            telefone: telefone || "",
            senha,
            cidade: cidade || "",
            status: "ativo",
            data_cadastro: new Date().toISOString().split("T")[0],
          },
        },
      ]);

      await enviarEmail(email, "Bem-vindo ao Varal dos Sonhos 💙", `Olá ${nome}, seu cadastro foi realizado com sucesso!`);

      return sendJson(res, 200, { success: true, id: novo[0].id });
    }

    // ============================================================
    // 🔐 LOGIN DE DOADOR
    // ============================================================
    if ((pathname === "/api/login" || rota === "login") && method === "POST") {
      const body = await parseJsonBody(req);
      if (!body) return sendJson(res, 400, { error: "Corpo inválido" });

      const { email, senha } = body;
      const registros = await base("doadores")
        .select({ filterByFormula: `{email} = '${email}'`, maxRecords: 1 })
        .firstPage();

      if (registros.length === 0)
        return sendJson(res, 404, { error: "Usuário não encontrado." });

      const usuario = registros[0].fields;
      if (usuario.senha !== senha)
        return sendJson(res, 401, { error: "Senha incorreta." });

      return sendJson(res, 200, {
        success: true,
        usuario: {
          id: registros[0].id,
          nome: usuario.nome,
          email: usuario.email,
        },
      });
    }

    // ============================================================
    // 💌 CARTINHAS DISPONÍVEIS
    // ============================================================
    if ((pathname === "/api/cartinhas" || rota === "cartinhas") && method === "GET") {
      const registros = await base("cartinhas")
        .select({ filterByFormula: "{status} = 'disponível'" })
        .all();

      const cartinhas = registros.map((r) => ({
        id: r.id,
        nome: r.fields.nome_crianca || "Anônimo",
        idade: r.fields.idade || "",
        sonho: r.fields.sonho || "",
        imagem_cartinha: r.fields.imagem_cartinha?.[0]?.url || "",
        status: r.fields.status || "disponível",
      }));

      return sendJson(res, 200, cartinhas);
    }

    // ============================================================
    // 📍 PONTOS DE COLETA
    // ============================================================
    if ((pathname === "/api/pontosdecoleta" || rota === "pontosdecoleta") && method === "GET") {
      const registros = await base("pontosdecoleta").select().all();

      const pontos = registros.map((r) => ({
        id: r.id,
        id_ponto: r.fields.id_ponto || "",
        nome_local: r.fields.nome_local || "",
        endereco: r.fields.endereco || "",
        telefone: r.fields.telefone || "",
        email: r.fields.email || "",
        horario_funcionamento: r.fields.horario_funcionamento || "",
        responsavel: r.fields.responsavel || "",
        status: r.fields.status || "",
        data_cadastro: r.fields.data_cadastro || "",
      }));

      return sendJson(res, 200, pontos);
    }

    // ============================================================
    // 💝 REGISTRAR ADOÇÃO
    // ============================================================
    if ((pathname === "/api/adocoes" || rota === "adocoes") && method === "POST") {
      const body = await parseJsonBody(req);
      const { usuarioEmail, cartinhas } = body;

      for (const c of cartinhas) {
        await base("doacoes").create([
          {
            fields: {
              doador: usuarioEmail,
              cartinha: c.nome || "",
              ponto_coleta: c.ponto_coleta || "",
              data_doacao: new Date().toISOString().split("T")[0],
              status_doacao: "aguardando_entrega",
              mensagem_confirmacao: "🎁 Sua cartinha foi adotada! Aguarde confirmação para compra do presente.",
            },
          },
        ]);
      }

      await enviarEmail(usuarioEmail, "💙 Adoção registrada!", "Sua adoção foi registrada com sucesso. Obrigado por espalhar sonhos!");

      return sendJson(res, 200, { success: true, message: "Adoção registrada com sucesso!" });
    }

    return sendJson(res, 404, { erro: "Rota não encontrada." });
  } catch (erro) {
    console.error("❌ Erro interno:", erro);
    return sendJson(res, 500, { erro: erro.message || "Erro interno." });
  }
}

// ============================================================
// 🚀 INICIALIZAÇÃO DO SERVIDOR
// ============================================================
const PORT = process.env.PORT || 5000;
http.createServer(handler).listen(PORT, () => {
  console.log(`Servidor Varal dos Sonhos rodando na porta ${PORT} 🚀`);
});
