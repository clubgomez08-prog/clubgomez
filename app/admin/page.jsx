"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/admin/StatsCard";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    rifasActivas: 0,
    participantes: 0,
    ventasTotales: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarStats = async () => {
      try {
        // Rifas activas
        const { count: rifasActivas } = await supabaseBrowser
          .from("rifas")
          .select("*", { count: "exact", head: true })
          .eq("estado", "activa");

        // Total participantes con pago aprobado
        const { count: participantes } = await supabaseBrowser
          .from("participantes")
          .select("*", { count: "exact", head: true })
          .eq("estado_pago", "aprobado");

        // Ventas totales
        const { data: ventas } = await supabaseBrowser
          .from("participantes")
          .select("total_pagado")
          .eq("estado_pago", "aprobado");

        const ventasTotales =
          ventas?.reduce((acc, p) => acc + (Number(p.total_pagado) || 0), 0) ||
          0;

        setStats({
          rifasActivas: rifasActivas || 0,
          participantes: participantes || 0,
          ventasTotales,
        });
      } catch (err) {
        console.error("[Dashboard] Error:", err?.message);
      } finally {
        setCargando(false);
      }
    };
    cargarStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-8">Dashboard</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
        }}
      >
        <StatsCard
          title="Rifas activas"
          value={cargando ? "..." : stats.rifasActivas}
        />
        <StatsCard
          title="Participantes"
          value={cargando ? "..." : stats.participantes}
        />
        <StatsCard
          title="Ventas totales"
          value={
            cargando
              ? "..."
              : "$ " + stats.ventasTotales.toLocaleString("es-CO")
          }
        />
      </div>

      <div style={{ marginTop: "24px" }}>
        <p
          style={{
            color: "rgba(248,250,252,0.5)",
            fontSize: "12px",
            fontWeight: "600",
            margin: "0 0 10px",
            letterSpacing: "0.5px",
          }}
        >
          ACCESOS RÁPIDOS
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
          }}
        >
          {[
            {
              href: "/admin/rifas/nueva",
              icon: "🎯",
              label: "Nueva rifa",
              color: "#F2B233",
            },
            {
              href: "/admin/participantes",
              icon: "👥",
              label: "Participantes",
              color: "#22C55E",
            },
            {
              href: "/admin/sorteo",
              icon: "🏆",
              label: "Ejecutar sorteo",
              color: "#a78bfa",
            },
            {
              href: "/admin/rifas",
              icon: "📋",
              label: "Ver rifas",
              color: "#60a5fa",
            },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href}
              style={{
                backgroundColor: "#1a1a1a",
                border: `1px solid ${item.color}30`,
                borderRadius: "14px",
                padding: "16px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  fontSize: "24px",
                  backgroundColor: `${item.color}15`,
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  color: "#F8FAFC",
                  fontSize: "13px",
                  fontWeight: "600",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
