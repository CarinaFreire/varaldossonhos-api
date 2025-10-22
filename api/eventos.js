// /api/eventos.js
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    const records = await base("eventos")
      .select({
        filterByFormula: "IF({destaque_home}=TRUE(), TRUE(), FALSE())",
        sort: [{ field: "data_inicio", direction: "asc" }],
      })
      .all();

    const eventos = records.map((r) => ({
      id: r.id,
      nome: r.fields.nome_evento || "Evento sem nome",
      data_inicio: r.fields.data_inicio || "",
      descricao: r.fields.descricao || "",
      imagem: r.fields.imagem_evento?.[0]?.url || "/imagens/evento-padrao.jpg",
    }));

    res.status(200).json(eventos);
  } catch (erro) {
    console.error("Erro ao buscar eventos:", erro);
    res.status(500).json({ erro: erro.message });
  }
}
