"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlanesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/sorteos");
  }, [router]);
  return null;
}
