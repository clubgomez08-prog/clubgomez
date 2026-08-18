"use client";

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

function yearOptions() {
  const now = new Date().getFullYear();
  const max = now - 12;
  const min = now - 100;
  const years = [];
  for (let y = max; y >= min; y -= 1) years.push(String(y));
  return years;
}

/**
 * Día / mes / año — evita el date picker nativo (flechitas mes a mes).
 * Emite YYYY-MM-DD con el mismo shape que un input (e.target.name / value).
 */
export default function DateOfBirthSelect({
  name = "fecha_nacimiento",
  value = "",
  onChange,
  required = false,
  selectStyle,
  selectClassName,
}) {
  const parsed = parseIso(value);
  const years = yearOptions();
  const maxDay = daysInMonth(parsed.year, parsed.month);

  function emit(next) {
    const y = next.year;
    const m = next.month;
    const d = next.day;
    const last = daysInMonth(y, m);
    const day = d && Number(d) > last ? String(last).padStart(2, "0") : d;
    const iso = y && m && day ? `${y}-${m}-${day}` : "";
    onChange?.({ target: { name, value: iso } });
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
      }}
    >
      <select
        aria-label="Día de nacimiento"
        className={selectClassName}
        style={selectClassName ? undefined : selectBase}
        required={required}
        value={parsed.day}
        onChange={(e) =>
          emit({ ...parsed, day: e.target.value.padStart(2, "0") })
        }
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
        required={required}
        value={parsed.month}
        onChange={(e) => emit({ ...parsed, month: e.target.value })}
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
        required={required}
        value={parsed.year}
        onChange={(e) => emit({ ...parsed, year: e.target.value })}
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
