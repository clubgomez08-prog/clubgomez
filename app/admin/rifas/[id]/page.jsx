"use client";

import { useParams } from "next/navigation";
import FormRifa from "@/components/admin/FormRifa";

export default function EditarRifaPage() {
  const params = useParams();
  const { id } = params;

  return <FormRifa rifaId={id} />;
}
