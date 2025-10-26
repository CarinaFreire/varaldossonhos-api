// ============================================================
// 💙 VARAL DOS SONHOS — Atualização de status e envio de e-mail
// ============================================================


import Airtable from "airtable";
import enviarEmail from "./enviarEmail.js";
import dotenv from "dotenv";
dotenv.config();


const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


export default async function atualizarMensagemDoacao(recordId, status, emailDoador) {
  try {
    let mensagem = "";
    const dataHoje = new Date().toLocaleDateString("pt-BR");


    // 📝 Define mensagem de acordo com o status
    switch (status) {
      case "aguardando_entrega":
        mensagem = "🎁 Sua cartinha foi adotada! Aguarde confirmação para a compra do presente.";
        break;
      case "confirmada":
        mensagem = `💙 Adoção confirmada em ${dataHoje}! Obrigado por espalhar sonhos.`;
        break;
      case "entregue":
        mensagem = "💖 Presente entregue à criança com sucesso! Obrigado por fazer parte desse sonho!";
        break;
      default:
        mensagem = "Status desconhecido. Entre em contato com o suporte.";
    }


    // 🗂️ Atualiza campo no Airtable
    await base("doacoes").update([
      {
        id: recordId,
        fields: { mensagem_confirmacao: mensagem },
      },
    ]);


    console.log(`✅ Mensagem atualizada (${status}) no registro ${recordId}`);


    // 💌 Envia e-mail ao doador e à ONG
    await enviarEmail(
      emailDoador,
      "Atualização da sua adoção 💙",
      mensagem
    );


    console.log(`📧 E-mail de atualização enviado para ${emailDoador}`);


    return true;
  } catch (erro) {
    console.error("❌ Erro ao atualizar mensagem e enviar e-mail:", erro);
    return false;
  }
}

