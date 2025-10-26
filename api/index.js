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
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


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
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
}


// ============================================================
// 🌈 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    });
    return res.end();
  }


  try {
    const { method, url } = req;
    const pathname = new URL(url, `http://${req.headers.host}`).pathname;


    // ============================================================
    // 👤 CADASTRO DE DOADOR
    // ============================================================
    if (pathname === "/api/cadastro" && method === "POST") {
      const { nome, email, telefone, senha, cidade } = await parseJsonBody(req);
      if (!nome || !email || !senha)
        return sendJson(res, 400, { error: "Campos obrigatórios faltando." });


      const existentes = await base("doador")
        .select({ filterByFormula: `{email}='${email}'`, maxRecords: 1 })
        .firstPage();


      if (existentes.length > 0)
        return sendJson(res, 409, { error: "E-mail já cadastrado." });


      const primeiro_nome = nome.split(" ")[0];


      const novo = await base("doador").create([
        {
          fields: {
            id_doador: `D${Date.now()}`,
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


      console.log("📬 Enviando e-mail de boas-vindas para:", email);
      await enviarEmail(email, "Varal dos Sonhos 💙", `Olá ${nome}, seu cadastro foi realizado com sucesso!`);
      console.log("✅ Cadastro finalizado para:", email);


      return sendJson(res, 200, { success: true, mensagem: "Cadastro realizado com sucesso!" });
    }


    // ============================================================
    // 🔐 LOGIN
    // ============================================================
    if (pathname === "/api/login" && method === "POST") {
      const { email, senha } = await parseJsonBody(req);
      const registros = await base("doador")
        .select({ filterByFormula: `{email}='${email}'`, maxRecords: 1 })
        .firstPage();


      if (!registros.length)
        return sendJson(res, 404, { error: "E-mail não encontrado." });


      const usuario = registros[0].fields;
      if (usuario.senha !== senha)
        return sendJson(res, 401, { error: "Senha incorreta." });


      return sendJson(res, 200, { success: true, usuario });
    }


    // ============================================================
    // 📍 PONTOS DE COLETA
    // ============================================================
    if (pathname === "/api/pontosdecoleta" && method === "GET") {
      const registros = await base("pontosdecoleta").select().all();
      const pontos = registros.map((r) => ({
        id: r.id,
        nome_local: r.fields.nome_local,
        endereco: r.fields.endereco,
      }));
      return sendJson(res, 200, pontos);
    }


    // ============================================================
    // 💝 REGISTRAR ADOÇÃO
    // ============================================================
    if (pathname === "/api/adocoes" && method === "POST") {
      const { usuarioNome, usuarioEmail, cartinhas } = await parseJsonBody(req);


      for (const c of cartinhas) {
        await base("doacoes").create([
          {
            fields: {
              id_doacao: `DOA-${Date.now()}`,
              doador: usuarioNome || usuarioEmail,
              cartinha: c.nome || "",
              ponto_coleta: c.ponto_coleta || "Ponto não informado",
              data_doacao: new Date().toISOString().split("T")[0],
              status_doacao: "aguardando_entrega",
              mensagem_confirmacao: "🎁 Sua cartinha foi adotada! Aguarde confirmação para a compra do presente.",
            },
          },
        ]);
      }


      await enviarEmail(
        usuarioEmail,
        "Varal dos Sonhos 💙",
        "🎁 Sua cartinha foi adotada! Aguarde confirmação para a compra do presente."
      );


      return sendJson(res, 200, { success: true, mensagem: "Adoção registrada com sucesso!" });
    }


    sendJson(res, 404, { erro: "Rota não encontrada." });
  } catch (erro) {
    console.error("❌ Erro interno:", erro);
    sendJson(res, 500, { erro: erro.message });
  }
}


// ============================================================
// 🚀 INICIALIZAÇÃO DO SERVIDOR
// ============================================================
const PORT = process.env.PORT || 5000;
http.createServer(handler).listen(PORT, () => {
  console.log(`Servidor Varal dos Sonhos rodando na porta ${PORT} 🚀`);
});
