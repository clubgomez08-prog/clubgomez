import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import { enviarTicketCompra } from "@/lib/email";

function genClaves(count) {
  const set = new Set();
  while (set.size < count) {
    set.add(String(Math.floor(Math.random() * 9000) + 1000));
  }
  return [...set];
}

/**
 * Activa membresía manual (WhatsApp / admin) + claves + correo.
 */
export async function activarMembresiaManual(supabaseAdmin, {
  planId,
  nombre,
  cedula,
  email,
  telefono,
  ciudad,
  origen = "whatsapp",
  solicitudId = null,
}) {
  const plan = PLANES_MEMBRESIA[planId] || PLANES_MEMBRESIA.esencial;
  const emailNorm = String(email || "")
    .trim()
    .toLowerCase();
  const cedulaNorm = String(cedula || "").trim() || `sin-${Date.now().toString(36)}`;

  let { data: miembro } = await supabaseAdmin
    .from("miembros")
    .select("*")
    .ilike("email", emailNorm)
    .maybeSingle();

  if (!miembro) {
    const { data: created, error: createErr } = await supabaseAdmin
      .from("miembros")
      .insert({
        nombre: String(nombre || "").trim(),
        cedula: cedulaNorm,
        email: emailNorm,
        telefono: String(telefono || "").trim() || "0000000000",
        ciudad: ciudad || null,
        estado: "activo",
      })
      .select("*")
      .single();
    if (createErr) throw new Error(createErr.message);
    miembro = created;
  } else {
    const { data: updated, error: upErr } = await supabaseAdmin
      .from("miembros")
      .update({
        nombre: String(nombre || miembro.nombre).trim(),
        telefono: String(telefono || miembro.telefono).trim(),
        ciudad: ciudad || miembro.ciudad,
        estado: "activo",
        updated_at: new Date().toISOString(),
      })
      .eq("id", miembro.id)
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);
    miembro = updated;
  }

  const inicia = new Date();
  const vence = new Date(inicia);
  vence.setDate(vence.getDate() + 30);

  const { data: membresia, error: memErr } = await supabaseAdmin
    .from("membresias")
    .insert({
      miembro_id: miembro.id,
      plan_id: plan.id,
      estado: "activa",
      inicia_en: inicia.toISOString(),
      vence_en: vence.toISOString(),
      origen: origen === "manual" ? "manual" : "whatsapp",
    })
    .select("*")
    .single();

  if (memErr) throw new Error(memErr.message);

  const numeros = genClaves(plan.claves);
  const periodo = inicia.toISOString().slice(0, 7);
  const { error: clavesErr } = await supabaseAdmin.from("claves").insert(
    numeros.map((numero) => ({
      membresia_id: membresia.id,
      numero,
      periodo,
    }))
  );
  if (clavesErr) throw new Error(clavesErr.message);

  await supabaseAdmin.from("pagos").insert({
    membresia_id: membresia.id,
    miembro_id: miembro.id,
    monto_cop: plan.precio,
    estado: "aprobado",
    metodo: origen === "manual" ? "efectivo" : "otro",
    pagado_en: new Date().toISOString(),
  });

  if (solicitudId) {
    await supabaseAdmin
      .from("solicitudes_membresia")
      .update({ estado: "convertida" })
      .eq("id", solicitudId);
  }

  let emailOk = false;
  try {
    await enviarTicketCompra(
      {
        id: miembro.id,
        nombre: miembro.nombre,
        email: miembro.email,
        cantidad_boletos: numeros.length,
        total_pagado: plan.precio,
      },
      { nombre: `Plan ${plan.nombre}` },
      numeros,
      { useParticipantEmail: true }
    );
    emailOk = true;
  } catch (err) {
    console.error("[activarMembresiaManual] email:", err?.message || err);
  }

  return {
    miembro,
    membresia,
    plan,
    claves: numeros,
    emailOk,
  };
}
