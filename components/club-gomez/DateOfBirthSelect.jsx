"use client";

import { useLayoutEffect, useRef, useState } from "react";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function daysInMonth(year, month) {
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

function parseIso(value) {
  const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { year: "", month: "", day: "" };
  return { year: m[1], month: m[2], day: m[3] };
}

function toIso(parts) {
  const y = parts.year;
  const m = parts.month;
  let d = parts.day;
  if (!y || !m || !d) return "";
  const last = daysInMonth(y, m);
  if (Number(d) > last) d = String(last).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function clampParts(prev, partial) {
  const next = { ...prev, ...partial };
  const last = daysInMonth(next.year, next.month);
  if (next.day && Number(next.day) > last) {
    next.day = String(last).padStart(2, "0");
  }
  return next;
}

function yearOptions() {
  const now = new Date().getFullYear();
  const max = now - 12;
  const min = now - 100;
  const years = [];
  for (let y = max; y >= min; y -= 1) years.push(String(y));
  return years;
}

/**
 * Día / mes / año con estado local (no se borra al elegir solo una parte).
 * Emite YYYY-MM-DD cuando los 3 están listos.
 */
export default function DateOfBirthSelect({
  name = "fecha_nacimiento",
  value = "",
  onChange,
  required: _required = false,
  selectStyle,
  selectClassName,
}) {
  const [parts, setParts] = useState(() => parseIso(value));
  const onChangeRef = useRef(onChange);
  const years = yearOptions();
  const maxDay = daysInMonth(parts.year, parts.month);
  const iso = toIso(parts);

  onChangeRef.current = onChange;

  // Padre trae ISO completa (sesión precargada)
  useLayoutEffect(() => {
    if (!value) return;
    const next = parseIso(value);
    if (!next.year) return;
    setParts((prev) => {
      if (
        prev.year === next.year &&
        prev.month === next.month &&
        prev.day === next.day
      ) {
        return prev;
      }
      return next;
    });
  }, [value]);

  // Solo depende de iso/value/name — no de onChange (evita bucles por identidad)
  useLayoutEffect(() => {
    if (iso === value) return;
    if (!iso && !value) return;
    onChangeRef.current?.({ target: { name, value: iso } });
  }, [iso, name, value]);

  function update(partial) {
    setParts((prev) => clampParts(prev, partial));
  }

  const selectBase = {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    appearance: "none",
    WebkitAppearance: "none",
    backgroundColor: "#0a0c08",
    border: "1.5px solid rgba(184, 227, 81, 0.35)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    padding: "12px 10px",
    fontFamily: "inherit",
    ...selectStyle,
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.4fr 1fr",
        gap: 8,
        position: "relative",
      }}
    >
      <input type="hidden" name={name} value={iso} readOnly />

      <select
        aria-label="Día de nacimiento"
        className={selectClassName}
        style={selectClassName ? undefined : selectBase}
        value={parts.day}
        onChange={(e) => {
          const v = e.target.value;
          update({ day: v ? v.padStart(2, "0") : "" });
        }}
      >
        <option value="">Día</option>
        {Array.from({ length: maxDay }, (_, i) => {
          const n = String(i + 1).padStart(2, "0");
          return (
            <option key={n} value={n}>
              {i + 1}
            </option>
          );
        })}
      </select>

      <select
        aria-label="Mes de nacimiento"
        className={selectClassName}
        style={selectClassName ? undefined : selectBase}
        value={parts.month}
        onChange={(e) => update({ month: e.target.value })}
      >
        <option value="">Mes</option>
        {MESES.map((label, i) => {
          const n = String(i + 1).padStart(2, "0");
          return (
            <option key={n} value={n}>
              {label}
            </option>
          );
        })}
      </select>

      <select
        aria-label="Año de nacimiento"
        className={selectClassName}
        style={selectClassName ? undefined : selectBase}
        value={parts.year}
        onChange={(e) => update({ year: e.target.value })}
      >
        <option value="">Año</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
