import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { formatearNumero } from "@/lib/club-gomez/claves-pool";
import { registrarActividad } from "@/lib/admin-actividad";
import {
  DIAS_ANTICIPADOS,
  duenoDelNumero,
  esSorteoConAnticipados,
  fechaDeAnticipado,
  guardarAnticipado,
  leerAnticipados,
} from "@/lib/club-gomez/anticipados";

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
  if (!esSorteoConAnticipados(data)) {
    return { error: "Los premios de los sábados son solo de este sorteo de las 3 motos." };
  }
  return { sorteo: data };
}

async function armarDias(sorteoId, dias) {
  const salida = [];
  for (const dia of DIAS_ANTICIPADOS) {
    const numero = dias[dia.fecha] || "";
    let dueno = null;
    if (numero) {
      const hallado = await duenoDelNumero(supabaseAdmin, sorteoId, numero);
      if (hallado.error) return { error: hallado.error };
      dueno = hallado.dueno;
    }
    salida.push({ ...dia, numero, dueno, premio: "$500.000" });
  }
  return { dias: salida };
}

export async function GET(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const params = new URL(request.url).searchParams;
    const sorteoId = params.get("sorteo") || "";
    const { sorteo, error } = await sorteoDe(sorteoId);
    if (error) return bad(error, error === "Sorteo no encontrado" ? 404 : 400);

    const estado = await leerAnticipados(supabaseAdmin, sorteo.id);
    if (estado.error) return bad(estado.error.message || "No se pudieron leer los sábados");
    const armado = await armarDias(sorteo.id, estado.dias);
    if (armado.error) return bad(armado.error);

    const crudo = String(params.get("numero") || "").replace(/\D/g, "");
    let busqueda = null;
    if (crudo) {
      const numero = formatearNumero(crudo, 4);
      const hallado = await duenoDelNumero(supabaseAdmin, sorteo.id, numero);
      if (hallado.error) return bad(hallado.error);
      busqueda = {
        numero,
        dueno: hallado.dueno,
        dias: armado.dias.filter((d) => d.numero === numero).map((d) => d.etiqueta),
      };
    }

    return NextResponse.json({ ok: true, dias: armado.dias, busqueda });
  } catch (err) {
    console.error("[admin/anticipados]", err);
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

    const dia = fechaDeAnticipado(String(body.fecha || ""));
    if (!dia) return bad("Ese día no es uno de los sábados de $500.000.");

    const crudo = String(body.numero ?? "").replace(/\D/g, "");
    const numero = crudo ? formatearNumero(crudo, 4) : "";
    const guardado = await guardarAnticipado(supabaseAdmin, user, sorteo.id, dia.fecha, numero);
    if (guardado.error) return bad(guardado.error);

    const dueno = numero ? await duenoDelNumero(supabaseAdmin, sorteo.id, numero) : { dueno: null };
    if (dueno.error) return bad(dueno.error);

    await registrarActividad(supabaseAdmin, user, numero ? "anticipado_anotado" : "anticipado_borrado", {
      sorteo: sorteo.premio || sorteo.nombre,
      fecha: dia.etiqueta,
      numero: numero || "sin número",
      persona: dueno.dueno?.nombre || "nadie lo tiene comprado",
    });

    const repetido = DIAS_ANTICIPADOS
      .filter((d) => d.fecha !== dia.fecha && guardado.dias[d.fecha] === numero && numero)
      .map((d) => d.etiqueta);

    return NextResponse.json({
      ok: true,
      fecha: dia.fecha,
      numero,
      dueno: dueno.dueno,
      repetido,
    });
  } catch (err) {
    console.error("[admin/anticipados]", err);
    return bad(err.message || "Error", 500);
  }
}
