import { redirect } from "next/navigation";

/** Config de banners Rifex — ya no aplica a Club Gómez */
export default function AdminLandingRedirect() {
  redirect("/admin");
}
