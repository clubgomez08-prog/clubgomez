import { Suspense } from "react";

export const metadata = {
  title: "Club Gómez — Llévate 3 motos",
  description:
    "3 motos 0 km para un solo ganador. El 26 de diciembre, con la Lotería de Boyacá.",
  openGraph: {
    title: "Club Gómez — Llévate 3 motos",
    description:
      "3 motos 0 km para un solo ganador. El 26 de diciembre, con la Lotería de Boyacá.",
    type: "website",
    images: [
      {
        url: "/club-gomez/hero-navidad-ultima.jpg",
        width: 1024,
        height: 576,
        alt: "Llévate 3 motos 0 km",
      },
    ],
  },
};

export default function PublicLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
