import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { registrarActividad } from "@/lib/admin-actividad";
import {
  faltaTablaSorteo,
  normalizarSorteo,
  planesDeSorteo,
  payloadSinColumnaQueFalta,
  urlPublicaSorteo,
} from "@/lib/club-gomez/sorteos";

export const dynamic = "force-dynamic";

function bad(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function PUT(request, { params }) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { payload, error: valErr } = normalizarSorteo(body);
    if (valErr) return bad(valErr);

    const { data: actual, error: leeErr } = await supabaseAdmin
      .from("sorteos_rifa")
      .select("id, slug, es_principal, trabajando")
      .eq("id", id)
      .maybeSingle();
    if (leeErr) {
      if (faltaTablaSorteo(leeErr)) {
        return bad("Falta ejecutar la migración 020_sorteos_independientes.sql en Supabase.");
      }
      return bad(leeErr.message);
    }
    if (!actual) return bad("Sorteo no encontrado", 404);

    const ahora = new Date().toISOString();
    if (payload.es_principal === true) {
      await supabaseAdmin
        .from("sorteos_rifa")
        .update({ es_principal: false, updated_at: ahora })
        .eq("es_principal", true)
        .neq("id", id);
    }
    if (payload.trabajando === true) {
      await supabaseAdmin
        .from("sorteos_rifa")
        .update({ trabajando: false, updated_at: ahora })
        .eq("trabajando", true)
        .neq("id", id);
    }
    payload.updated_at = ahora;

    let aviso = null;
    let cuerpo = payload;
    let data;
    let error;
    for (let intento = 0; intento < 3; intento += 1) {
      ({ data, error } = await supabaseAdmin
        .from("sorteos_rifa")
        .update(cuerpo)
        .eq("id", id)
        .select("*")
        .single());
      if (!error) break;
      const siguiente = payloadSinColumnaQueFalta(cuerpo, error);
      if (!siguiente) break;
      cuerpo = siguiente;
      aviso =
        "Lo demás se guardó. Para las tarjetas y los premios del mismo número, pega en Supabase los archivos 022 y 023.";
    }
    if (error) {
      if (error.code === "23505") return bad("Ese link ya existe. Elige otro.");
      return bad(error.message);
    }

    await registrarActividad(supabaseAdmin, user, "sorteo_guardado", {
      nombre: data.nombre,
      slug: data.slug,
    });

    revalidatePath("/");
    revalidatePath(`/sorteo/${data.slug}`);
    if (actual.slug !== data.slug) revalidatePath(`/sorteo/${actual.slug}`);

    const planes = await planesDeSorteo(supabaseAdmin, data.id);
    return NextResponse.json({
      ok: true,
      sorteo: { ...data, url: urlPublicaSorteo(data.slug), planes },
      slugAnterior: actual.slug !== data.slug ? actual.slug : null,
      aviso,
    });
  } catch (err) {
    return bad(err.message || "No se pudo guardar", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const { id } = await params;
    const { count } = await supabaseAdmin
      .from("claves")
      .select("id", { count: "exact", head: true })
      .eq("sorteo_id", id);
    if (count > 0) {
      return bad("Este sorteo ya tiene números vendidos. Ciérralo, no lo borres.");
    }

    const { data: actual } = await supabaseAdmin
      .from("sorteos_rifa")
      .select("nombre, slug, es_principal")
      .eq("id", id)
      .maybeSingle();
    if (actual?.es_principal) {
      return bad("No se puede borrar el sorteo principal. Marca otro como principal primero.");
    }

    const { error } = await supabaseAdmin.from("sorteos_rifa").delete().eq("id", id);
    if (error) return bad(error.message);

    await registrarActividad(supabaseAdmin, user, "sorteo_borrado", {
      nombre: actual?.nombre || "",
      slug: actual?.slug || "",
    });
    if (actual?.slug) revalidatePath(`/sorteo/${actual.slug}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return bad(err.message || "No se pudo borrar", 500);
  }
}
