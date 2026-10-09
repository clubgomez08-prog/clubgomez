import { getAdminAuthHeaders } from "@/lib/auth";

/** Descarga un archivo de un endpoint del panel (requiere sesión admin). */
export async function descargarArchivoAdmin(url, nombreArchivo) {
  const res = await fetch(url, { headers: await getAdminAuthHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "No se pudo descargar");
  }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export function linkWhatsappNumeros({ telefono, nombre, numeros, planNombre }) {
  const digits = String(telefono || "").replace(/\D/g, "");
  if (!digits) return null;
  const tel = digits.length === 10 ? `57${digits}` : digits;
  const lista = (numeros || []).join(" - ");
  const texto = [
    `Hola ${String(nombre || "").split(" ")[0] || ""}! Bienvenido al Club Gómez.`,
    `Plan ${planNombre || ""}`.trim(),
    `Tus números: ${lista}`,
    "Juegan con los últimos 3 dígitos de la lotería. ¡Mucha suerte!",
  ].join("\n");
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
}
