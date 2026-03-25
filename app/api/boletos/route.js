import { NextResponse } from "next/server";

/**
 * Asignación de boletos solo debe ocurrir vía webhook tras pago validado.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Endpoint deshabilitado" },
    { status: 410 }
  );
}
