"use client";

const iconos = {
  pago_aprobado: "✅",
  pago_rechazado: "❌",
  venta_fisica: "🧾",
  rifa_creada: "🎯",
  rifa_editada: "✏️",
  rifa_eliminada: "🗑️",
  sorteo: "🏆",
  campana: "📣",
  landing: "🖼️",
  equipo: "👤",
  automatizacion: "⚡",
};

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function ActivityFeed({ items, limit }) {
  const list = limit ? items.slice(0, limit) : items;

  if (!list.length) {
    return <p className="text-sm text-zinc-500 py-4 text-center">Sin actividad reciente</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/40 border border-zinc-800/80 hover:bg-zinc-800/60 transition-colors"
        >
          <span className="text-lg shrink-0">{iconos[a.tipo] || "📋"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-200 leading-snug">{a.detalle}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {a.usuario} · {formatFecha(a.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
