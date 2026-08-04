"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { getEquipo, updateMiembroEquipo, crearMiembroEquipo } from "@/lib/mock-admin/store";

const ROLES = [
  { id: "superadmin", label: "Super Admin", color: "#F2B233" },
  { id: "operador", label: "Operador", color: "#60a5fa" },
  { id: "soporte", label: "Soporte", color: "#a78bfa" },
];

function formatFecha(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

export default function MockEquipoPage() {
  const { addToast } = useToast();
  const [equipo, setEquipo] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", rol: "operador" });

  function cargar() {
    setEquipo(getEquipo());
  }

  useEffect(() => {
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, []);

  function toggleActivo(m) {
    updateMiembroEquipo(m.id, { activo: !m.activo });
    addToast(`${m.nombre} ${m.activo ? "desactivado" : "activado"}`, "info");
  }

  function handleCrear(e) {
    e.preventDefault();
    if (!form.nombre || !form.email) {
      addToast("Completa nombre y email", "error");
      return;
    }
    crearMiembroEquipo(form);
    addToast("Miembro agregado", "success");
    setModal(false);
    setForm({ nombre: "", email: "", rol: "operador" });
  }

  const inputCls =
    "w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50";

  return (
    <div className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Equipo</h1>
          <p className="text-sm text-zinc-500 mt-1">Roles y permisos (demo)</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="px-4 py-2.5 bg-amber-500 text-zinc-950 font-semibold rounded-lg text-sm"
        >
          + Agregar miembro
        </button>
      </div>

      <div className="grid gap-3 mb-8">
        {ROLES.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
            <span className="text-sm text-zinc-300 font-medium">{r.label}</span>
            <span className="text-xs text-zinc-600 ml-auto">
              {equipo.filter((m) => m.rol === r.id).length} miembros
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {equipo.map((m) => {
          const rol = ROLES.find((r) => r.id === m.rol);
          return (
            <div
              key={m.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: `${rol?.color || "#666"}22`, color: rol?.color }}
              >
                {m.nombre.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{m.nombre}</p>
                <p className="text-sm text-zinc-500">{m.email}</p>
                <p className="text-xs text-zinc-600 mt-0.5">Último acceso: {formatFecha(m.ultimo_acceso)}</p>
              </div>
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${rol?.color}22`,
                  color: rol?.color,
                }}
              >
                {rol?.label}
              </span>
              <button
                onClick={() => toggleActivo(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  m.activo
                    ? "bg-green-500/20 text-green-400"
                    : "bg-zinc-700 text-zinc-400"
                }`}
              >
                {m.activo ? "Activo" : "Inactivo"}
              </button>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Nuevo miembro</h2>
            <form onSubmit={handleCrear} className="space-y-4">
              <input
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className={inputCls}
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
              <select
                value={form.rol}
                onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                className={inputCls}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-zinc-950 font-bold rounded-xl">
                  Agregar
                </button>
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 border border-zinc-600 text-zinc-400 rounded-xl">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
