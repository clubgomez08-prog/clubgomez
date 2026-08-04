// Nota: logo-rifex.png en /public es archivo legacy
// Los logos activos son: logo_principal.png y logo_hero.png
import { Bebas_Neue, Oswald, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Club Gómez — Membresía exclusiva",
  description: "Únete a Club Gómez. Descuentos exclusivos y beneficios del Club.",
  icons: {
    icon: [{ url: "/club-gomez/logo-mark.jpg", type: "image/jpeg" }],
    apple: "/club-gomez/logo-mark.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '825977093882247');
          fbq('track', 'PageView');
        `}
      </Script>
      <body
        className={`${poppins.variable} ${bebas.variable} ${oswald.variable} font-poppins antialiased`}
      >
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=825977093882247&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
