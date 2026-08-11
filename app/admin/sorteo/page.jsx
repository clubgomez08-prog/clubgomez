import { redirect } from "next/navigation";

/** Legacy rifas sorteo → fechas de premio Motilón */
export default function AdminSorteoRedirect() {
  redirect("/admin/beneficios");
}
