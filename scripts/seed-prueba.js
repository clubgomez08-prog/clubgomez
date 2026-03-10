/**
 * Seed de datos de prueba en Supabase.
 * Ejecutar UNA sola vez: node scripts/seed-prueba.js
 *
 * Requiere .env.local con:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const path = require("path");
const fs = require("fs");

// Cargar .env.local (Next.js)
const envPaths = [".env.local", ".env"];
for (const envFile of envPaths) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8")
      .split("\n")
      .forEach((line) => {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) {
          process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
        }
      });
    break;
  }
}

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedPrueba() {
  try {
    // 1. Obtener rifas activas existentes
    const { data: rifas } = await supabaseAdmin
      .from("rifas")
      .select("id, nombre, precio_boleto")
      .eq("estado", "activa");

    if (!rifas || rifas.length === 0) {
      console.log("No hay rifas activas");
      return;
    }

    console.log("Rifas encontradas:", rifas.map((r) => r.nombre).join(", "));

    // 2. Insertar participante de prueba
    const { data: participante1, error: err1 } = await supabaseAdmin
      .from("participantes")
      .insert({
        nombre: "Cristian Torres (PRUEBA)",
        cedula: "1029141732",
        email: "cristiantorres29052005@gmail.com",
        telefono: "3000000000",
        ciudad: "Cúcuta",
        cantidad_boletos: 5,
        total_pagado: rifas[0].precio_boleto * 5,
        rifa_id: rifas[0].id,
        estado_pago: "aprobado",
      })
      .select()
      .single();

    if (err1) throw new Error("Error insertando participante 1: " + err1.message);
    console.log("✅ Participante insertado:", participante1.id);

    // 3. Insertar boletos para la primera rifa (formato: serie-numero)
    const boletos1 = ["0042-00", "0187-00", "0391-00", "0654-00", "0923-00"].map(
      (num) => ({
        participante_id: participante1.id,
        rifa_id: rifas[0].id,
        numero: num,
      })
    );

    const { error: err2 } = await supabaseAdmin.from("boletos").insert(boletos1);

    if (err2) throw new Error("Error insertando boletos 1: " + err2.message);
    console.log("✅ Boletos rifa 1 insertados");

    // 4. Si hay segunda rifa, insertar también ahí
    if (rifas.length > 1) {
      const { data: participante2, error: err3 } = await supabaseAdmin
        .from("participantes")
        .insert({
          nombre: "Cristian Torres (PRUEBA)",
          cedula: "1029141732",
          email: "cristiantorres29052005@gmail.com",
          telefono: "3000000000",
          ciudad: "Cúcuta",
          cantidad_boletos: 3,
          total_pagado: rifas[1].precio_boleto * 3,
          rifa_id: rifas[1].id,
          estado_pago: "aprobado",
        })
        .select()
        .single();

      if (err3)
        throw new Error("Error insertando participante 2: " + err3.message);

      const boletos2 = ["0015-00", "0278-00", "0502-00"].map((num) => ({
        participante_id: participante2.id,
        rifa_id: rifas[1].id,
        numero: num,
      }));

      const { error: err4 } = await supabaseAdmin.from("boletos").insert(boletos2);

      if (err4) throw new Error("Error insertando boletos 2: " + err4.message);
      console.log("✅ Boletos rifa 2 insertados");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Datos de prueba insertados correctamente");
    console.log("Cédula: 1029141732");
    console.log("Email: cristiantorres29052005@gmail.com");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

seedPrueba();
