/** Busca / actualiza miembro por email, cédula o teléfono (checkout y activación). */

function digitsOnly(s) {
  return String(s || "").replace(/\D/g, "");
}

function emailNorm(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function isPlaceholderEmail(email) {
  const e = emailNorm(email);
  if (!e || !e.includes("@")) return true;
  return e.startsWith("fisico.") || e.endsWith("@sin-email.clubgomez.co");
}

async function findByEmail(supabase, email) {
  const e = emailNorm(email);
  if (!e || isPlaceholderEmail(e)) return null;
  const { data } = await supabase
    .from("miembros")
    .select("*")
    .ilike("email", e)
    .maybeSingle();
  return data || null;
}

async function findByCedula(supabase, cedula) {
  const raw = String(cedula || "").trim();
  const digits = digitsOnly(cedula);
  const candidates = [...new Set([raw, digits].filter(Boolean))];
  for (const c of candidates) {
    const { data } = await supabase
      .from("miembros")
      .select("*")
      .eq("cedula", c)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

async function findByTelefono(supabase, telefono) {
  const raw = String(telefono || "").trim();
  const digits = digitsOnly(telefono);
  const last10 = digits.length >= 10 ? digits.slice(-10) : "";
  const candidates = [
    ...new Set(
      [raw, digits, last10, last10 ? `57${last10}` : "", last10 ? `+57${last10}` : ""].filter(
        Boolean
      )
    ),
  ];
  for (const t of candidates) {
    const { data } = await supabase
      .from("miembros")
      .select("*")
      .eq("telefono", t)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function buscarMiembroPorIdentidad(
  supabase,
  { email, cedula, telefono }
) {
  return (
    (await findByEmail(supabase, email)) ||
    (await findByCedula(supabase, cedula)) ||
    (await findByTelefono(supabase, telefono))
  );
}

/**
 * Guest checkout: no crea un segundo miembro si esa cédula/email/teléfono ya existe.
 */
export async function upsertMiembroParaPago(
  supabase,
  { nombre, email, telefono, ciudad, cedula, fechaNacimiento }
) {
  const emailClean = emailNorm(email);
  const cedulaClean = String(cedula || "").trim();
  let miembro = await buscarMiembroPorIdentidad(supabase, {
    email: emailClean,
    cedula: cedulaClean,
    telefono,
  });

  const contact = {
    nombre,
    telefono,
    ciudad,
    updated_at: new Date().toISOString(),
  };
  if (fechaNacimiento) contact.fecha_nacimiento = fechaNacimiento;

  if (miembro) {
    const patch = { ...contact };
    if (emailClean && isPlaceholderEmail(miembro.email)) {
      patch.email = emailClean;
    }
    if (cedulaClean && !String(miembro.cedula || "").trim()) {
      patch.cedula = cedulaClean;
    }
    const { error } = await supabase
      .from("miembros")
      .update(patch)
      .eq("id", miembro.id);
    if (error?.code === "23505") {
      await supabase
        .from("miembros")
        .update(contact)
        .eq("id", miembro.id);
    } else if (error) {
      throw error;
    }
    return miembro;
  }

  const insertRow = {
    nombre,
    email: emailClean,
    telefono,
    ciudad,
    cedula: cedulaClean,
    estado: "activo",
    ...(fechaNacimiento ? { fecha_nacimiento: fechaNacimiento } : {}),
  };

  const { data, error } = await supabase
    .from("miembros")
    .insert(insertRow)
    .select("*")
    .single();

  if (!error) return data;

  if (error.code === "23505") {
    const again = await buscarMiembroPorIdentidad(supabase, {
      email: emailClean,
      cedula: cedulaClean,
      telefono,
    });
    if (again) {
      await supabase.from("miembros").update(contact).eq("id", again.id);
      return again;
    }
  }

  throw error;
}

export function mensajeErrorMiembro(err) {
  const code = err?.code || "";
  const msg = String(err?.message || "").toLowerCase();
  if (code === "23505" || msg.includes("idx_miembros_cedula")) {
    return "Esa cédula ya está en el Club. Usa el mismo correo de siempre o inicia sesión y paga.";
  }
  if (msg.includes("idx_miembros_email")) {
    return "Ese email ya está en el Club. Inicia sesión o usa el correo con el que te registraste.";
  }
  if (
    msg.includes("idx_") ||
    msg.includes("duplicate") ||
    msg.includes("unique constraint") ||
    msg.includes("violates")
  ) {
    return "Esos datos ya están en el Club. Usa el mismo correo o inicia sesión y paga.";
  }
  return err?.message || "No se pudieron guardar tus datos.";
}
