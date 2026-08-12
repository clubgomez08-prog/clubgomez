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
    images: [
      {
        url: "/og-club-gomez.jpg",
        width: 1254,
        height: 1254,
        alt: "Club Gómez",
      },
    ],
  },
};

export default function PublicLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
