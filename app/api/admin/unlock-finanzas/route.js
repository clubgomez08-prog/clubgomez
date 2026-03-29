import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { verificarSesionAdmin } from "@/lib/auth-admin";

function compararPasswordSeguro(ingresada, esperada) {
  if (typeof ingresada !== "string" || typeof esperada !== "string") {
    return false;
  }
  const a = Buffer.from(ingresada, "utf8");
  const b = Buffer.from(esperada, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function POST(request) {
  const user = await verificarSesionAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const esperada = process.env.ADMIN_FINANCE_PASSWORD;
  if (esperada == null || String(esperada).length === 0) {
    return NextResponse.json(
      { error: "Configuración incompleta" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const password = body?.password;
  if (password == null || typeof password !== "string") {
    return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 });
  }

  if (!compararPasswordSeguro(password, esperada)) {
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
