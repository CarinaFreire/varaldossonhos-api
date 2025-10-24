// ============================================================
// 💌 VARAL DOS SONHOS — /api/lib/enviarEmail.js
// ------------------------------------------------------------
// 🔧 Integração real com EmailJS (ou modo simulado se não configurado)
// ------------------------------------------------------------
// ✅ Variáveis de ambiente (defina no Render):
//    EMAILJS_SERVICE_ID
//    EMAILJS_TEMPLATE_ID
//    EMAILJS_PUBLIC_KEY   (substitui o antigo USER_ID)
// ------------------------------------------------------------
// 🏆 Recursos:
//   - Envia para doador e ONG automaticamente
//   - Modo simulado se faltar configuração
//   - Log detalhado no servidor
// ============================================================

import fetch from "node-fetch";

// 💙 E-mail oficial da ONG
const ONG_EMAIL = "varaldossonhossp@gmail.com";

export default async function enviarEmail(destinatario, assunto, mensagem, enviarParaONG = false) {
  const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID;

  // ------------------------------------------------------------
  // 🧩 Modo simulado (sem EmailJS configurado)
  // ------------------------------------------------------------
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("⚠️ EmailJS não configurado. Envio de e-mail será simulado.");
    console.log("📧 Simulação de envio:");
    console.log("Destinatário:", destinatario);
    console.log("Assunto:", assunto);
    console.log("Mensagem:", mensagem);

    if (enviarParaONG) {
      console.log("📨 Copiando simulação para ONG:", ONG_EMAIL);
    }

    return { status: "simulado", mensagem: "Envio simulado (modo teste)." };
  }

  // ------------------------------------------------------------
  // 📨 Prepara payload base
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // 🔹 Função interna de envio
  // ------------------------------------------------------------
  const send = async (to, subject, msg) => {
    const data = {
      ...payload,
      template_params: { to_email: to, subject, message: msg },
    };

    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Falha ao enviar e-mail:", errText);
        throw new Error(errText);
      }

      console.log(`✅ E-mail enviado com sucesso para ${to}`);
      return true;
    } catch (erro) {
      console.error("❌ Erro no envio de e-mail:", erro.message);
      return false;
    }
  };

  // ------------------------------------------------------------
  // 💌 Envia para o destinatário e ONG (se solicitado)
  // ------------------------------------------------------------
  const resultUser = await send(destinatario, assunto, mensagem);
  if (enviarParaONG) {
    const avisoONG = `📢 Nova ação no site!\n\n${mensagem}\n\n(Assunto original: ${assunto})`;
    await send(ONG_EMAIL, "📬 Notificação - Varal dos Sonhos", avisoONG);
  }

  return {
    status: resultUser ? "ok" : "erro",
    mensagem: resultUser ? "E-mails enviados com sucesso." : "Falha ao enviar e-mails.",
  };
}
