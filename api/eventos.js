// /api/eventos.js
import Airtable from "airtable";


const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


export default async function handler(req, res) {
  try {
    const records = await base("Eventos") // 🔹 use o nome exato da tabela no Airtable
      .select({
        filterByFormula: "OR({destaque_home}=TRUE(), {destaque}=TRUE())", // aceita ambos os campos
        sort: [{ field: "data_inicio", direction: "asc" }],
      })
      .all();


    const eventos = records.map((r) => ({
      id: r.id,
      nome: r.fields.nome_evento || r.fields.nome || "Evento sem nome",
      data_inicio: r.fields.data_inicio || "",
      descricao: r.fields.descricao || "",
      imagem: r.fields.imagem_evento?.[0]?.url || "/imagens/evento-padrao.jpg",
    }));


    res.status(200).json(eventos);
  } catch (erro) {
    console.error("❌ Erro ao buscar eventos:", erro.message);
    res.status(500).json({ erro: "Erro ao buscar eventos: " + erro.message });
  }
}
