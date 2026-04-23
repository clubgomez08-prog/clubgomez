"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { getAdminAuthHeaders } from "@/lib/auth";

const LOGO_RIFEX_URL = "/logo-rifex.png";
const COL_GOLD_RGB = [242, 178, 51];
const COL_NAVY_RGB = [11, 31, 51];
const COL_TEXT_DARK_RGB = [7, 21, 33];

export default function VentaFisicaPage() {
  const [rifas, setRifas] = useState([]);
  const [loadingRifas, setLoadingRifas] = useState(true);

  const [form, setForm] = useState({
    rifa_id: "",
    nombre: "",
    cedula: "",
    telefono: "",
    ciudad: "",
    email: "",
    cantidad_boletos: 50,
    notas: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    fetch("/api/rifas")
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        setRifas(lista);
        const activas = lista.filter((r) => r.estado === "activa" || !r.estado);
        const primera = activas[0] || lista[0] || null;
        if (primera?.id) {
          setForm((prev) => ({ ...prev, rifa_id: primera.id }));
        }
      })
      .catch(() => setRifas([]))
      .finally(() => setLoadingRifas(false));
  }, []);

  function formatCOP(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  }

  function onChangeField(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "cantidad_boletos"
          ? value.replace(/[^\d]/g, "")
          : value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResultado(null);

    const cantidad = Number(form.cantidad_boletos);

    if (!form.rifa_id || !form.nombre.trim() || !form.cedula.trim()) {
      setError("Rifa, nombre y cédula son obligatorios.");
      return;
    }

    if (!Number.isFinite(cantidad) || cantidad < 50) {
      setError("La cantidad de boletos debe ser mayor o igual a 50.");
      return;
    }

    setSubmitting(true);
    try {
      const auth = await getAdminAuthHeaders();

      const res = await fetch("/api/admin/venta-fisica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...auth,
        },
        body: JSON.stringify({
          rifa_id: form.rifa_id,
          nombre: form.nombre.trim(),
          cedula: form.cedula.trim(),
          telefono: form.telefono.trim() || undefined,
          ciudad: form.ciudad.trim() || undefined,
          email: form.email.trim() || undefined,
          cantidad_boletos: cantidad,
          notas: form.notas.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setError(data?.error || "No se pudo generar el lote físico.");
        return;
      }

      setResultado({
        lote_id: data.lote_id,
        participante_id: data.participante_id,
        numeros: Array.isArray(data.numeros) ? data.numeros : [],
        nombre: form.nombre.trim(),
        cantidad_boletos: cantidad,
        total_pagado: data.total_pagado ?? 0,
      });
    } catch {
      setError("Error de conexión al generar el lote físico.");
    } finally {
      setSubmitting(false);
    }
  }

  function nuevaVenta() {
    setForm((prev) => ({
      ...prev,
      nombre: "",
      cedula: "",
      telefono: "",
      ciudad: "",
      email: "",
      cantidad_boletos: 50,
      notas: "",
    }));
    setResultado(null);
    setError("");
  }

  async function loadImageDataUrl(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar el logo");
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function generarPDF() {
    if (!resultado?.lote_id) return;

    const rifaNombre =
      rifas.find((r) => String(r.id) === String(form.rifa_id))?.nombre ||
      "Sorteo RIFEX";
    const nums = resultado.numeros || [];

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [216, 279],
    });

    const pageW = 216;
    const pageH = 279;
    const marginX = 14;
    const contentW = pageW - marginX * 2;

    const paintWhitePage = () => {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, "F");
    };

    paintWhitePage();

    let y = 12;

    try {
      const logoDataUrl = await loadImageDataUrl(LOGO_RIFEX_URL);
      const logoW = 52;
      const logoH = 16;
      const logoX = (pageW - logoW) / 2;
      doc.addImage(logoDataUrl, "PNG", logoX, y, logoW, logoH);
      y += logoH + 6;
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...COL_TEXT_DARK_RGB);
      doc.text("RIFEX", pageW / 2, y + 6, { align: "center" });
      y += 14;
    }

    doc.setDrawColor(...COL_GOLD_RGB);
    doc.setLineWidth(0.18);
    doc.line(marginX, y, pageW - marginX, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.8);
    doc.setTextColor(...COL_TEXT_DARK_RGB);
    const rifaLines = doc.splitTextToSize(rifaNombre, contentW);
    doc.text(rifaLines, pageW / 2, y, { align: "center" });
    y += rifaLines.length * 5 + 6;

    const loteStr = String(resultado.lote_id);
    const bandH = 11;
    doc.setFillColor(248, 249, 252);
    doc.setDrawColor(...COL_GOLD_RGB);
    doc.setLineWidth(0.28);
    doc.roundedRect(marginX, y, contentW, bandH, 1.6, 1.6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COL_GOLD_RGB);
    doc.text(loteStr, pageW / 2, y + 7.2, { align: "center" });
    y += bandH + 9;

    const labelRgb = [115, 115, 122];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...labelRgb);
    doc.text("Comprador", marginX, y);
    y += 4;
    doc.setFontSize(10.6);
    doc.setTextColor(...COL_TEXT_DARK_RGB);
    doc.text(resultado.nombre, marginX, y);
    y += 8;

    doc.setFontSize(8);
    doc.setTextColor(...labelRgb);
    doc.text("Boletos", marginX, y);
    y += 4;
    doc.setFontSize(10.6);
    doc.setTextColor(...COL_TEXT_DARK_RGB);
    doc.text(String(resultado.cantidad_boletos), marginX, y);
    y += 8;

    doc.setFontSize(8);
    doc.setTextColor(...labelRgb);
    doc.text("Total", marginX, y);
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(...COL_GOLD_RGB);
    doc.text(formatCOP(resultado.total_pagado), marginX, y);
    y += 11;

    doc.setDrawColor(...COL_GOLD_RGB);
    doc.setLineWidth(0.22);
    doc.line(marginX, y, pageW - marginX, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...COL_TEXT_DARK_RGB);
    doc.text(`Números asignados (${nums.length})`, marginX, y);
    y += 7;

    const cols = 5;
    const gap = 1.85;
    const cellW = (contentW - gap * (cols - 1)) / cols;
    const cellH = 7.35;

    const footerReserve = 28;
    const gridTopY = y;
    let gridY = gridTopY;

    doc.setFont("courier", "normal");
    doc.setFontSize(7.8);

    const drawFooter = (baseY) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COL_TEXT_DARK_RGB);
      const footerLines = [
        "WhatsApp: 3137453511",
        "Instagram: @clubrifex",
        "rifex.app",
      ];
      doc.text(footerLines, pageW / 2, baseY, { align: "center" });
    };

    if (nums.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Sin números en este lote.", marginX, gridY);
      gridY += 10;
    } else {
      for (let i = 0; i < nums.length; i++) {
        const col = i % cols;

        if (i > 0 && col === 0) {
          gridY += cellH + gap;
        }

        if (col === 0 && gridY + cellH > pageH - footerReserve) {
          drawFooter(pageH - 12);
          doc.addPage([216, 279], "portrait");
          paintWhitePage();
          gridY = 12;
          doc.setFont("courier", "normal");
          doc.setFontSize(7.8);
        }

        const x = marginX + col * (cellW + gap);

        doc.setDrawColor(...COL_GOLD_RGB);
        doc.setLineWidth(0.35);
        doc.setFillColor(...COL_NAVY_RGB);
        doc.roundedRect(x, gridY, cellW, cellH, 1.35, 1.35, "FD");

        doc.setTextColor(...COL_GOLD_RGB);
        const label = String(nums[i] ?? "").trim();
        doc.text(label, x + cellW / 2, gridY + cellH / 2 + 2.35, {
          align: "center",
        });
      }

      gridY += cellH + gap;
    }

    const footerAnchorY = Math.max(gridY + 12, pageH - 14);
    drawFooter(footerAnchorY);

    const safeName = String(resultado.lote_id).replace(/[^\w.-]+/g, "_");
    doc.save(`lote_${safeName}.pdf`);
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-white mb-4">Venta física</h1>

      {/* SECCIÓN 1 — FORMULARIO DE VENTA */}
      <section
        className="mb-4 rounded-xl border p-4"
        style={{
          backgroundColor: "#0B1F33",
          borderColor: "rgba(242,178,51,0.3)",
        }}
      >
        <p className="text-sm text-zinc-300 mb-4">
          Registra lotes vendidos fuera de la web y genera números al instante.
        </p>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3">
          <div>
            <label
              htmlFor="rifa_id"
              className="block text-sm mb-1"
              style={{ color: "rgba(248,250,252,0.7)" }}
            >
              Rifa
            </label>
            <select
              id="rifa_id"
              name="rifa_id"
              value={form.rifa_id}
              onChange={onChangeField}
              disabled={loadingRifas}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
            >
              <option value="">
                {loadingRifas ? "Cargando rifas..." : "Selecciona una rifa"}
              </option>
              {rifas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="nombre"
              className="block text-sm mb-1"
              style={{ color: "rgba(248,250,252,0.7)" }}
            >
              Nombre completo
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={onChangeField}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
            />
          </div>

          <div>
            <label
              htmlFor="cedula"
              className="block text-sm mb-1"
              style={{ color: "rgba(248,250,252,0.7)" }}
            >
              Cédula
            </label>
            <input
              id="cedula"
              name="cedula"
              type="text"
              value={form.cedula}
              onChange={onChangeField}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
            />
          </div>

          <div>
            <label
              htmlFor="telefono"
              className="block text-sm mb-1"
              style={{ color: "rgba(248,250,252,0.7)" }}
            >
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="text"
              value={form.telefono}
              onChange={onChangeField}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="ciudad"
              className="block text-sm mb-1"
              style={{ color: "rgba(248,250,252,0.7)" }}
            >
              Ciudad
            </label>
            <input
              id="ciudad"
              name="ciudad"
              type="text"
              value={form.ciudad}
              onChange={onChangeField}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm mb-1"
              style={{ color: "rgba(248,250,252,0.7)" }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChangeField}
              placeholder="Sin email — se usará sin-email@rifex.app"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="cantidad_boletos"
              className="block text-sm mb-1"
              style={{ color: "rgba(248,250,252,0.7)" }}
            >
              Cantidad de boletos
            </label>
            <input
              id="cantidad_boletos"
              name="cantidad_boletos"
              type="number"
              min={50}
              value={form.cantidad_boletos}
              onChange={onChangeField}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
            />
          </div>

          <div>
            <label
              htmlFor="notas"
              className="block text-sm mb-1"
              style={{ color: "rgba(248,250,252,0.7)" }}
            >
              Notas del lote
            </label>
            <input
              id="notas"
              name="notas"
              type="text"
              value={form.notas}
              onChange={onChangeField}
              placeholder="Ej: Lote vendido en feria Norte"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-3 px-4 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#F2B233",
              color: "#071521",
              fontWeight: 800,
            }}
          >
            {submitting ? "Generando..." : "🎟 Generar lote físico"}
          </button>

          {error ? (
            <p className="text-sm" style={{ color: "#f87171" }}>
              {error}
            </p>
          ) : null}
        </form>
      </section>

      {/* SECCIÓN 2 — RESULTADO */}
      {resultado ? (
        <section
          className="rounded-xl border p-4"
          style={{
            backgroundColor: "#0B1F33",
            borderColor: "rgba(242,178,51,0.3)",
          }}
        >
          <p className="text-sm text-zinc-300 mb-3">Lote generado correctamente</p>

          <p
            className="text-2xl font-extrabold mb-3"
            style={{ color: "#F2B233", letterSpacing: "0.4px" }}
          >
            {resultado.lote_id}
          </p>

          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/70 p-3">
              <p className="text-xs text-zinc-400">Nombre del comprador</p>
              <p className="text-white font-semibold">{resultado.nombre}</p>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/70 p-3">
              <p className="text-xs text-zinc-400">Cantidad de boletos</p>
              <p className="text-white font-semibold">{resultado.cantidad_boletos}</p>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/70 p-3">
              <p className="text-xs text-zinc-400">Total pagado</p>
              <p className="text-amber-400 font-semibold">
                {formatCOP(resultado.total_pagado)}
              </p>
            </div>
          </div>

          <p
            className="text-sm mb-2"
            style={{ color: "rgba(248,250,252,0.7)", fontWeight: 600 }}
          >
            Números asignados
          </p>

          {resultado.numeros.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {resultado.numeros.map((n) => (
                <div
                  key={n}
                  style={{
                    backgroundColor: "#0B1F33",
                    color: "#F2B233",
                    border: "1px solid rgba(242,178,51,0.5)",
                    borderRadius: "8px",
                    fontFamily: "Consolas, 'Courier New', monospace",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "center",
                    padding: "8px 6px",
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 mb-4">No se recibieron números.</p>
          )}

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={generarPDF}
              className="w-full rounded-lg py-3 px-4 border border-zinc-600 bg-zinc-800 text-white font-semibold"
            >
              🖨 Imprimir / Descargar PDF
            </button>

            <button
              type="button"
              onClick={nuevaVenta}
              className="w-full rounded-lg py-3 px-4"
              style={{
                backgroundColor: "#F2B233",
                color: "#071521",
                fontWeight: 800,
              }}
            >
              Nueva venta
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
