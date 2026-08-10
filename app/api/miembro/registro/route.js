import { NextResponse } from "next/server";
import { supabase, supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { cargarPerfilPorAuthUserId } from "@/lib/club-gomez/perfil-miembro";
import { enviarBienvenidaRegistro } from "@/lib/email";

function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

async function tryEnviarBienvenida({ nombre, email }) {
  try {
    await enviarBienvenidaRegistro({ nombre, email });
    return true;
  } catch (err) {
    console.error("[miembro/registro] email bienvenida:", err?.message || err);
    return false;
  }
}

export async function POST(request) {
  try {
    if (supabaseMissingEnv) {
      return bad("Supabase no está configurado en el servidor.", 503);
    }

    const body = await request.json();
    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const telefono = String(body.telefono || "").trim();
    const ciudad = String(body.ciudad || "").trim() || null;
    const cedulaRaw = String(body.cedula || "").trim();
    const password = String(body.password || "");

    if (!nombre) return bad("Escribe tu nombre completo.");
    if (!email || !email.includes("@")) return bad("Escribe un email válido.");
    if (!telefono) return bad("Escribe tu WhatsApp.");
    if (!password || password.length < 6) {
      return bad("La contraseña debe tener al menos 6 caracteres.");
    }

    const { data: existingEmail } = await supabaseAdmin
      .from("miembros")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (existingEmail) {
      return bad("Ese email ya tiene cuenta. Inicia sesión.", 409);
    }

    if (cedulaRaw) {
      const { data: existingCedula } = await supabaseAdmin
        .from("miembros")
        .select("id")
        .eq("cedula", cedulaRaw)
        .maybeSingle();
      if (existingCedula) {
        return bad("Esa cédula ya está registrada.", 409);
      }
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre, telefono, ciudad },
      });

    if (authError) {
      const msg = String(authError.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        return bad("Ese email ya tiene cuenta. Inicia sesión.", 409);
      }
      console.error("[miembro/registro] auth:", authError);
      return bad(authError.message || "No se pudo crear la cuenta.", 400);
    }

    const userId = authData.user.id;
    const cedula = cedulaRaw || `sin-${userId.slice(0, 8)}`;

    const { data: miembro, error: miembroError } = await supabaseAdmin
      .from("miembros")
      .insert({
        nombre,
        cedula,
        email,
        telefono,
        ciudad,
        estado: "pendiente",
        auth_user_id: userId,
      })
      .select("*")
      .single();

    if (miembroError) {
      console.error("[miembro/registro] miembros:", miembroError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      if (miembroError.code === "23505") {
        return bad("Ese email o cédula ya está registrado.", 409);
      }
      return bad(miembroError.message || "No se pudo guardar el perfil.", 400);
    }

    const emailEnviado = await tryEnviarBienvenida({ nombre, email });

    const { data: sessionData, error: sessionError } =
      await supabase.auth.signInWithPassword({ email, password });

    const perfilFallback = {
      id: miembro.id,
      email,
      nombre,
      telefono,
      ciudad: ciudad || "Colombia",
      estado: "pendiente",
      sinMembresia: true,
      claves: [],
      clavesCount: 0,
      planNombre: "Sin plan",
      planTag: "Activa tu membresía cuando quieras.",
      precioLabel: "—",
      beneficios: [],
      descuentosUsados: 0,
    };

    if (sessionError) {
      console.error("[miembro/registro] session:", sessionError);
      return NextResponse.json({
        ok: true,
        perfil:
          (await cargarPerfilPorAuthUserId(supabaseAdmin, userId)) ||
          perfilFallback,
        session: null,
        emailEnviado,
        aviso: "Cuenta creada. Inicia sesión para continuar.",
      });
    }

    const perfil = await cargarPerfilPorAuthUserId(supabaseAdmin, userId);

    return NextResponse.json({
      ok: true,
      perfil: perfil || perfilFallback,
      session: sessionData.session,
      emailEnviado,
    });
  } catch (err) {
    console.error("[miembro/registro]", err);
    return bad(err.message || "Error inesperado al registrarse.", 500);
  }
}
