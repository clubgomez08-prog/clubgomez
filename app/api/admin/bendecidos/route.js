import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { registrarActividad } from "@/lib/admin-actividad";
import {
  duenoDelNumero,
  esSorteoConBendecidos,
  formatearBendecido,
  guardarBendecido,
  listarBendecidosConDueno,
  NUMEROS_BENDECIDOS,
  PREMIO,
} from "@/lib/club-gomez/bendecidos";

export const dynamic = "force-dynamic";

function bad(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function sorteoDe(id) {
  const { data, error } = await supabaseAdmin
    .from("sorteos_rifa")
    .select("id, slug, nombre, premio")
    .eq("id", id)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Sorteo no encontrado" };
  if (!esSorteoConBendecidos(data)) {
    return { error: "Los números bendecidos son solo de este sorteo de las 3 motos." };
  }
  return { sorteo: data };
}

export async function GET(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const params = new URL(request.url).searchParams;
    const { sorteo, error } = await sorteoDe(params.get("sorteo") || "");
    if (error) return bad(error, error === "Sorteo no encontrado" ? 404 : 400);

    const lista = await listarBendecidosConDueno(supabaseAdmin, sorteo.id);
    if (lista.error) return bad(lista.error);

    const crudo = String(params.get("numero") || "").replace(/\D/g, "");
    let busqueda = null;
    if (crudo) {
      const numero = formatearBendecido(crudo);
      const hallado = await duenoDelNumero(supabaseAdmin, sorteo.id, numero);
      if (hallado.error) return bad(hallado.error);
      const bendecido = NUMEROS_BENDECIDOS.includes(numero);
      const item = lista.items.find((i) => i.numero === numero) || null;
      busqueda = {
        numero,
        bendecido,
        activo: item ? item.activo : null,
        premio: bendecido ? PREMIO : null,
        ganadorMillon: Boolean(bendecido && hallado.dueno),
        dueno: hallado.dueno,
      };
    }

    return NextResponse.json({
      ok: true,
      premio: PREMIO,
      items: lista.items,
      busqueda,
    });
  } catch (err) {
    console.error("[admin/bendecidos]", err);
    return bad(err.message || "Error", 500);
  }
}

export async function POST(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const body = await request.json().catch(() => ({}));
    const { sorteo, error } = await sorteoDe(body.sorteoId);
    if (error) return bad(error, 400);

    const numero = formatearBendecido(body.numero);
    if (!NUMEROS_BENDECIDOS.includes(numero)) {
      return bad("Ese número no está en la lista de bendecidos.");
    }
    const activo = Boolean(body.activo);
    const guardado = await guardarBendecido(supabaseAdmin, user, sorteo.id, numero, activo);
    if (guardado.error) return bad(guardado.error);

    const hallado = await duenoDelNumero(supabaseAdmin, sorteo.id, numero);
    if (hallado.error) return bad(hallado.error);

    await registrarActividad(
      supabaseAdmin,
      user,
      activo ? "bendecido_activado" : "bendecido_desactivado",
      {
        sorteo: sorteo.premio || sorteo.nombre,
        numero,
        estado: activo ? "activo" : "apagado",
        persona: hallado.dueno?.nombre || "nadie lo tiene comprado",
      }
    );

    return NextResponse.json({
      ok: true,
      numero,
      activo,
      dueno: hallado.dueno,
      ganadorMillon: Boolean(hallado.dueno),
      premio: PREMIO,
    });
  } catch (err) {
    console.error("[admin/bendecidos]", err);
    return bad(err.message || "Error", 500);
  }
}
