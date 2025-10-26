// ============================================================
// 💌 VARAL DOS SONHOS — Envio de e-mails com Gmail API (OAuth2)
// ------------------------------------------------------------
// Requer variáveis no Render:
//   GMAIL_USER
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REFRESH_TOKEN
// ------------------------------------------------------------
// Envia e-mails tanto para o usuário quanto para a ONG
// ============================================================


import { google } from "googleapis";


export default async function enviarEmail(destinatario, assunto, mensagem) {
  try {
    // 🔑 Autenticação OAuth2
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });


    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const remetente = process.env.GMAIL_USER;


    // ✉️ Corrige codificação do assunto (UTF-8 + Base64)
    const assuntoPadrao = `Varal dos Sonhos 💙 — ${assunto}`;
    const assuntoCodificado = `=?UTF-8?B?${Buffer.from(assuntoPadrao).toString("base64")}?=`;


    // 📧 Corpo do e-mail
    const corpoEmail = [
      `From: "Varal dos Sonhos 💙" <${remetente}>`,
      `To: ${destinatario}`,
      `Cc: varaldossonhossp@gmail.com`,
      `Subject: ${assuntoCodificado}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      mensagem,
    ].join("\n");


    // 🔠 Codifica mensagem completa em Base64 para envio
    const encodedMessage = Buffer.from(corpoEmail)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");


    // 🚀 Envia via Gmail API
    const resposta = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });


    console.log(`✅ E-mail enviado para ${destinatario}`);
    return { status: "ok", data: resposta.data };
  } catch (erro) {
    console.error("❌ Erro ao enviar e-mail:", erro.message);
    return { status: "erro", mensagem: erro.message };
  }
}

