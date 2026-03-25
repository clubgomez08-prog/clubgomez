import { NextResponse } from "next/server";

/**
 * Este endpoint exponía listado e inserción con service role sin auth (riesgo crítico).
 * El flujo real es: formulario (Supabase cliente) + POST /api/crear-preferencia.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Endpoint deshabilitado" },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Usa el flujo del formulario y /api/crear-preferencia" },
    { status: 410 }
  );
}
