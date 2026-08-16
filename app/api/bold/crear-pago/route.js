import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { getPlanById } from "@/lib/club-gomez/planes";
import {
  boldConfigured,
  boldIdentityKey,
  boldRedirectionUrl,
  crearOrderId,
  generarIntegritySignature,
} from "@/lib/club-gomez/bold";
import { parseFechaNacimiento } from "@/lib/club-gomez/fecha-nacimiento";
import { asegurarCuentaParaCheckout } from "@/lib/club-gomez/cuenta-checkout";

function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

/** Crea cuenta (si hace falta) + solicitud + firma Bold para abrir el checkout. */
export async function POST(request) {
  try {
    if (supabaseMissingEnv) return bad("Supabase no configurado.", 503);
    if (!boldConfigured()) {
      return bad("Bold no está configurado (llaves de integración).", 503);
    }

    const body = await request.json();
    const plan = getPlanById(body.planId || body.plan_id);
    const nombre = String(body.nombre || "").trim();
    const cedula = String(body.cedula || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const telefono = String(body.telefono || "").trim();
    const ciudad = String(body.ciudad || "").trim() || null;
    const password = String(body.password || "");
    const fechaNacimiento = parseFechaNacimiento(
      body.fecha_nacimiento || body.fechaNacimiento
    );
    const originHeader = request.headers.get("origin") || "";
    const baseFromClient = String(body.baseUrl || originHeader || "").trim();

    if (!nombre) return bad("Escribe tu nombre completo.");
    if (!cedula) return bad("Escribe tu cédula.");
    if (!email || !email.includes("@")) return bad("Escribe un email válido.");
    if (!telefono) return bad("Escribe tu WhatsApp.");
    if (!fechaNacimiento) {
      return bad(
        "Escribe una fecha de nacimiento válida (debes tener al menos 12 años)."
      );
    }

    let cuenta = null;

    if (password) {
      try {
        cuenta = await asegurarCuentaParaCheckout({
          nombre,
          email,
          telefono,
          ciudad,
          cedula,
          password,
          fechaNacimiento,
        });
      } catch (err) {
        return bad(
          err.message || "No se pudo preparar tu cuenta.",
          err.status || 400
        );
      }
    } else {
      // Checkout sin registro: solo guarda/actualiza miembro (sin Auth)
      const { data: miembroExistente } = await supabaseAdmin
        .from("miembros")
        .select("id, auth_user_id")
        .ilike("email", email)
        .maybeSingle();

      if (miembroExistente) {
        await supabaseAdmin
          .from("miembros")
          .update({
            nombre,
            telefono,
            ciudad,
            cedula,
            fecha_nacimiento: fechaNacimiento,
            updated_at: new Date().toISOString(),
          })
          .eq("id", miembroExistente.id);
      } else {
        const { error: miembroErr } = await supabaseAdmin.from("miembros").insert({
          nombre,
          email,
          telefono,
          ciudad,
          cedula,
          fecha_nacimiento: fechaNacimiento,
          estado: "activo",
        });
        if (miembroErr) {
          console.error("[bold/crear-pago] miembro guest:", miembroErr);
          return bad(
            miembroErr.message || "No se pudieron guardar tus datos.",
            400
          );
        }
      }
      cuenta = { created: false, session: null, perfil: null };
    }

    const fbp = String(body.fbp || "").trim().slice(0, 200);
    const fbc = String(body.fbc || "").trim().slice(0, 512);

    const orderId = crearOrderId(plan.id);
    const amount = String(plan.precio);
    const currency = "COP";
    const integritySignature = generarIntegritySignature({
      orderId,
      amount,
      currency,
    });

    const { data: solicitud, error } = await supabaseAdmin
      .from("solicitudes_membresia")
      .insert({
        plan_id: plan.id,
        nombre,
        cedula,
        email,
        telefono,
        ciudad,
        estado: "nueva",
        notas: JSON.stringify({
          bold_order_id: orderId,
          amount: plan.precio,
          currency,
          canal: "bold",
          fecha_nacimiento: fechaNacimiento,
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
        }),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[bold/crear-pago]", error);
      return bad(error.message || "No se pudo crear la solicitud.", 400);
    }

    if (fechaNacimiento) {
      await supabaseAdmin
        .from("miembros")
        .update({
          fecha_nacimiento: fechaNacimiento,
          updated_at: new Date().toISOString(),
        })
        .ilike("email", email)
        .is("fecha_nacimiento", null);
    }

    const phoneDigits = telefono.replace(/\D/g, "");
    const customerData = JSON.stringify({
      email,
      fullName: nombre.slice(0, 80),
      phone: phoneDigits.slice(-10),
      dialCode: "+57",
      documentNumber: cedula.replace(/\D/g, "").slice(0, 20),
      documentType: "CC",
    });

    const description = `Membresia Club Gomez Plan ${plan.nombre}`.slice(0, 100);
    const redirectionUrl = boldRedirectionUrl(baseFromClient);

    const checkout = {
      orderId,
      amount,
      currency,
      apiKey: boldIdentityKey(),
      integritySignature,
      description,
      customerData,
    };
    if (redirectionUrl) {
      checkout.redirectionUrl = redirectionUrl;
    }

    return NextResponse.json({
      ok: true,
      solicitudId: solicitud.id,
      checkout,
      cuentaCreada: Boolean(cuenta?.created),
      perfil: cuenta?.perfil || null,
      session: cuenta?.session || null,
      plan: {
        id: plan.id,
        nombre: plan.nombre,
        precio: plan.precio,
      },
      debug:
        process.env.NODE_ENV !== "production"
          ? {
              orderId,
              amount,
              currency,
              redirectionUrl: redirectionUrl || "(omitida — local http)",
              apiKeyPrefix: boldIdentityKey().slice(0, 8),
            }
          : undefined,
    });
  } catch (err) {
    console.error("[bold/crear-pago]", err);
    return bad(err.message || "Error al preparar el pago.", 500);
  }
}
