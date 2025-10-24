// ============================================================
// 💌 VARAL DOS SONHOS — /api/lib/enviarEmail.js
// ------------------------------------------------------------
// Integração real com EmailJS (ou modo simulado se não configurado)
// ------------------------------------------------------------
// ✅ Variáveis de ambiente (Render):
//    EMAILJS_SERVICE_ID
//    EMAILJS_TEMPLATE_ID
//    EMAILJS_USER_ID  (ou EMAILJS_PUBLIC_KEY)
// ------------------------------------------------------------
// 🏆 Recursos:
//   - Envia e-mails personalizados: cadastro, adoção, atualização
//   - Mantém compatibilidade total com o template do EmailJS
//   - Simulação automática se não configurado
// ============================================================

import fetch from "node-fetch";

/**
 * Envia e-mail via EmailJS
 * @param {string} destinatario - E-mail do destinatário
 * @param {string} tipo - Tipo de mensagem (cadastro, adocao, status)
 * @param {object|string} dados - Dados dinâmicos ou mensagem direta
 * @param {number} pontuacao - Pontuação opcional (gamificação)
 */
export default async function enviarEmail(destinatario, tipo = "geral", dados = {}, pontuacao = 0) {
  const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
  const USER_ID = process.env.EMAILJS_USER_ID || process.env.EMAILJS_PUBLIC_KEY;

  // ============================================================
  // ⚠️ Caso EmailJS não esteja configurado
  // ============================================================
  if (!SERVICE_ID || !TEMPLATE_ID || !USER_ID) {
    console.warn("⚠️ EmailJS não configurado. Envio de e-mail será simulado.");
    console.log("📧 SIMULAÇÃO DE E-MAIL:");
    console.log("Destinatário:", destinatario);
    console.log("Tipo:", tipo);
    console.log("Dados:", dados);
    return { status: "simulado", mensagem: "Envio de e-mail simulado (modo teste)." };
  }

  // ============================================================
  // 🧩 Montagem automática da mensagem
  // ============================================================
  let assunto = "Varal dos Sonhos 💙";
  let mensagem = "";

  if (typeof dados === "string") {
    mensagem = dados; // permite uso direto de string
  } else {
    switch (tipo) {
      case "cadastro":
        assunto = "🎉 Cadastro confirmado no Varal dos Sonhos!";
        mensagem = `
Olá ${dados.nome || ""}, 💙

Seu cadastro foi realizado com sucesso!
Agora você já pode adotar uma cartinha e espalhar sonhos ✨

Acesse o site e veja as cartinhas disponíveis:
https://varaldossonhos.vercel.app
`;
        break;

      case "adocao":
        assunto = "💝 Adoção registrada com sucesso!";
        mensagem = `
Olá ${dados.nome || ""}, 💙

Sua adoção foi registrada com sucesso!
Cartinha(s): ${dados.cartinhas?.join(", ") || "não informadas"}
Ponto de coleta: ${dados.ponto_coleta || "não informado"}

Aguarde nossa confirmação de entrega do presente 🎁
`;
        break;

      case "status":
        assunto = "📦 Atualização da sua adoção";
        mensagem = `
Olá ${dados.nome || ""},

Status atualizado: ${dados.status || "em andamento"}  
Mensagem: ${dados.mensagem || "Seu presente está a caminho 💙"}

Obrigado por fazer parte do Varal dos Sonhos! 🌟
`;
        break;

      default:
        mensagem = typeof dados === "string" ? dados : "Olá! Obrigado por espalhar sonhos 💙";
    }
  }

  // ============================================================
  // ✨ Adiciona pontuação (se existir)
  // ============================================================
  if (pontuacao > 0) {
    mensagem += `\n\n✨ Você ganhou ${pontuacao} ponto${pontuacao > 1 ? "s" : ""}!`;
  }

  // ============================================================
  // 📦 Monta payload para o EmailJS
  // ============================================================
  const payload = {
    service_id: SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id: USER_ID,
    template_params: {
      to_email: destinatario,
      subject: assunto,
      message: mensagem,
    },
  };

  // ============================================================
  // 🚀 Envio via API EmailJS
  // ============================================================
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

    console.log(`✅ E-mail (${tipo}) enviado com sucesso para ${destinatario}`);
    return { status: "ok", mensagem: "E-mail enviado com sucesso via EmailJS." };

  } catch (erro) {
    console.error("❌ Erro no envio de e-mail:", erro);
    return { status: "erro", mensagem: "Falha ao enviar e-mail: " + erro.message };
  }
}

