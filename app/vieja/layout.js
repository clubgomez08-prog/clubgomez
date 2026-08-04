import { Suspense } from "react";

export const metadata = {
  title: "RIFEX (versión anterior) - Landing",
  description: "Landing RIFEX anterior conservada en /vieja",
};

export default function ViejaLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
