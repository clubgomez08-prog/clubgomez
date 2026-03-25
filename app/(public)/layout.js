import { Suspense } from "react";

export const metadata = {
  title: "RIFEX - Un número puede cambiar tu vida",
  description: "RIFEX - Participa en sorteos seguros. Un número puede cambiar tu vida.",
};

export default function PublicLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
