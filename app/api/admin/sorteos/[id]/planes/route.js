import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { espejarPlan, payloadSinColumnaQueFalta, planesDeSorteo } from "@/lib/club-gomez/sorteos";

export const dynamic = "force-dynamic";

function bad(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function entero(v) {
  const n = Number(String(v ?? "").replace(/\D/g, ""));
  return Number.isInteger(n) ? n : NaN;
}

function textoCorto(v, max) {
  const t = String(v || "").trim();
  return t ? t.slice(0, max) : null;
}

function extrasDelPlan(body, precio) {
  const antes = entero(body.precio_antes);
  if (Number.isInteger(antes) && antes > 0 && antes <= precio) {
    return { error: "El precio tachado tiene que ser mayor que el precio." };
  }
  return {
    campos: {
      precio_antes: Number.isInteger(antes) && antes > precio ? antes : null,
      recomendado: body.recomendado === true,
      etiqueta: textoCorto(body.etiqueta, 40),
      precio_sufijo: textoCorto(body.precio_sufijo, 16),
      boton: textoCorto(body.boton, 40),
    },
  };
}

async function escribirPlan(accion, payload) {
  let actual = { ...payload };
  let aviso = "";
  for (let i = 0; i < 6; i += 1) {
    const { data, error } = await accion(actual);
    if (!error) return { data, aviso };
    const next = payloadSinColumnaQueFalta(actual, error);
    if (!next) return { error };
    aviso = "El plan se guardó, pero falta correr el SQL de las tarjetas para que recomendado, precio tachado y textos queden guardados.";
    actual = next;
  }
  return { error: { message: "No se pudo guardar el plan." } };
}

export async function POST(request, { params }) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const nombre = String(body.nombre || "").trim();
    const precio = entero(body.precio_cop ?? body.precio);
    const claves = entero(body.claves);
    if (!nombre) return bad("El nombre del plan es obligatorio.");
    if (!(precio >= 1000 && precio <= 5_000_000)) {
      return bad("El precio debe estar entre $1.000 y $5.000.000.");
    }
    if (!(claves >= 1 && claves <= 100)) {
      return bad("Las oportunidades por plan van de 1 a 100.");
    }
    const extras = extrasDelPlan(body, precio);
    if (extras.error) return bad(extras.error);

    const { data: existentes } = await supabaseAdmin
      .from("sorteo_planes")
      .select("orden")
      .eq("sorteo_id", id);
    const orden = (existentes || []).reduce((m, p) => Math.max(m, p.orden || 0), 0) + 1;

    const escrito = await escribirPlan(
      (fila) => supabaseAdmin.from("sorteo_planes").insert(fila).select("*").single(),
      {
        sorteo_id: id,
        nombre,
        precio_cop: precio,
        claves,
        tag: String(body.tag || "").trim() || null,
        orden,
        ...extras.campos,
      }
    );
    if (escrito.error) return bad(escrito.error.message);
    const data = escrito.data;
    await espejarPlan(supabaseAdmin, data);

    const { data: sorteo } = await supabaseAdmin
      .from("sorteos_rifa")
      .select("slug")
      .eq("id", id)
      .maybeSingle();
    if (sorteo?.slug) {
      revalidatePath("/");
      revalidatePath(`/sorteo/${sorteo.slug}`);
    }
    return NextResponse.json({
      ok: true,
      aviso: escrito.aviso || undefined,
      planes: await planesDeSorteo(supabaseAdmin, id),
      user: user.id,
    });
  } catch (err) {
    return bad(err.message || "No se pudo crear el plan", 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const planId = String(body.id || "");
    const nombre = String(body.nombre || "").trim();
    const precio = entero(body.precio_cop ?? body.precio);
    const claves = entero(body.claves);
    if (!planId) return bad("Falta el plan.");
    if (!nombre) return bad("El nombre del plan es obligatorio.");
    if (!(precio >= 1000 && precio <= 5_000_000)) {
      return bad("El precio debe estar entre $1.000 y $5.000.000.");
    }
    if (!(claves >= 1 && claves <= 100)) {
      return bad("Las oportunidades por plan van de 1 a 100.");
    }
    const extras = extrasDelPlan(body, precio);
    if (extras.error) return bad(extras.error);

    const escrito = await escribirPlan(
      (fila) =>
        supabaseAdmin
          .from("sorteo_planes")
          .update(fila)
          .eq("id", planId)
          .eq("sorteo_id", id)
          .select("*")
          .single(),
      {
        nombre,
        precio_cop: precio,
        claves,
        tag: String(body.tag || "").trim() || null,
        activo: body.activo !== false,
        ...extras.campos,
      }
    );
    if (escrito.error) return bad(escrito.error.message);
    await espejarPlan(supabaseAdmin, escrito.data);

    const { data: sorteo } = await supabaseAdmin
      .from("sorteos_rifa")
      .select("slug")
      .eq("id", id)
      .maybeSingle();
    if (sorteo?.slug) {
      revalidatePath("/");
      revalidatePath(`/sorteo/${sorteo.slug}`);
    }
    return NextResponse.json({
      ok: true,
      aviso: escrito.aviso || undefined,
      planes: await planesDeSorteo(supabaseAdmin, id),
    });
  } catch (err) {
    return bad(err.message || "No se pudo guardar el plan", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const { id } = await params;
    const planId = new URL(request.url).searchParams.get("planId");
    if (!planId) return bad("Falta el plan.");

    const { count } = await supabaseAdmin
      .from("membresias")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", planId);
    if (count > 0) {
      return bad("Ese plan ya tiene ventas. Cámbiale el nombre o el precio, no lo borres.");
    }

    const { error } = await supabaseAdmin
      .from("sorteo_planes")
      .delete()
      .eq("id", planId)
      .eq("sorteo_id", id);
    if (error) return bad(error.message);
    return NextResponse.json({ ok: true, planes: await planesDeSorteo(supabaseAdmin, id) });
  } catch (err) {
    return bad(err.message || "No se pudo borrar el plan", 500);
  }
}
