import type { AdminRow, StatusFilter } from "../types";
import { formatDate } from "../helpers";
import { Card, Empty, IconSearch, StatusBadge, inputClass } from "../ui";

interface Props {
  rows: AdminRow[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  loading: boolean;
}

export default function MaintenancePage({
  rows,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  loading,
}: Props) {
  const filters: StatusFilter[] = ["TODOS", "AL_DIA", "PROXIMO", "VENCIDO"];

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClass} pl-11`}
              placeholder="Buscar por nombre, teléfono, correo, zona o técnico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                  statusFilter === s
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                {s === "TODOS"
                  ? "Todos"
                  : s === "AL_DIA"
                    ? "Al día"
                    : s === "PROXIMO"
                      ? "Próximos"
                      : "Vencidos"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">Cliente</th>
              <th className="px-5 py-4">Equipo</th>
              <th className="px-5 py-4">Último servicio</th>
              <th className="px-5 py-4">Técnico</th>
              <th className="px-5 py-4">Estado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr
                key={r.equipment_id}
                className="transition-colors duration-200 hover:bg-brand-50/60"
              >
                <td className="px-5 py-4">
                  <div className="font-semibold">{r.full_name}</div>
                  <div className="text-xs text-slate-500">
                    {r.phone || r.email || "Sin contacto"}
                  </div>
                </td>

                <td className="px-5 py-4">
                  {r.brand} · {r.equipment_type}
                  <div className="text-xs text-slate-500">{r.location}</div>
                </td>

                <td className="px-5 py-4">{formatDate(r.last_maintenance)}</td>
                <td className="px-5 py-4">{r.technician_name || "Sin asignar"}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && rows.length === 0 && (
          <Empty text="No hay registros que coincidan con el filtro." />
        )}
      </div>
    </Card>
  );
}
