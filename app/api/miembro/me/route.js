import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { cargarPerfilPorAuthUserId } from "@/lib/club-gomez/perfil-miembro";

export async function GET(request) {
  try {
    if (supabaseMissingEnv) {
      return NextResponse.json(
        { ok: false, error: "Supabase no está configurado." },
        { status: 503 }
      );
    }

    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "No autenticado." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { ok: false, error: "Sesión inválida o expirada." },
        { status: 401 }
      );
    }

    const perfil = await cargarPerfilPorAuthUserId(supabaseAdmin, user.id);
    if (!perfil) {
      return NextResponse.json(
        { ok: false, error: "No encontramos tu perfil de miembro." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, perfil });
  } catch (err) {
    console.error("[miembro/me]", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error inesperado." },
      { status: 500 }
    );
  }
}
