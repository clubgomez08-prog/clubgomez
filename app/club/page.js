import ClubPage from "./club-page-client";

export const metadata = {
  title: "RIFEX — Un número puede cambiar tu vida",
  description: "Únete a la comunidad RIFEX y descubre tu oportunidad.",
  openGraph: {
    title: "RIFEX — Un número puede cambiar tu vida",
    description: "Únete a la comunidad RIFEX y descubre tu oportunidad.",
    url: "https://rifex.app/club",
    siteName: "RIFEX",
    images: [
      {
        url: "https://res.cloudinary.com/dmmnaypmc/image/upload/v1774429833/logo-rifex_odtuey.png",
        width: 1200,
        height: 630,
        alt: "RIFEX",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RIFEX — Un número puede cambiar tu vida",
    description: "Únete a la comunidad RIFEX y descubre tu oportunidad.",
    images: [
      "https://res.cloudinary.com/dmmnaypmc/image/upload/v1774429833/logo-rifex_odtuey.png",
    ],
  },
};

export default ClubPage;
