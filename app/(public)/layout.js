import { Suspense } from "react";

export const metadata = {
  title: "Club Gómez — Membresía exclusiva",
  description:
    "Club Gómez: Yamaha Crypton 0 km más $1.000.000. 17 de octubre, Lotería de Boyacá. Membresía Élite, Selecto o Esencial.",
  openGraph: {
    title: "Club Gómez — Membresía exclusiva",
    description:
      "Club Gómez: Yamaha Crypton 0 km más $1.000.000. 17 de octubre, Lotería de Boyacá. Membresía Élite, Selecto o Esencial.",
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
