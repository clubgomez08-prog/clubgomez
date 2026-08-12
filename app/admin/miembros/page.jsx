"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";

const LIME = "#B8E351";
const PAGE_SIZE_HINT = 20;

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** fecha_nacimiento suele venir como YYYY-MM-DD (date) */
function formatCumple(dateStr) {
  if (!dateStr) return "—";
  const raw = String(dateStr).slice(0, 10);
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return raw;
  return `${d}/${m}/${y}`;
}

function esCumpleHoy(dateStr) {
  if (!dateStr) return false;
  const raw = String(dateStr).slice(0, 10);
  const [, m, d] = raw.split("-");
  if (!m || !d) return false;
  const now = new Date();
  return (
    Number(m) === now.getMonth() + 1 && Number(d) === now.getDate()
  );
}

function badgeEstado(estado) {
  const map = {
    activo: "bg-green-500/20 text-green-400",
    pendiente: "bg-amber-500/20 text-amber-400",
    vencido: "bg-zinc-600/40 text-zinc-300",
    cancelado: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        map[estado] || "bg-zinc-700 text-zinc-300"
      }`}
    >
      {estado || "—"}
    </span>
  );
}

function ClavesDetalle({ m, periodo }) {
  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="text-xs text-zinc-500 mb-2">
        Claves del periodo {periodo}
        {m.fecha_nacimiento
          ? ` · Cumpleaños ${formatCumple(m.fecha_nacimiento)}`
          : ""}
      </p>
      {m.claves?.length ? (
        <div className="flex flex-wrap gap-2">
          {m.claves.map((c) => (
            <span
              key={c}
              className="px-2.5 py-1 rounded-md font-mono text-sm"
              style={{
                background: "rgba(184,227,81,0.12)",
                color: LIME,
                border: "1px solid rgba(184,227,81,0.35)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Sin claves en este periodo.</p>
      )}
      {m.membresia?.vence_en ? (
        <p className="text-xs text-zinc-500 mt-3">
          Membresía hasta {formatFecha(m.membresia.vence_en)}
        </p>
      ) : null}
    </div>
  );
}

export default function AdminMiembrosPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(1);
  const [periodo, setPeriodo] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);
  const [filtros, setFiltros] = useState({
    buscar: "",
    estado: "",
    page: 1,
  });
  const [buscarDraft, setBuscarDraft] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAdminAuthHeaders();
      const params = new URLSearchParams({
        buscar: filtros.buscar,
        estado: filtros.estado,
        page: String(filtros.page),
      });
      const res = await fetch(`/api/admin/miembros?${params}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar");
      setItems(data.miembros || []);
      setTotal(data.total ?? 0);
      setPaginas(data.paginas ?? 1);
      setPeriodo(data.periodo || "");
    } catch (err) {
      addToast(err.message || "Error al cargar clientes", "error");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filtros, addToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function aplicarBusqueda(e) {
    e.preventDefault();
    setFiltros((f) => ({ ...f, buscar: buscarDraft.trim(), page: 1 }));
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Clientes</h1>
          <p className="text-sm text-zinc-500">
            Datos de cada miembro: contacto, plan, cumpleaños y claves del periodo{" "}
            {periodo || "actual"}. Clic en una fila para ver las claves.
          </p>
        </div>
        <Link
          href="/admin/venta-fisica"
          className="px-4 py-2 rounded-lg text-sm font-bold shrink-0"
          style={{ background: LIME, color: "#050607" }}
        >
          + Venta física
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-5 items-end">
        <form onSubmit={aplicarBusqueda} className="flex gap-2 flex-wrap">
          <input
            value={buscarDraft}
            onChange={(e) => setBuscarDraft(e.target.value)}
            placeholder="Buscar nombre, email, cédula…"
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm min-w-[220px]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{ background: LIME, color: "#050607" }}
          >
            Buscar
          </button>
        </form>
        <select
          value={filtros.estado}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, estado: e.target.value, page: 1 }))
          }
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button
          type="button"
          onClick={cargar}
          className="px-3 py-2 rounded-lg text-sm border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
        >
          Actualizar
        </button>
        <span className="text-xs text-zinc-500 ml-auto">
          {total} cliente{total === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: LIME, borderTopColor: "transparent" }}
          />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-12 text-center text-zinc-500 text-sm">
          No hay clientes con estos filtros.
          <p className="mt-2 text-xs text-zinc-600">
            Aparecen al completar el checkout (cuenta + pago Bold) o al activar
            membresía manual.
          </p>
        </div>
      ) : (
        <>
        <div className="admin-table-desktop bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 860 }}>
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Cumpleaños
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Claves
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Alta
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => {
                  const abierto = expandido === m.id;
                  const cumpleHoy = esCumpleHoy(m.fecha_nacimiento);
                  return (
                    <Fragment key={m.id}>
                      <tr
                        className="border-b border-zinc-800 hover:bg-zinc-800/40 cursor-pointer"
                        onClick={() =>
                          setExpandido(abierto ? null : m.id)
                        }
                      >
                        <td className="px-4 py-3">
                          <p className="text-white text-sm font-medium">
                            {m.nombre || "—"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            CC {m.cedula || "—"}
                            {m.ciudad ? ` · ${m.ciudad}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">
                          <p className="truncate max-w-[180px]">{m.email}</p>
                          <p className="text-xs text-zinc-500">{m.telefono}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${
                              cumpleHoy ? "text-black px-2 py-1 rounded-md" : "text-zinc-200"
                            }`}
                            style={
                              cumpleHoy
                                ? { background: LIME }
                                : undefined
                            }
                          >
                            {formatCumple(m.fecha_nacimiento)}
                          </span>
                          {cumpleHoy ? (
                            <p className="text-[10px] mt-1 font-semibold" style={{ color: LIME }}>
                              Hoy
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {m.plan ? (
                            <span style={{ color: LIME }} className="font-semibold">
                              {m.plan.nombre}
                            </span>
                          ) : (
                            <span className="text-zinc-500">Sin membresía</span>
                          )}
                          {m.membresia?.estado ? (
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {m.membresia.estado}
                              {m.membresia.origen
                                ? ` · ${m.membresia.origen}`
                                : ""}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">{badgeEstado(m.estado)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300 font-mono">
                          {m.clavesCount || 0}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                          {formatFecha(m.created_at)}
                        </td>
                      </tr>
                      {abierto ? (
                        <tr className="border-b border-zinc-800 bg-zinc-950/60">
                          <td colSpan={7} className="px-4 py-4">
                            <ClavesDetalle m={m} periodo={periodo} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          <div className="admin-cards-mobile">
            {items.map((m) => {
              const abierto = expandido === m.id;
              const cumpleHoy = esCumpleHoy(m.fecha_nacimiento);
              return (
                <button
                  type="button"
                  key={m.id}
                  className="admin-client-card text-left w-full"
                  onClick={() => setExpandido(abierto ? null : m.id)}
                >
                  <div className="admin-client-card__top">
                    <div>
                      <div className="admin-client-card__name">
                        {m.nombre || "—"}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        CC {m.cedula || "—"}
                        {m.ciudad ? ` · ${m.ciudad}` : ""}
                      </p>
                    </div>
                    {badgeEstado(m.estado)}
                  </div>
                  <div className="admin-client-card__meta">
                    <span>{m.email || "—"}</span>
                    <span>{m.telefono || "—"}</span>
                    <span>
                      {m.plan?.nombre || "Sin membresía"} · {m.clavesCount || 0}{" "}
                      claves
                    </span>
                    <span>
                      Cumple {formatCumple(m.fecha_nacimiento)}
                      {cumpleHoy ? " · Hoy" : ""}
                    </span>
                  </div>
                  {abierto ? <ClavesDetalle m={m} periodo={periodo} /> : null}
                </button>
              );
            })}
          </div>
        </>
      )}

      {paginas > 1 ? (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            type="button"
            disabled={filtros.page <= 1}
            onClick={() =>
              setFiltros((f) => ({ ...f, page: Math.max(1, f.page - 1) }))
            }
            className="px-3 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-zinc-400">
            {filtros.page} / {paginas}
          </span>
          <button
            type="button"
            disabled={filtros.page >= paginas}
            onClick={() =>
              setFiltros((f) => ({
                ...f,
                page: Math.min(paginas, f.page + 1),
              }))
            }
            className="px-3 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      ) : null}

      <p className="text-xs text-zinc-600 mt-4">
        ~{PAGE_SIZE_HINT} por página. Clic en una fila para ver las claves.
      </p>
    </div>
  );
}
