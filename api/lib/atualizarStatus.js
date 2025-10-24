// ============================================================
// 💙 VARAL DOS SONHOS — /api/lib/atualizarStatus.js
// Atualiza automaticamente a mensagem conforme o status da doação
// ============================================================

import Airtable from "airtable";
import dotenv from "dotenv";
dotenv.config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function atualizarMensagemDoacao(recordId, status) {
  try {
    let mensagem = "";
    const dataHoje = new Date().toLocaleDateString("pt-BR");

    switch (status) {
      case "aguardando_entrega":
        mensagem = "🎁 Sua cartinha foi adotada! Aguarde confirmação para a compra do presente.";
        break;
      case "confirmada":
        mensagem = `💙 Adoção confirmada em ${dataHoje}`;
        break;
      case "entregue":
        mensagem = "💖 Presente entregue à criança com sucesso! Obrigado por espalhar sonhos.";
        break;
      default:
        mensagem = "Status desconhecido. Entre em contato com o suporte.";
    }

    await base("doacoes").update([
      {
        id: recordId,
        fields: { mensagem_confirmacao: mensagem },
      },
    ]);

    console.log(`✅ Mensagem atualizada para "${status}" no registro ${recordId}`);
    return true;
  } catch (erro) {
    console.error("❌ Erro ao atualizar mensagem:", erro);
    return false;
  }
}
