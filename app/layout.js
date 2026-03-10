// Nota: logo-rifex.png en /public es archivo legacy
// Los logos activos son: logo_principal.png y logo_hero.png
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata = {
  title: "RIFEX - Un número puede cambiar tu vida",
  description: "Plataforma oficial de rifas digitales RIFEX",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23071521'/><text y='.9em' font-size='80' x='10' fill='%23F2B233' font-family='Arial Black' font-weight='900'>R</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${poppins.variable} font-poppins antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
