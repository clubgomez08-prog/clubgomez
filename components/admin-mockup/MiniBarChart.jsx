"use client";

export default function MiniBarChart({ data, height = 120, color = "#B8E351" }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.ventas || d.value || 0), 1);

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const val = d.ventas ?? d.value ?? 0;
        const pct = (val / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{
                height: `${Math.max(pct, 4)}%`,
                backgroundColor: `${color}${i === data.length - 1 ? "" : "99"}`,
                minHeight: "4px",
              }}
              title={`$ ${val.toLocaleString("es-CO")}`}
            />
            <span className="text-[10px] text-zinc-500">{d.dia || d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
