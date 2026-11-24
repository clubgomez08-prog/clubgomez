import { redirect } from "next/navigation";

export const revalidate = 30;

/** El sorteo viejo ya pasó: el inicio manda a las 3 motos. */
export default function ClubGomezHome() {
  redirect("/navidad");
}
