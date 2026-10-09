import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { periodoDe } from "@/lib/club-gomez/claves-pool";
import { getPlanById } from "@/lib/club-gomez/planes";
import { listarNumerosPeriodo } from "@/lib/club-gomez/numeros-admin";
import { rangoPeriodoBogota } from "@/lib/club-gomez/periodo-rango";
import { registrarActividad } from "@/lib/admin-actividad";

export const dynamic = "force-dynamic";

// Excel en español separa columnas con punto y coma.
function csv(filas) {
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + filas.map((f) => f.map(esc).join(";")).join("\r\n");
}

function fechaCo(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function limpiarEmail(e) {
  const s = String(e || "");
  return s.endsWith("@sin-email.clubgomez.co") ? "" : s;
}

async function filasVentas(periodo) {
  const { desde, hasta } = rangoPeriodoBogota(periodo);
  const { data, error } = await supabaseAdmin
    .from("pagos")
    .select(
      "monto_cop, metodo, estado, pagado_en, wompi_reference, miembros(nombre, telefono, email, cedula), membresias(plan_id, origen, claves(numero, periodo))"
    )
    .in("estado", ["aprobado", "anulado"])
    .gte("pagado_en", desde)
    .lt("pagado_en", hasta)
    .order("pagado_en", { ascending: true });

  if (error) throw new Error(error.message);

  const filas = [
    ["Fecha", "Estado", "Canal", "Nombre", "Teléfono", "Email", "Cédula", "Plan", "Monto", "Números", "Orden Bold"],
  ];
  for (const p of data || []) {
    const mi = p.miembros || {};
    const mem = p.membresias || {};
    const numeros = (mem.claves || [])
      .filter((c) => c.periodo === periodo)
      .map((c) => c.numero)
      .sort()
      .join(" ");
    filas.push([
      fechaCo(p.pagado_en),
      p.estado,
      p.metodo === "efectivo" ? "Físico" : "Web",
      mi.nombre || "",
      mi.telefono || "",
      limpiarEmail(mi.email),
      String(mi.cedula || "").startsWith("fis-") ? "" : mi.cedula || "",
      mem.plan_id ? getPlanById(mem.plan_id).nombre : "",
      p.monto_cop,
      numeros,
      p.wompi_reference || "",
    ]);
  }
  return filas;
}

async function filasNumeros(periodo) {
  const numeros = await listarNumerosPeriodo(supabaseAdmin, periodo);
  const filas = [["Número", "Canal", "Nombre", "Teléfono", "Email", "Cédula", "Plan", "Fecha"]];
  for (const n of numeros) {
    filas.push([
      // Comilla para que Excel no convierta 007 en 7.
      `'${n.numero}`,
      n.canal === "web" ? "Web" : "Físico",
      n.nombre,
      n.telefono,
      n.email,
      n.cedula,
      n.planNombre,
      fechaCo(n.fecha),
    ]);
  }
  return filas;
}

export async function GET(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo") === "numeros" ? "numeros" : "ventas";
    const periodo = /^\d{4}-\d{2}$/.test(searchParams.get("periodo") || "")
      ? searchParams.get("periodo")
      : periodoDe();

    const filas = tipo === "numeros" ? await filasNumeros(periodo) : await filasVentas(periodo);

    await registrarActividad(supabaseAdmin, user, "exportar", {
      tipo,
      periodo,
      filas: filas.length - 1,
    });

    return new NextResponse(csv(filas), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="club-gomez-${tipo}-${periodo}.csv"`,
      },
    });
  } catch (err) {
    console.error("[admin/exportar]", err);
    return NextResponse.json(
      { error: err.message || "Error al exportar" },
      { status: 500 }
    );
  }
}
