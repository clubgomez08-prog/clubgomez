import { NextResponse } from "next/server";
import { createAnonAuthClient, supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { cargarPerfilPorAuthUserId } from "@/lib/club-gomez/perfil-miembro";
import {
  DEMO_MIEMBRO_CREDS,
  crearDemoMiembro,
} from "@/lib/club-gomez/demo-miembro";

function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) return bad("Completa email y contraseña.");

    // Demo local solo en desarrollo
    if (
      email === DEMO_MIEMBRO_CREDS.email &&
      password === DEMO_MIEMBRO_CREDS.password &&
      process.env.NODE_ENV !== "production"
    ) {
      return NextResponse.json({
        ok: true,
        perfil: crearDemoMiembro(email),
        session: null,
        demo: true,
      });
    }

    if (supabaseMissingEnv) {
      return bad("Supabase no está configurado en el servidor.", 503);
    }

    const authClient = createAnonAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return bad("Email o contraseña incorrectos.", 401);
    }

    let perfil = await cargarPerfilPorAuthUserId(supabaseAdmin, data.user.id);

    // Si Auth existe pero falta fila en miembros (edge), crearla mínima
    if (!perfil) {
      const meta = data.user.user_metadata || {};
      const { data: created, error: createErr } = await supabaseAdmin
        .from("miembros")
        .insert({
          nombre: meta.nombre || email.split("@")[0],
          cedula: `sin-${data.user.id.slice(0, 8)}`,
          email,
          telefono: meta.telefono || "0000000000",
          ciudad: meta.ciudad || null,
          estado: "pendiente",
          auth_user_id: data.user.id,
        })
        .select("*")
        .single();

      if (createErr) {
        console.error("[miembro/login] backfill:", createErr);
        return bad("Cuenta Auth ok, pero falta perfil de miembro. Contacta soporte.", 500);
      }

      perfil = await cargarPerfilPorAuthUserId(supabaseAdmin, data.user.id);
      if (!perfil && created) {
        perfil = {
          id: created.id,
          email: created.email,
          nombre: created.nombre,
          telefono: created.telefono,
          ciudad: created.ciudad || "Colombia",
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
      }
    }

    return NextResponse.json({
      ok: true,
      perfil,
      session: data.session,
    });
  } catch (err) {
    console.error("[miembro/login]", err);
    return bad(err.message || "Error inesperado al iniciar sesión.", 500);
  }
}
