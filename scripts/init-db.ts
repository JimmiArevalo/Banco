// Cargar variables de entorno ANTES de importar cualquier módulo que las use
require("dotenv").config();

import { ensureSchema } from "../netlify/functions/lib/db";

async function main() {
  try {
    console.log("Inicializando esquema de base de datos...");
    await ensureSchema();
    console.log("✅ Esquema creado exitosamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error);
    process.exit(1);
  }
}

main();

