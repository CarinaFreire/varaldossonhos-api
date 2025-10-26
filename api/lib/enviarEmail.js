// ============================================================
// 💌 VARAL DOS SONHOS — envio de e-mails via Gmail (OAuth2)
// ------------------------------------------------------------
// Corrigido para:
//  ✅ garantir timeout curto (Render não trava)
//  ✅ logar erro de autenticação claramente
//  ✅ continuar execução mesmo que o e-mail falhe
// ============================================================


import nodemailer from "nodemailer";
import { google } from "googleapis";


export default async function enviarEmail(destinatario, assunto, mensagem) {
  try {
    const { GMAIL_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;


    if (!GMAIL_USER || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      console.warn("⚠️ Variáveis ausentes para e-mail. Simulando envio.");
      console.log("📧 [SIMULAÇÃO] Envio de e-mail:", { destinatario, assunto, mensagem });
      return { status: "simulado" };
    }


    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });


    const accessToken = await oauth2Client.getAccessToken();


    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: GMAIL_USER,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken?.token,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
    });


    const mailOptions = {
      from: `"Varal dos Sonhos 💙" <${GMAIL_USER}>`,
      to: destinatario,
      cc: "varaldossonhossp@gmail.com",
      subject: assunto,
      text: mensagem,
    };


    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ E-mail enviado para ${destinatario} (${info.messageId})`);
    return { status: "ok" };
  } catch (erro) {
    console.error("❌ Erro no envio de e-mail:", erro.message);
    return { status: "erro", mensagem: erro.message };
  }
}
