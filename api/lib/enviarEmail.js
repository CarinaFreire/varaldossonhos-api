// ============================================================
// 💌 VARAL DOS SONHOS — envio de e-mails via Gmail (OAuth2)
// ------------------------------------------------------------
// Requer variáveis de ambiente configuradas no Render:
//   GMAIL_USER
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REFRESH_TOKEN
// ------------------------------------------------------------
// Envia e-mails tanto para o usuário quanto para a ONG
// ============================================================


import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();


export default async function enviarEmail(destinatario, assunto, mensagem) {
  try {
    // 🔐 Autenticação OAuth2
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );


    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });


    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err || !token) reject("Falha ao gerar access token");
        resolve(token);
      });
    });


    // 🚀 Configuração do transporte (SMTP Gmail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken,
      },
    });


    // ✉️ Configurações do e-mail
    const mailOptions = {
      from: `"Varal dos Sonhos 💙" <${process.env.GMAIL_USER}>`,
      to: destinatario,
      cc: "varaldossonhossp@gmail.com", // ONG recebe cópia
      subject: "Varal dos Sonhos 💙",
      text: mensagem,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    };


    // 📤 Envia o e-mail
    await transporter.sendMail(mailOptions);
    console.log(`✅ E-mail enviado para ${destinatario}`);
    return { status: "ok" };


  } catch (erro) {
    console.error("❌ Erro ao enviar e-mail:", erro.message || erro);
    return { status: "erro", mensagem: erro.message };
  }
}
