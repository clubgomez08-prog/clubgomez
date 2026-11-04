import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { registrarActividad } from "@/lib/admin-actividad";
import {
  faltaTablaSorteo,
  normalizarSorteo,
  payloadSinColumnaQueFalta,
  planesDeSorteo,
  slugificar,
  urlPublicaSorteo,
  cerrarVencidos,
} from "@/lib/club-gomez/sorteos";

export const dynamic = "force-dynamic";

function bad(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const { data, error } = await supabaseAdmin
      .from("sorteos_rifa")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (faltaTablaSorteo(error)) {
        return NextResponse.json({ ok: true, faltaTabla: true, sorteos: [] });
      }
      return bad(error.message);
    }

    const sorteos = await cerrarVencidos(supabaseAdmin, data || []);
    const ids = sorteos.map((s) => s.id);
    let planes = [];
    if (ids.length) {
      const res = await supabaseAdmin
        .from("sorteo_planes")
        .select("*")
        .in("sorteo_id", ids)
        .order("orden", { ascending: true });
      if (res.error) return bad(res.error.message);
      planes = res.data || [];
    }
    const porSorteo = {};
    for (const p of planes) {
      if (!porSorteo[p.sorteo_id]) porSorteo[p.sorteo_id] = [];
      porSorteo[p.sorteo_id].push(p);
    }

    return NextResponse.json({
      ok: true,
      sorteos: sorteos.map((s) => ({
        ...s,
        url: urlPublicaSorteo(s.slug),
        planes: porSorteo[s.id] || [],
      })),
    });
  } catch (err) {
    return bad(err.message || "Error al listar sorteos", 500);
  }
}

export async function POST(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const body = await request.json().catch(() => ({}));
    const slug = slugificar(body.slug || body.nombre);
    const { payload, error: valErr } = normalizarSorteo({
      ...body,
      slug,
      estado: body.estado || "borrador",
      hero_cta: body.hero_cta || "¡Participar!",
      loteria: body.loteria || "Lotería de Boyacá",
      mensaje_whatsapp:
        body.mensaje_whatsapp ||
        "Hola {nombre}, bienvenido a Daniel Gomez Stunt te informamos que has comprado una boleta con el número {numeros} para {premio}, la cual juega el día {fecha} con las tres últimas cifras de la {loteria}, mucha suerte",
    });
    if (valErr) return bad(valErr);

    const { count } = await supabaseAdmin
      .from("sorteos_rifa")
      .select("id", { count: "exact", head: true });
    const primero = !count;
    payload.es_principal = primero;
    delete payload.trabajando;
    payload.estado = primero ? "en_venta" : payload.estado;

    let aviso = null;
    let cuerpo = payload;
    let data;
    let error;
    for (let intento = 0; intento < 3; intento += 1) {
      ({ data, error } = await supabaseAdmin
        .from("sorteos_rifa")
        .insert(cuerpo)
        .select("*")
        .single());
      if (!error) break;
      const siguiente = payloadSinColumnaQueFalta(cuerpo, error);
      if (!siguiente) break;
      cuerpo = siguiente;
      aviso =
        "El sorteo se creó. Para las tarjetas y los premios del mismo número, pega en Supabase los archivos 022 y 023.";
    }
    if (error) {
      if (faltaTablaSorteo(error)) {
        return bad("Falta ejecutar la migración 020_sorteos_independientes.sql en Supabase.");
      }
      if (error.code === "23505") return bad("Ese link ya existe. Elige otro.");
      return bad(error.message);
    }

    const { data: base } = body.sinPlanesBase
      ? { data: [] }
      : await supabaseAdmin
      .from("planes")
      .select("id, nombre, precio_cop, claves, tag")
      .in("id", ["elite", "selecto", "esencial"]);
    const orden = { elite: 1, selecto: 2, esencial: 3 };
    const copias = (base || [])
      .sort((a, b) => (orden[a.id] || 9) - (orden[b.id] || 9))
      .map((p) => ({
        sorteo_id: data.id,
        nombre: p.nombre,
        precio_cop: p.precio_cop,
        claves: p.claves,
        tag: p.tag,
        orden: orden[p.id] || 9,
      }));
    if (copias.length) {
      await supabaseAdmin.from("sorteo_planes").insert(copias);
    }

    await registrarActividad(supabaseAdmin, user, "sorteo_creado", {
      nombre: data.nombre,
      slug: data.slug,
    });
    if (data.es_principal) revalidatePath("/");
    revalidatePath(`/sorteo/${data.slug}`);

    const planes = await planesDeSorteo(supabaseAdmin, data.id);
    return NextResponse.json({
      ok: true,
      sorteo: { ...data, url: urlPublicaSorteo(data.slug), planes },
      aviso,
    });
  } catch (err) {
    return bad(err.message || "No se pudo crear el sorteo", 500);
  }
}
