// ============================================================
// 💙 VARAL DOS SONHOS — /api/lib/atualizarStatus.js
// Atualiza mensagem e envia notificação por e-mail ao mudar status
// ============================================================


import Airtable from "airtable";
import dotenv from "dotenv";
import enviarEmail from "./enviarEmail.js"; // ✅ integração com o Gmail OAuth
dotenv.config();


const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


export default async function atualizarMensagemDoacao(recordId, status) {
  try {
    let mensagem = "";
    const dataHoje = new Date().toLocaleDateString("pt-BR");


    // 🧩 Define a mensagem conforme o status
    switch (status) {
      case "aguardando_entrega":
        mensagem = "🎁 Sua cartinha foi adotada! Aguarde confirmação para a compra do presente.";
        break;
      case "confirmada":
        mensagem = `💙 Adoção confirmada em ${dataHoje}. Obrigado por espalhar sonhos!`;
        break;
      case "entregue":
        mensagem = "💖 Presente entregue à criança com sucesso! Obrigado por fazer parte do Varal dos Sonhos!";
        break;
      default:
        mensagem = "⚠️ Status desconhecido. Entre em contato com o suporte.";
    }


    // 🗂️ Atualiza a mensagem no Airtable
    const updated = await base("doacoes").update([
      {
        id: recordId,
        fields: { mensagem_confirmacao: mensagem },
      },
    ]);


    console.log(`✅ Mensagem atualizada para "${status}" no registro ${recordId}`);


    // ✉️ Envia e-mail automático para o doador
    const registro = await base("doacoes").find(recordId);
    const emailDoador = registro.fields.doador_email || registro.fields.doador || null;


    if (emailDoador) {
      await enviarEmail(
        emailDoador,
        "Atualização da sua adoção 💙",
        mensagem
      );
    }


    // 📬 Notifica também a ONG
    await enviarEmail(
      "varaldossonhossp@gmail.com",
      `📦 Atualização de doação (${status})`,
      `O status da doação ${recordId} foi alterado para "${status}".`
    );


    return true;


  } catch (erro) {
    console.error("❌ Erro ao atualizar mensagem:", erro);
    return false;
  }
}
