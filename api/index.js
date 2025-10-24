// ============================================================
// 💙 VARAL DOS SONHOS — BACKEND UNIFICADO (Render + Airtable + EmailJS)
// ============================================================

import http from "http";
import fetch from "node-fetch";
import Airtable from "airtable";
import dotenv from "dotenv";
dotenv.config();

// ============================================================
// 🔑 Configuração Airtable
// ============================================================
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error("❌ Variáveis AIRTABLE_API_KEY e AIRTABLE_BASE_ID não configuradas!");
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// ============================================================
// 📧 Função auxiliar — Envia e-mails com EmailJS (ou simula)
// ============================================================
async function enviarEmail(destinatario, assunto, mensagem) {
  const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("⚠️ EmailJS não configurado. Enviando e-mail simulado:");
    console.log("📧 Para:", destinatario);
    console.log("Assunto:", assunto);
    console.log("Mensagem:", mensagem);
    return { status: "simulado" };
  }

  const payload = {
    service_id: SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id: PUBLIC_KEY,
    template_params: {
      to_email: destinatario,
      subject: assunto,
      message: mensagem,
    },
  };

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    console.log(`✅ E-mail enviado com sucesso para ${destinatario}`);
    return { status: "ok" };
  } catch (err) {
    console.error("❌ Erro ao enviar e-mail:", err.message);
    return { status: "erro", mensagem: err.message };
  }
}

// ============================================================
// ⚙️ Utilitários gerais
// ============================================================
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data, null, 2));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    return null;
  }
}

// ============================================================
// 🌈 ROTAS
// ============================================================
async function handler(req, res) {
  const { method, url } = req;

  if (method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.end();
    return;
  }

  try {
    // ------------------------------------------------------------
    // 📜 ROTA: /api/cartinhas
    // ------------------------------------------------------------
    if (url.startsWith("/api/cartinhas") && method === "GET") {
      const registros = await base("cartinhas")
        .select({ filterByFormula: "IF({status}='disponível', TRUE(), FALSE())" })
        .all();

      const cartinhas = registros.map((r) => ({
        id: r.id,
        nome: r.fields.nome_crianca || r.fields.primeiro_nome || "Anônimo",
        idade: r.fields.idade || "",
        sonho: r.fields.sonho || "",
        imagem_cartinha: r.fields.imagem_cartinha?.[0]?.url || "",
        ponto_coleta: r.fields.ponto_coleta || "",
        status: r.fields.status || "disponível",
      }));

      return sendJson(res, 200, cartinhas);
    }

    // ------------------------------------------------------------
    // 🧍 ROTA: /api/cadastro
    // ------------------------------------------------------------
    if (url.startsWith("/api/cadastro") && method === "POST") {
      const body = await parseBody(req);
      if (!body) return sendJson(res, 400, { erro: "Corpo inválido." });

      const { nome, email, senha, telefone, cidade } = body;
      if (!nome || !email || !senha)
        return sendJson(res, 400, { erro: "Campos obrigatórios faltando." });

      // Evita duplicado
      const existente = await base("doador")
        .select({ filterByFormula: `{email} = "${email}"`, maxRecords: 1 })
        .firstPage();

      if (existente.length > 0)
        return sendJson(res, 409, { erro: "E-mail já cadastrado." });

      const novo = await base("doador").create([
        {
          fields: {
            id_doador: "u" + Math.random().toString(36).substring(2, 8),
            nome,
            primeironome: nome.split(" ")[0],
            email,
            telefone: telefone || "",
            senha,
            cidade: cidade || "",
            status: "ativo",
            datacadastro: new Date().toISOString().split("T")[0],
          },
        },
      ]);

      await enviarEmail(
        email,
        "Bem-vindo ao Varal dos Sonhos 💙",
        `Olá ${nome}, seu cadastro foi realizado com sucesso!`
      );

      return sendJson(res, 200, { sucesso: true, id: novo[0].id });
    }

    // ------------------------------------------------------------
    // 💝 ROTA: /api/adocoes
    // ------------------------------------------------------------
    if (url.startsWith("/api/adocoes") && method === "POST") {
      const body = await parseBody(req);
      if (!body) return sendJson(res, 400, { erro: "Corpo inválido." });

      const { usuarioEmail, cartinhas } = body;
      if (!usuarioEmail || !Array.isArray(cartinhas))
        return sendJson(res, 400, { erro: "Dados inválidos." });

      const registrosDoador = await base("doador")
        .select({ filterByFormula: `{email} = "${usuarioEmail}"`, maxRecords: 1 })
        .firstPage();

      const nomeDoador =
        registrosDoador.length > 0
          ? registrosDoador[0].fields.nome
          : usuarioEmail;

      for (const c of cartinhas) {
        await base("doacoes").create([
          {
            fields: {
              id_doacao: "d" + Math.random().toString(36).substring(2, 8),
              doador: nomeDoador,
              cartinha: c.nome || c.id || "",
              ponto_coleta: c.ponto_coleta || "",
              data_doacao: new Date().toISOString().split("T")[0],
              status_doacao: "aguardando_entrega",
              mensagem_confirmacao: `💙 Adoção registrada para ${nomeDoador}`,
            },
          },
        ]);
      }

      await enviarEmail(
        usuarioEmail,
        "Confirmação de Adoção 💌",
        `Olá ${nomeDoador}, recebemos sua adoção de ${cartinhas.length} cartinha(s)! 💙`
      );

      return sendJson(res, 200, { sucesso: true, mensagem: "Adoções registradas com sucesso!" });
    }

    // ------------------------------------------------------------
    // 🚫 DEFAULT
    // ------------------------------------------------------------
    return sendJson(res, 404, { erro: "Rota não encontrada." });
  } catch (err) {
    console.error("❌ Erro interno:", err);
    return sendJson(res, 500, { erro: "Erro interno no servidor.", detalhe: err.message });
  }
}

// ============================================================
// 🚀 Inicializa servidor
// ============================================================
const PORT = process.env.PORT || 5000;
http.createServer(handler).listen(PORT, () => {
  console.log(`🚀 Servidor Varal dos Sonhos rodando na porta ${PORT}`);
});
