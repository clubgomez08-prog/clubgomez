"use client";

import { useEffect, useRef, useState } from "react";

const LIME = "#B8E351";

const MESES = [
  { n: 1, corto: "Ene", largo: "Enero" },
  { n: 2, corto: "Feb", largo: "Febrero" },
  { n: 3, corto: "Mar", largo: "Marzo" },
  { n: 4, corto: "Abr", largo: "Abril" },
  { n: 5, corto: "May", largo: "Mayo" },
  { n: 6, corto: "Jun", largo: "Junio" },
  { n: 7, corto: "Jul", largo: "Julio" },
  { n: 8, corto: "Ago", largo: "Agosto" },
  { n: 9, corto: "Sep", largo: "Septiembre" },
  { n: 10, corto: "Oct", largo: "Octubre" },
  { n: 11, corto: "Nov", largo: "Noviembre" },
  { n: 12, corto: "Dic", largo: "Diciembre" },
];

function parsePeriodo(value) {
  const raw = String(value || "");
  const [y, m] = raw.split("-");
  const year = Number(y) || new Date().getFullYear();
  const month = Math.min(12, Math.max(1, Number(m) || 1));
  return { year, month };
}

function formatPeriodoLabel(value) {
  const { year, month } = parsePeriodo(value);
  const mes = MESES.find((x) => x.n === month);
  return `${mes?.largo || "Mes"} ${year}`;
}

export default function PeriodoPicker({ value, onChange, label = "Periodo" }) {
  const { year: y0, month: m0 } = parsePeriodo(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(y0);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function pick(month) {
    const mm = String(month).padStart(2, "0");
    onChange?.(`${viewYear}-${mm}`);
    setOpen(false);
  }

  function irEsteMes() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    onChange?.(`${y}-${m}`);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative inline-flex flex-col gap-1.5">
      <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
        {label}
      </span>

      <button
        type="button"
        onClick={() =>
          setOpen((v) => {
            const next = !v;
            if (next) setViewYear(parsePeriodo(value).year);
            return next;
          })
        }
        aria-expanded={open}
        className="inline-flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors"
        style={{
          background: "#0c0c0c",
          border: open
            ? `1.5px solid ${LIME}`
            : "1px solid rgba(184,227,81,0.22)",
          boxShadow: open ? "0 0 0 3px rgba(184,227,81,0.12)" : "none",
          minWidth: 220,
        }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
          style={{
            background: "rgba(184,227,81,0.12)",
            color: LIME,
          }}
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="5"
              width="18"
              height="16"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M3 10h18"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M8 3v4M16 3v4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-white truncate">
            {formatPeriodoLabel(value)}
          </span>
          <span className="block text-[11px] text-zinc-500 font-mono">
            {value || "YYYY-MM"}
          </span>
        </span>
        <span
          className="text-zinc-500 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[280px] rounded-2xl p-3"
          style={{
            background: "#111111",
            border: "1px solid rgba(184,227,81,0.28)",
            boxShadow:
              "0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(184,227,81,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="h-8 w-8 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white"
              aria-label="Año anterior"
            >
              ‹
            </button>
            <p
              className="text-sm font-bold tracking-wide"
              style={{ color: LIME }}
            >
              {viewYear}
            </p>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="h-8 w-8 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white"
              aria-label="Año siguiente"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MESES.map((mes) => {
              const selected = viewYear === y0 && mes.n === m0;
              return (
                <button
                  key={mes.n}
                  type="button"
                  onClick={() => pick(mes.n)}
                  className="rounded-xl py-2.5 text-sm font-semibold transition-colors"
                  style={
                    selected
                      ? {
                          background: LIME,
                          color: "#050607",
                        }
                      : {
                          background: "rgba(255,255,255,0.03)",
                          color: "rgba(255,255,255,0.82)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor =
                        "rgba(184,227,81,0.45)";
                      e.currentTarget.style.background =
                        "rgba(184,227,81,0.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.06)";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.03)";
                    }
                  }}
                >
                  {mes.corto}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 flex items-center justify-between gap-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={irEsteMes}
              className="text-xs font-bold px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(184,227,81,0.14)",
                color: LIME,
              }}
            >
              Este mes
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
