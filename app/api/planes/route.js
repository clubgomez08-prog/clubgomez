import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import { cargarPlanes } from "@/lib/club-gomez/planes-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const planes = supabaseMissingEnv ? PLANES_MEMBRESIA : await cargarPlanes(supabaseAdmin);
  return NextResponse.json(
    { ok: true, planes },
    { headers: { "Cache-Control": "public, s-maxage=15" } }
  );
}
