import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import {
  asignarClavesDelPool,
  periodoDe,
} from "@/lib/club-gomez/claves-pool";
import { parseFechaNacimiento } from "@/lib/club-gomez/fecha-nacimiento";
import { enviarTicketCompra } from "@/lib/email";

/**
 * Activa membresía (WhatsApp / admin / Bold) + claves + correo.
 */
export async function activarMembresiaManual(
  supabaseAdmin,
  {
    planId,
    nombre,
    cedula,
    email,
    telefono,
    ciudad,
    fechaNacimiento = null,
    origen = "whatsapp",
    solicitudId = null,
    boldOrderId = null,
    boldTransactionId = null,
    montoCop = null,
  }
) {
  const plan = PLANES_MEMBRESIA[planId] || PLANES_MEMBRESIA.esencial;
  const emailNorm = String(email || "")
    .trim()
    .toLowerCase();
  const cedulaNorm = String(cedula || "").trim() || `sin-${Date.now().toString(36)}`;
  const dob = parseFechaNacimiento(fechaNacimiento);

  const origenDb =
    origen === "manual"
      ? "manual"
      : origen === "bold"
        ? "bold"
        : origen === "admin"
          ? "admin"
          : "whatsapp";

  let metodoPago =
    origenDb === "bold" ? "bold" : origenDb === "manual" ? "efectivo" : "otro";

  let { data: miembro } = await supabaseAdmin
    .from("miembros")
    .select("*")
    .ilike("email", emailNorm)
    .maybeSingle();

  if (!miembro) {
    const insertRow = {
      nombre: String(nombre || "").trim(),
      cedula: cedulaNorm,
      email: emailNorm,
      telefono: String(telefono || "").trim() || "0000000000",
      ciudad: ciudad || null,
      estado: "activo",
    };
    if (dob) insertRow.fecha_nacimiento = dob;

    const { data: created, error: createErr } = await supabaseAdmin
      .from("miembros")
      .insert(insertRow)
      .select("*")
      .single();
    if (createErr) throw new Error(createErr.message);
    miembro = created;
  } else {
    if (boldOrderId) {
      const { data: pagoExistente } = await supabaseAdmin
        .from("pagos")
        .select("id")
        .eq("wompi_reference", boldOrderId)
        .maybeSingle();
      if (pagoExistente) {
        return {
          miembro,
          membresia: null,
          plan,
          claves: [],
          emailOk: false,
          alreadyActive: true,
        };
      }
    }

    const updateRow = {
      nombre: String(nombre || miembro.nombre).trim(),
      telefono: String(telefono || miembro.telefono).trim(),
      ciudad: ciudad || miembro.ciudad,
      estado: "activo",
      updated_at: new Date().toISOString(),
    };
    if (dob && !miembro.fecha_nacimiento) {
      updateRow.fecha_nacimiento = dob;
    }

    const { data: updated, error: upErr } = await supabaseAdmin
      .from("miembros")
      .update(updateRow)
      .eq("id", miembro.id)
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);
    miembro = updated;
  }

  const inicia = new Date();
  const vence = new Date(inicia);
  vence.setDate(vence.getDate() + 30);

  let memRow = null;
  {
    const insertPayload = {
      miembro_id: miembro.id,
      plan_id: plan.id,
      estado: "activa",
      inicia_en: inicia.toISOString(),
      vence_en: vence.toISOString(),
      origen: origenDb,
    };
    let { data, error } = await supabaseAdmin
      .from("membresias")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error && origenDb === "bold") {
      insertPayload.origen = "whatsapp";
      ({ data, error } = await supabaseAdmin
        .from("membresias")
        .insert(insertPayload)
        .select("*")
        .single());
    }
    if (error) throw new Error(error.message);
    memRow = data;
  }

  const periodo = periodoDe(inicia);
  let numeros = [];
  let clavesErr = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    numeros = await asignarClavesDelPool(supabaseAdmin, {
      count: plan.claves,
      periodo,
    });
    const insertRes = await supabaseAdmin.from("claves").insert(
      numeros.map((numero) => ({
        membresia_id: memRow.id,
        numero,
        periodo,
      }))
    );
    clavesErr = insertRes.error;
    if (!clavesErr) break;
    const msg = String(clavesErr.message || "").toLowerCase();
    const isDup =
      clavesErr.code === "23505" ||
      msg.includes("duplicate") ||
      msg.includes("unique");
    if (!isDup) break;
  }
  if (clavesErr) throw new Error(clavesErr.message);

  const pagoPayload = {
    membresia_id: memRow.id,
    miembro_id: miembro.id,
    monto_cop: montoCop || plan.precio,
    estado: "aprobado",
    metodo: metodoPago,
    wompi_reference: boldOrderId || null,
    wompi_transaction_id: boldTransactionId || null,
    pagado_en: new Date().toISOString(),
    raw: boldOrderId
      ? { bold_order_id: boldOrderId, bold_transaction_id: boldTransactionId }
      : null,
  };

  let { error: pagoErr } = await supabaseAdmin.from("pagos").insert(pagoPayload);
  if (pagoErr && String(pagoErr.message || "").toLowerCase().includes("metodo")) {
    pagoPayload.metodo = "otro";
    ({ error: pagoErr } = await supabaseAdmin.from("pagos").insert(pagoPayload));
  }
  if (pagoErr) console.error("[activarMembresiaManual] pago:", pagoErr.message);

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
        total_pagado: montoCop || plan.precio,
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
    membresia: memRow,
    plan,
    claves: numeros,
    emailOk,
  };
}
