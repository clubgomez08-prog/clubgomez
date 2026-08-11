import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { hoyEnBogota } from "@/lib/club-gomez/fecha-nacimiento";
import { enviarFelicitacionCumpleanos } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
}

function authOk(request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Sin secreto: solo permitir en desarrollo local
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization") || "";
  const bearer = header.replace(/^Bearer\s+/i, "").trim();
  const q = new URL(request.url).searchParams.get("secret") || "";
  return bearer === secret || q === secret;
}

/**
 * Envía felicitaciones a miembros cuyo cumpleaños es hoy (America/Bogota).
 * Vercel Cron: GET/POST diario. Header Authorization: Bearer CRON_SECRET
 */
export async function GET(request) {
  return run(request);
}

export async function POST(request) {
  return run(request);
}

async function run(request) {
  try {
    if (!authOk(request)) return unauthorized();
    if (supabaseMissingEnv) {
      return NextResponse.json({ ok: false, error: "Supabase no configurado" }, { status: 503 });
    }

    const { year, month, day } = hoyEnBogota();
    const md = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Traer candidatos (filtro fino en JS por mes/día; volumen de miembros es manejable)
    const { data: miembros, error } = await supabaseAdmin
      .from("miembros")
      .select("id, nombre, email, fecha_nacimiento, cumpleanos_email_anio, estado")
      .not("fecha_nacimiento", "is", null)
      .neq("estado", "cancelado");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const hoy = (miembros || []).filter((m) => {
      const fn = String(m.fecha_nacimiento || "");
      // YYYY-MM-DD
      if (fn.length < 10) return false;
      const mm = fn.slice(5, 7);
      const dd = fn.slice(8, 10);
      if (`${mm}-${dd}` !== md) return false;
      if (Number(m.cumpleanos_email_anio) === year) return false;
      return Boolean(m.email);
    });

    let enviados = 0;
    const fallos = [];

    for (const m of hoy) {
      try {
        await enviarFelicitacionCumpleanos({
          nombre: m.nombre,
          email: m.email,
        });
        await supabaseAdmin
          .from("miembros")
          .update({
            cumpleanos_email_anio: year,
            updated_at: new Date().toISOString(),
          })
          .eq("id", m.id);
        enviados += 1;
      } catch (err) {
        fallos.push({ id: m.id, email: m.email, error: err?.message || "error" });
      }
    }

    return NextResponse.json({
      ok: true,
      fechaBogota: `${year}-${md}`,
      candidatos: hoy.length,
      enviados,
      fallos,
    });
  } catch (err) {
    console.error("[cron/cumpleanos]", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error en cron" },
      { status: 500 }
    );
  }
}
