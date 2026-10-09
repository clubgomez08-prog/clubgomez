import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { CAMPANAS_BUCKET } from "@/lib/club-gomez/campanas";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No llegó ninguna imagen" }, { status: 400 });
    }
    const ext = TIPOS[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa JPG, PNG o WEBP." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "La imagen pesa más de 5 MB. Comprímela antes de subirla." },
        { status: 400 }
      );
    }

    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(CAMPANAS_BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (error) {
      const sinBucket = /bucket/i.test(error.message || "");
      return NextResponse.json(
        {
          error: sinBucket
            ? "Falta la carpeta de imágenes: corre la migración 018_campanas.sql en Supabase."
            : error.message,
        },
        { status: 400 }
      );
    }

    const { data } = supabaseAdmin.storage.from(CAMPANAS_BUCKET).getPublicUrl(path);
    return NextResponse.json({ ok: true, url: data.publicUrl });
  } catch (err) {
    console.error("[admin/campanas/imagen]", err);
    return NextResponse.json(
      { error: err.message || "Error al subir imagen" },
      { status: 500 }
    );
  }
}
