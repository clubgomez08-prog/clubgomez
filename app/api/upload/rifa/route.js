import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";

export async function POST(request) {
  const user = await verificarSesionAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const filename = `${Date.now()}-${file.name.replace(/\s/g, "-")}`;

  const { data, error } = await supabaseAdmin.storage
    .from("rifas")
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("rifas")
    .getPublicUrl(data.path);

  return NextResponse.json({ url: urlData.publicUrl });
}
