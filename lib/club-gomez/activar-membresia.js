import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import {
  asignarClavesDelPool,
  canalClaveDeOrigen,
  periodoDe,
  validarClavesFisicas,
} from "@/lib/club-gomez/claves-pool";
import { parseFechaNacimiento } from "@/lib/club-gomez/fecha-nacimiento";
import { enviarTicketCompra } from "@/lib/email";

export function esEmailPlaceholder(email) {
  const e = String(email || "")
    .trim()
    .toLowerCase();
  if (!e || !e.includes("@")) return true;
  return (
    e.startsWith("fisico.") || e.endsWith("@sin-email.clubgomez.co")
  );
}

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
    clavesManuales = null,
  }
) {
  const plan = PLANES_MEMBRESIA[planId] || PLANES_MEMBRESIA.esencial;
  const telefonoNorm = String(telefono || "").trim();
  const emailRaw = String(email || "")
    .trim()
    .toLowerCase();
  const emailNorm = esEmailPlaceholder(emailRaw)
    ? `fisico.${(telefonoNorm.replace(/\D/g, "") || Date.now().toString(36)).slice(0, 16)}@sin-email.clubgomez.co`
    : emailRaw;
  const cedulaNorm = String(cedula || "").trim() || null;
  const dob = parseFechaNacimiento(fechaNacimiento);

  const origenDb =
    origen === "manual" || origen === "fisico"
      ? "manual"
      : origen === "bold"
        ? "bold"
        : origen === "admin"
          ? "admin"
          : "whatsapp";

  let metodoPago =
    origenDb === "bold" ? "bold" : origenDb === "manual" ? "efectivo" : "otro";

  let miembro = null;
  if (!esEmailPlaceholder(emailNorm)) {
    const { data } = await supabaseAdmin
      .from("miembros")
      .select("*")
      .ilike("email", emailNorm)
      .maybeSingle();
    miembro = data;
  }
  if (!miembro && telefonoNorm) {
    const { data } = await supabaseAdmin
      .from("miembros")
      .select("*")
      .eq("telefono", telefonoNorm)
      .maybeSingle();
    miembro = data;
  }

  if (!miembro) {
    const insertRow = {
      nombre: String(nombre || "").trim(),
      email: emailNorm,
      telefono: telefonoNorm || "0000000000",
      ciudad: ciudad || null,
      estado: "activo",
      cedula: cedulaNorm || `fis-${Date.now().toString(36)}`,
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
      telefono: telefonoNorm || miembro.telefono,
      ciudad: ciudad || miembro.ciudad,
      estado: "activo",
      updated_at: new Date().toISOString(),
    };
    if (cedulaNorm && !miembro.cedula) updateRow.cedula = cedulaNorm;
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
  const canal = canalClaveDeOrigen(origenDb);

  if (Array.isArray(clavesManuales) && clavesManuales.length) {
    numeros = await validarClavesFisicas(supabaseAdmin, {
      numeros: clavesManuales,
      periodo,
      countEsperado: plan.claves,
    });
    const insertRes = await supabaseAdmin.from("claves").insert(
      numeros.map((numero) => ({
        membresia_id: memRow.id,
        numero,
        periodo,
      }))
    );
    if (insertRes.error) throw new Error(insertRes.error.message);
  } else {
    for (let attempt = 0; attempt < 4; attempt++) {
      numeros = await asignarClavesDelPool(supabaseAdmin, {
        count: plan.claves,
        periodo,
        canal,
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
  }

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
  const emailDestino = miembro.email;
  if (!esEmailPlaceholder(emailDestino)) {
    try {
      await enviarTicketCompra(
        {
          id: miembro.id,
          nombre: miembro.nombre,
          email: emailDestino,
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
  }

  return {
    miembro,
    membresia: memRow,
    plan,
    claves: numeros,
    emailOk,
  };
}
