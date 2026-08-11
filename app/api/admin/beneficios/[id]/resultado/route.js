import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { padClave } from "@/lib/club-gomez/claves-pool";
import { enviarEmailGanador } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Registra resultado Motilón y cruza con claves del periodo.
 */
export async function POST(request, { params }) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const { id } = await params;
    const body = await request.json();
    const resultado = padClave(body.resultado);

    if (!/^\d{4}$/.test(resultado)) {
      return NextResponse.json(
        { error: "El resultado debe ser 4 dígitos (0000–9999)" },
        { status: 400 }
      );
    }

    const { data: beneficio, error: benErr } = await supabaseAdmin
      .from("sorteos_beneficio")
      .select("*")
      .eq("id", id)
      .single();

    if (benErr || !beneficio) {
      return NextResponse.json({ error: "Beneficio no encontrado" }, { status: 404 });
    }

    if (beneficio.estado !== "programado") {
      return NextResponse.json(
        { error: `Ya está en estado: ${beneficio.estado}` },
        { status: 400 }
      );
    }

    const { data: clave } = await supabaseAdmin
      .from("claves")
      .select("id, numero, periodo, membresia_id")
      .eq("periodo", beneficio.periodo)
      .eq("numero", resultado)
      .maybeSingle();

    const ahora = new Date().toISOString();
    let update = {
      resultado,
      jugado_en: ahora,
      updated_at: ahora,
    };

    let ganador = null;
    let emailOk = false;

    if (clave) {
      const { data: membresia } = await supabaseAdmin
        .from("membresias")
        .select("id, miembro_id, plan_id")
        .eq("id", clave.membresia_id)
        .maybeSingle();

      const { data: miembro } = membresia?.miembro_id
        ? await supabaseAdmin
            .from("miembros")
            .select("id, nombre, email, telefono")
            .eq("id", membresia.miembro_id)
            .maybeSingle()
        : { data: null };

      update = {
        ...update,
        estado: "jugado",
        ganador_clave_id: clave.id,
        ganador_miembro_id: miembro?.id || membresia?.miembro_id || null,
      };

      ganador = miembro
        ? { ...miembro, clave: resultado }
        : {
            id: membresia?.miembro_id || null,
            clave: resultado,
          };

      if (miembro?.email) {
        try {
          await enviarEmailGanador(
            miembro,
            { nombre: beneficio.premio },
            resultado
          );
          emailOk = true;
        } catch (err) {
          console.error("[beneficios/resultado] email:", err?.message || err);
        }
      }
    } else {
      update = {
        ...update,
        estado: "sin_ganador",
        ganador_clave_id: null,
        ganador_miembro_id: null,
      };
    }

    const { data: updated, error: upErr } = await supabaseAdmin
      .from("sorteos_beneficio")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      beneficio: updated,
      ganador,
      emailOk,
      hayGanador: Boolean(clave),
    });
  } catch (err) {
    console.error("[admin/beneficios/resultado]", err);
    return NextResponse.json(
      { error: err.message || "Error al registrar resultado" },
      { status: 500 }
    );
  }
}
