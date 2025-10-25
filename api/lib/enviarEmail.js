// ============================================================
// 💌 VARAL DOS SONHOS — envio de e-mails via Gmail (OAuth2)
// ------------------------------------------------------------
// Requer variáveis de ambiente configuradas no Render:
//   GMAIL_USER
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REFRESH_TOKEN
// ------------------------------------------------------------
// Envia e-mails tanto para o usuário quanto para o e-mail da ONG
// ============================================================


import nodemailer from "nodemailer";


export default async function enviarEmail(destinatario, assunto, mensagem) {
  try {
    // 🔐 Configuração do transporte OAuth2
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


    // ✉️ Configurações do e-mail
    const mailOptions = {
      from: `"Varal dos Sonhos 💙" <${process.env.GMAIL_USER}>`,
      to: destinatario,
      cc: "varaldossonhossp@gmail.com", // ✅ Cópia automática para ONG
      subject: assunto,
      text: mensagem,
    };


    // 🚀 Envio do e-mail
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ E-mail enviado com sucesso para ${destinatario}`);
    return { status: "ok", info };


  } catch (erro) {
    console.error("❌ Erro ao enviar e-mail:", erro.message);
    return { status: "erro", mensagem: erro.message };
  }
}
