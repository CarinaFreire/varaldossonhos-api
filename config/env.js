// ============================================================
// ⚙️ VARAL DOS SONHOS — config/env.js
// Carrega variáveis de ambiente (.env.local) e mapeia tabelas do Airtable
// ============================================================

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis do arquivo .env.local
dotenv.config({ path: path.resolve(__dirname, "../config/.env.local") });

// Exporta as configurações globais
export const ENV = {
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
  AIRTABLE_TABLES: {
    usuarios: "usuario",               // ✅ Nome igual ao do Airtable
    administradores: "administrador_geral",
    voluntarios: "voluntario",
    doadores: "doador",
    pontos: "pontosdecoleta",
    cartinhas: "cartinhas",
    doacoes: "doacoes",
    eventos: "eventos",
    gamificacao: "gamificacao",
    ia_assistente: "ia_assistente",
    newsletter: "Newsletter",
    cloudinho_kb: "cloudinho_kb" // 🧠 Base de conhecimento do Cloudinho
  },
  NOTIFY_EMAIL_API: process.env.NOTIFY_EMAIL_API,
  NOTIFY_WHATSAPP_API: process.env.NOTIFY_WHATSAPP_API,
};