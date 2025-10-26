// ============================================================
// 💌 VARAL DOS SONHOS — envio de e-mails padrão via Gmail (OAuth2)
// ------------------------------------------------------------
// Requer variáveis de ambiente configuradas no Render:
//   GMAIL_USER
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REFRESH_TOKEN
// ============================================================


import nodemailer from "nodemailer";


export default async function enviarEmail(destinatario, assunto, mensagem) {
  try {
    const user = process.env.GMAIL_USER;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;


    if (!user || !clientId || !clientSecret || !refreshToken) {
      console.warn("⚠️ Variáveis do Gmail não configuradas corretamente. Simulando envio...");
      console.log("📧 [SIMULAÇÃO] E-mail:", { destinatario, assunto, mensagem });
      return { status: "simulado" };
    }


    // 🔐 Autenticação OAuth2
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user,
        clientId,
        clientSecret,
        refreshToken,
      },
    });


    // ✉️ Configuração do e-mail com formatação padrão
    const mailOptions = {
      from: `"Varal dos Sonhos 💙" <${user}>`,
      to: destinatario,
      cc: "varaldossonhossp@gmail.com", // ONG recebe cópia
      subject: "Varal dos Sonhos 💙", // Assunto fixo
      text: `${mensagem}\n\nCom carinho,\nEquipe Varal dos Sonhos 💙`,
    };


    // 🚀 Envio
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ E-mail enviado com sucesso para ${destinatario}`);
    return { status: "ok", info };
  } catch (erro) {
    console.error("❌ Erro ao enviar e-mail:", erro.message);
    return { status: "erro", mensagem: erro.message };
  }
}