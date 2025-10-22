// ============================================================
// 💌 VARAL DOS SONHOS — /api/lib/enviarEmail.js
// ------------------------------------------------------------
// 🔧 Integração real com EmailJS (ou modo simulado se não configurado)
// ------------------------------------------------------------
// ✅ Variáveis de ambiente (defina na Vercel):
//    EMAILJS_SERVICE_ID
//    EMAILJS_TEMPLATE_ID
//    EMAILJS_USER_ID
// ------------------------------------------------------------
// 🏆 Recursos:
//   - Simulação automática se EmailJS não estiver configurado
//   - Mensagem de pontuação automática (ex: “Você ganhou 10 pontos!”)
// ============================================================

import fetch from "node-fetch";

export default async function enviarEmail(destinatario, assunto, mensagem, pontuacao = 0) {
  const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
  const USER_ID = process.env.EMAILJS_USER_ID;

  if (!SERVICE_ID || !TEMPLATE_ID || !USER_ID) {
    console.warn("⚠️ EmailJS não configurado. Envio de e-mail será simulado.");
    console.log("📧 SIMULAÇÃO DE E-MAIL:");
    console.log("Destinatário:", destinatario);
    console.log("Assunto:", assunto);
    console.log("Mensagem:", mensagem);
    if (pontuacao > 0) console.log(`✨ Pontuação adicionada: ${pontuacao} pontos`);
    return { status: "simulado", mensagem: "Envio de e-mail simulado (modo teste)." };
  }

  let mensagemFinal = mensagem;
  if (pontuacao > 0) {
    mensagemFinal += `\n\n✨ Você ganhou ${pontuacao} ponto${pontuacao > 1 ? "s" : ""} por esta ação! Obrigado por fazer parte do Varal dos Sonhos. 💙`;
  }

  const payload = {
    service_id: SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id: USER_ID,
    template_params: {
      to_email: destinatario,
      subject: assunto,
      message: mensagemFinal,
    },
  };

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Falha ao enviar e-mail:", errText);
      throw new Error(errText);
    }

    console.log(`✅ E-mail enviado com sucesso para ${destinatario}`);
    return { status: "ok", mensagem: "E-mail enviado com sucesso via EmailJS." };

  } catch (erro) {
    console.error("❌ Erro no envio de e-mail:", erro);
    return { status: "erro", mensagem: "Falha ao enviar e-mail: " + erro.message };
  }
}
