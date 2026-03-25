import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";

export const dynamic = "force-dynamic";

const DEFAULT_PAQUETES_TICKETS = [50, 100, 150, 200, 250, 500, 600, 850, 1000];

function normalizarPaquetesTickets(input) {
  if (input === undefined || input === null) return DEFAULT_PAQUETES_TICKETS;
  if (!Array.isArray(input)) return DEFAULT_PAQUETES_TICKETS;
  const nums = input
    .map((x) => parseInt(x, 10))
    .filter((n) => !isNaN(n) && n >= 1);
  const unique = [...new Set(nums)].sort((a, b) => a - b).slice(0, 9);
  return unique.length >= 1 ? unique : DEFAULT_PAQUETES_TICKETS;
}

const RE_NUMERO_BENDECIDO = /^\d{4}-\d{2}$/;

function normalizarNumerosBendecidos(input) {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return [];
  const out = [];
  const seen = new Set();
  for (const x of input) {
    const s = String(x ?? "").trim();
    if (!RE_NUMERO_BENDECIDO.test(s)) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 20) break;
  }
  return out;
}

export async function GET() {
  const { data: rifasData, error } = await supabaseAdmin
    .from("rifas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rifas = rifasData || [];
  let ventasPorRifa = {};

  const { data: ventasData, error: ventasError } = await supabaseAdmin
    .from("boletos")
    .select("rifa_id");

  if (!ventasError && ventasData) {
    ventasPorRifa = ventasData.reduce((acc, b) => {
      if (b?.rifa_id) acc[b.rifa_id] = (acc[b.rifa_id] || 0) + 1;
      return acc;
    }, {});
  }

  const rifasConVentas = rifas.map((r) => ({
    ...r,
    boletos_vendidos: ventasPorRifa[r.id] || 0,
  }));

  return NextResponse.json(rifasConVentas);
}

export async function POST(request) {
  const user = await verificarSesionAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  const rifa = {
    nombre: body.nombre,
    descripcion: body.descripcion ?? null,
    imagen_url: body.imagen_url ?? null,
    video_url: body.video_url || "",
    imagenes_url: body.imagenes_url || [],
    precio_boleto: body.precio_boleto,
    total_numeros: body.total_numeros ?? 10000,
    porcentaje_sorteo: body.porcentaje_sorteo ?? 80,
    premios_anticipados: body.premios_anticipados || [],
    paquetes_tickets: normalizarPaquetesTickets(body.paquetes_tickets),
    imagen_banner_izquierda:
      body.imagen_banner_izquierda?.trim?.() || null,
    imagen_banner_derecha: body.imagen_banner_derecha?.trim?.() || null,
    numeros_bendecidos: normalizarNumerosBendecidos(body.numeros_bendecidos),
    serie_actual: 0,
  };

  if (!rifa.nombre || rifa.precio_boleto == null) {
    return NextResponse.json(
      { error: "nombre y precio_boleto son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin.from("rifas").insert(rifa).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
