import { getAdminAuthHeaders } from "@/lib/auth";
import { MENSAJE_WHATSAPP_DEFAULT } from "@/lib/club-gomez/sorteos";

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

export function linkWhatsappNumeros({ telefono, nombre, numeros, planNombre, plantilla, premio, fecha, loteria }) {
  const digits = String(telefono || "").replace(/\D/g, "");
  if (!digits) return null;
  const tel = digits.length === 10 ? `57${digits}` : digits;
  const lista = (numeros || []).join(" - ");
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const mf = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fecha || ""));
  const fechaTexto = mf ? `${Number(mf[3])} de ${meses[Number(mf[2]) - 1]}` : (fecha || "");
  const vars = {
    nombre: String(nombre || "").split(" ")[0] || "",
    numeros: lista,
    plan: planNombre || "",
    premio: premio || "",
    fecha: fechaTexto,
    loteria: loteria || "lotería",
  };
  const base = String(plantilla || "").trim() || MENSAJE_WHATSAPP_DEFAULT;
  const texto = base.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
}

/** El mismo texto que se guarda en Correos para ese sorteo. */
export function linkWhatsappDeSorteo(sorteo, persona) {
  if (!sorteo) {
    return linkWhatsappNumeros({
      ...persona,
      plantilla: "Hola {nombre}! Tus números: {numeros}. Mucha suerte.",
    });
  }
  return linkWhatsappNumeros({
    ...persona,
    plantilla: sorteo.mensaje_whatsapp || MENSAJE_WHATSAPP_DEFAULT,
    premio: sorteo.premio || sorteo.nombre || "",
    fecha: sorteo.fecha_sorteo || "",
    loteria: sorteo.loteria || "",
  });
}

/** Abre WhatsApp con un texto ya listo (por si lo editaron en la venta). */
export function linkWhatsappTexto(telefono, texto) {
  const digits = String(telefono || "").replace(/\D/g, "");
  if (!digits) return null;
  const tel = digits.length === 10 ? `57${digits}` : digits;
  const msg = String(texto || "").trim();
  if (!msg) return null;
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
}
