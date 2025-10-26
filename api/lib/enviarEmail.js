// ============================================================
// 💌 Envio de e-mails via Gmail (OAuth2) — com diagnósticos
// ============================================================
import nodemailer from "nodemailer";


const REQUIRED_VARS = [
  "GMAIL_USER",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
];


function checkEnv() {
  const missing = REQUIRED_VARS.filter(k => !process.env[k]);
  if (missing.length) {
    console.warn("⚠️ Variáveis ausentes para e-mail:", missing.join(", "));
    return false;
  }
  return true;
}


export default async function enviarEmail(destinatario, assunto, mensagem) {
  // Se faltar algo, simula (não quebra o fluxo)
  if (!checkEnv()) {
    console.log("📧 [SIMULAÇÃO] Envio de e-mail:", { destinatario, assunto, mensagem });
    return { status: "simulado" };
  }


  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });


    // Verifica conexão com o Gmail
    await transporter.verify();
    console.log("✅ Email transport pronto");


    // Envia para o usuário + ONG
    const toList = Array.isArray(destinatario)
      ? destinatario
      : [destinatario, "varaldossonhossp@gmail.com"];


    const info = await transporter.sendMail({
      from: `"Varal dos Sonhos 💙" <${process.env.GMAIL_USER}>`,
      to: toList.join(", "),
      replyTo: "varaldossonhossp@gmail.com",
      subject: assunto,
      text: mensagem,
    });


    console.log(`✉️  E-mail enviado: ${info.messageId} → ${toList.join(", ")}`);
    return { status: "ok", messageId: info.messageId };
  } catch (erro) {
    console.error("❌ Erro ao enviar e-mail:", erro?.response || erro?.message || erro);
    return { status: "erro", mensagem: String(erro?.message || erro) };
  }
}
