import { Suspense } from "react";

export const metadata = {
  title: "Club Gómez — Membresía exclusiva",
  description:
    "Únete a Club Gómez. Obtén descuentos exclusivos, beneficios sorpresa y sé parte del Club.",
  openGraph: {
    title: "Club Gómez — Membresía exclusiva",
    description:
      "Únete a Club Gómez. Obtén descuentos exclusivos, beneficios sorpresa y sé parte del Club.",
    type: "website",
  },
};

export default function PublicLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
