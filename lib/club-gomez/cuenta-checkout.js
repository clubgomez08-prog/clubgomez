import { createAnonAuthClient, supabaseAdmin } from "@/lib/supabase";
import { cargarPerfilPorAuthUserId } from "@/lib/club-gomez/perfil-miembro";
import { parseFechaNacimiento } from "@/lib/club-gomez/fecha-nacimiento";

/**
 * Asegura Auth + fila en `miembros` antes de abrir Bold.
 * - Email nuevo → crea cuenta con la contraseña del formulario
 * - Email existente → valida contraseña (sign-in)
 * No envía correo de bienvenida (el de claves va al activar pago).
 */
export async function asegurarCuentaParaCheckout({
  nombre,
  email,
  telefono,
  ciudad,
  cedula,
  password,
  fechaNacimiento,
}) {
  const emailNorm = String(email || "")
    .trim()
    .toLowerCase();
  const nombreTrim = String(nombre || "").trim();
  const telefonoTrim = String(telefono || "").trim();
  const ciudadTrim = String(ciudad || "").trim() || null;
  const cedulaRaw = String(cedula || "").trim();
  const pass = String(password || "");
  const dob = parseFechaNacimiento(fechaNacimiento);

  if (!emailNorm || !emailNorm.includes("@")) {
    throw Object.assign(new Error("Escribe un email válido."), { status: 400 });
  }
  if (!pass || pass.length < 6) {
    throw Object.assign(
      new Error("La contraseña debe tener al menos 6 caracteres."),
      { status: 400 }
    );
  }
  if (!dob) {
    throw Object.assign(
      new Error(
        "Escribe una fecha de nacimiento válida (debes tener al menos 12 años)."
      ),
      { status: 400 }
    );
  }

  const { data: miembroExistente } = await supabaseAdmin
    .from("miembros")
    .select("id, auth_user_id, email")
    .ilike("email", emailNorm)
    .maybeSingle();

  const authClient = createAnonAuthClient();

  if (miembroExistente?.auth_user_id) {
    const { data: sessionData, error: loginErr } =
      await authClient.auth.signInWithPassword({
        email: emailNorm,
        password: pass,
      });

    if (loginErr || !sessionData?.session) {
      throw Object.assign(
        new Error(
          "Ese email ya tiene cuenta. Usa tu contraseña o inicia sesión."
        ),
        { status: 401 }
      );
    }

    const updateRow = {
      nombre: nombreTrim || undefined,
      telefono: telefonoTrim || undefined,
      ciudad: ciudadTrim,
      updated_at: new Date().toISOString(),
    };
    if (cedulaRaw) updateRow.cedula = cedulaRaw;
    if (dob) updateRow.fecha_nacimiento = dob;

    await supabaseAdmin
      .from("miembros")
      .update(updateRow)
      .eq("id", miembroExistente.id);

    const perfil = await cargarPerfilPorAuthUserId(
      supabaseAdmin,
      miembroExistente.auth_user_id
    );

    return {
      created: false,
      userId: miembroExistente.auth_user_id,
      session: sessionData.session,
      perfil,
    };
  }

  // También puede existir solo en Auth (sin fila miembros)
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: emailNorm,
      password: pass,
      email_confirm: true,
      user_metadata: {
        nombre: nombreTrim,
        telefono: telefonoTrim,
        ciudad: ciudadTrim,
        fecha_nacimiento: dob,
      },
    });

  if (authError) {
    const msg = String(authError.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      const { data: sessionData, error: loginErr } =
        await authClient.auth.signInWithPassword({
          email: emailNorm,
          password: pass,
        });
      if (loginErr || !sessionData?.session) {
        throw Object.assign(
          new Error(
            "Ese email ya tiene cuenta. Usa tu contraseña o inicia sesión."
          ),
          { status: 401 }
        );
      }
      const userId = sessionData.user.id;
      await upsertMiembroPendiente({
        userId,
        nombre: nombreTrim,
        email: emailNorm,
        telefono: telefonoTrim,
        ciudad: ciudadTrim,
        cedulaRaw,
        dob,
      });
      const perfil = await cargarPerfilPorAuthUserId(supabaseAdmin, userId);
      return {
        created: false,
        userId,
        session: sessionData.session,
        perfil,
      };
    }
    throw Object.assign(new Error(authError.message || "No se pudo crear la cuenta."), {
      status: 400,
    });
  }

  const userId = authData.user.id;
  try {
    await upsertMiembroPendiente({
      userId,
      nombre: nombreTrim,
      email: emailNorm,
      telefono: telefonoTrim,
      ciudad: ciudadTrim,
      cedulaRaw,
      dob,
    });
  } catch (err) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw err;
  }

  const { data: sessionData, error: sessionError } =
    await authClient.auth.signInWithPassword({
      email: emailNorm,
      password: pass,
    });

  const perfil =
    (await cargarPerfilPorAuthUserId(supabaseAdmin, userId)) ||
    perfilFallback({
      userId,
      nombre: nombreTrim,
      email: emailNorm,
      telefono: telefonoTrim,
      ciudad: ciudadTrim,
      dob,
    });

  return {
    created: true,
    userId,
    session: sessionError ? null : sessionData?.session || null,
    perfil,
  };
}

async function upsertMiembroPendiente({
  userId,
  nombre,
  email,
  telefono,
  ciudad,
  cedulaRaw,
  dob,
}) {
  const { data: byAuth } = await supabaseAdmin
    .from("miembros")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (byAuth) {
    const row = {
      nombre,
      telefono,
      ciudad,
      updated_at: new Date().toISOString(),
    };
    if (cedulaRaw) row.cedula = cedulaRaw;
    if (dob) row.fecha_nacimiento = dob;
    await supabaseAdmin.from("miembros").update(row).eq("id", byAuth.id);
    return;
  }

  const { data: byEmail } = await supabaseAdmin
    .from("miembros")
    .select("id, auth_user_id")
    .ilike("email", email)
    .maybeSingle();

  if (byEmail) {
    const row = {
      auth_user_id: byEmail.auth_user_id || userId,
      nombre,
      telefono,
      ciudad,
      updated_at: new Date().toISOString(),
    };
    if (cedulaRaw) row.cedula = cedulaRaw;
    if (dob) row.fecha_nacimiento = dob;
    await supabaseAdmin.from("miembros").update(row).eq("id", byEmail.id);
    return;
  }

  const cedula = cedulaRaw || `sin-${userId.slice(0, 8)}`;
  const { error } = await supabaseAdmin.from("miembros").insert({
    nombre,
    cedula,
    email,
    telefono,
    ciudad,
    fecha_nacimiento: dob,
    estado: "pendiente",
    auth_user_id: userId,
  });

  if (error) {
    if (error.code === "23505") {
      throw Object.assign(
        new Error("Ese email o cédula ya está registrado."),
        { status: 409 }
      );
    }
    throw Object.assign(new Error(error.message || "No se pudo guardar el perfil."), {
      status: 400,
    });
  }
}

function perfilFallback({ userId, nombre, email, telefono, ciudad, dob }) {
  return {
    id: userId,
    email,
    nombre,
    telefono,
    ciudad: ciudad || "Colombia",
    fechaNacimiento: dob,
    estado: "pendiente",
    sinMembresia: true,
    claves: [],
    clavesCount: 0,
    planNombre: "Sin plan",
    planTag: "Activa tu membresía al pagar.",
    precioLabel: "—",
    beneficios: [],
    descuentosUsados: 0,
  };
}
