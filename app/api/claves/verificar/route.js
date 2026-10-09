import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { padClave, periodoDe } from "@/lib/club-gomez/claves-pool";
import { getPlanById } from "@/lib/club-gomez/planes";

export const dynamic = "force-dynamic";

const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_IP = 8;
const MAX_FALLOS_POR_CEDULA = 5;
const NO_ENCONTRADO =
  "No encontramos claves con esos datos este mes. Revisa la cédula y los últimos 4 dígitos de tu celular.";

// Por instancia del servidor: frena a quien prueba cédulas al azar.
const intentosIp = new Map();
const fallosCedula = new Map();

function contar(mapa, clave) {
  const ahora = Date.now();
  const lista = (mapa.get(clave) || []).filter((t) => ahora - t < VENTANA_MS);
  lista.push(ahora);
  mapa.set(clave, lista);
  if (mapa.size > 5000) {
    for (const [k, v] of mapa) {
      if (!v.some((t) => ahora - t < VENTANA_MS)) mapa.delete(k);
    }
  }
  return lista.length;
}

function vecesRecientes(mapa, clave) {
  const ahora = Date.now();
  return (mapa.get(clave) || []).filter((t) => ahora - t < VENTANA_MS).length;
}

function ipDe(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anon"
  );
}

/** "María Luisa Pérez" → "María L." */
function nombreParcial(nombre) {
  const partes = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "Miembro";
  const primero = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
  return partes[1] ? `${primero} ${partes[1].charAt(0).toUpperCase()}.` : primero;
}

async function campanaActiva() {
  try {
    const { data } = await supabaseAdmin
      .from("campanas")
      .select("nombre, fecha_sorteo, loteria")
      .eq("activa", true)
      .maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
    }

    const ip = ipDe(request);
    if (contar(intentosIp, ip) > MAX_POR_IP) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const cedula = String(body.cedula || "").replace(/\D/g, "");
    const ultimos4 = String(body.ultimos4 || "").replace(/\D/g, "");

    if (cedula.length < 5 || cedula.length > 12) {
      return NextResponse.json({ error: "Escribe tu número de cédula." }, { status: 400 });
    }
    if (ultimos4.length !== 4) {
      return NextResponse.json(
        { error: "Escribe los últimos 4 dígitos de tu celular." },
        { status: 400 }
      );
    }
    if (vecesRecientes(fallosCedula, cedula) >= MAX_FALLOS_POR_CEDULA) {
      return NextResponse.json(
        { error: "Demasiados intentos con esta cédula. Espera unos minutos." },
        { status: 429 }
      );
    }

    const conPuntos = cedula.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const { data: encontrados } = await supabaseAdmin
      .from("miembros")
      .select("id, nombre, telefono")
      .in("cedula", [...new Set([cedula, conPuntos])])
      .limit(1);
    const miembro = encontrados?.[0] || null;

    const telDigits = String(miembro?.telefono || "").replace(/\D/g, "");
    if (!miembro || telDigits.length < 4 || !telDigits.endsWith(ultimos4)) {
      contar(fallosCedula, cedula);
      return NextResponse.json({ error: NO_ENCONTRADO }, { status: 404 });
    }

    const periodo = periodoDe();
    const { data: membresias } = await supabaseAdmin
      .from("membresias")
      .select("id, plan_id, claves(numero, periodo)")
      .eq("miembro_id", miembro.id)
      .eq("estado", "activa");

    const grupos = (membresias || [])
      .map((m) => ({
        plan: getPlanById(m.plan_id).nombre,
        numeros: (m.claves || [])
          .filter((c) => c.periodo === periodo)
          .map((c) => padClave(c.numero))
          .sort(),
      }))
      .filter((g) => g.numeros.length);

    if (!grupos.length) {
      return NextResponse.json({ error: NO_ENCONTRADO }, { status: 404 });
    }

    const campana = await campanaActiva();

    return NextResponse.json({
      ok: true,
      nombre: nombreParcial(miembro.nombre),
      grupos,
      total: grupos.reduce((n, g) => n + g.numeros.length, 0),
      sorteo: campana
        ? {
            nombre: campana.nombre || null,
            fecha: campana.fecha_sorteo || null,
            loteria: campana.loteria || null,
          }
        : null,
    });
  } catch (err) {
    console.error("[claves/verificar]", err);
    return NextResponse.json(
      { error: "No pudimos consultar en este momento. Inténtalo más tarde." },
      { status: 500 }
    );
  }
}
