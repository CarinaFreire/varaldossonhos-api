// ============================================================
// 💌 VARAL DOS SONHOS — envio de e-mails via Gmail (OAuth2)
// ------------------------------------------------------------
// Garante que a API sempre responde (timeout de 4 segundos)
// ------------------------------------------------------------


import nodemailer from "nodemailer";


export default async function enviarEmail(destinatario, assunto, mensagem) {
  console.log("📨 Iniciando envio de e-mail para:", destinatario);


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
      cc: "varaldossonhossp@gmail.com", // cópia automática
      subject: assunto,
      text: mensagem,
    };


    // 🚀 Tentativa de envio (timeout 4s)
    const envioPromise = transporter.sendMail(mailOptions);
    const resultado = await Promise.race([
      envioPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("⏰ Timeout no envio de e-mail")), 4000)
      ),
    ]);


    console.log(`✅ E-mail enviado com sucesso para ${destinatario}`);
    return { status: "ok", info: resultado };


  } catch (erro) {
    console.error("❌ Erro ao enviar e-mail:", erro.message);
    return { status: "erro", mensagem: erro.message };
  } finally {
    console.log("📩 Fluxo de e-mail concluído, prosseguindo com resposta da API...");
  }
}

