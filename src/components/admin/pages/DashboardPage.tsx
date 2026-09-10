import type { ReactNode } from "react";
import type { AdminRow, Page } from "../types";
import {
  Card,
  Empty,
  IconBox,
  IconChevron,
  IconMoney,
  IconPlus,
  IconUsers,
  StatusBadge,
} from "../ui";

interface Props {
  counts: { total: number; ok: number; next: number; expired: number };
  rows: AdminRow[];
  navigate: (page: Page) => void;
}

function formatDate(value: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function DashboardPage({ counts, rows, navigate }: Props) {
  const cards = [
    {
      label: "Equipos registrados",
      value: counts.total,
      detail: "Total bajo seguimiento",
      accent: "text-brand-700",
      iconBg: "bg-brand-50 text-brand-700",
      icon: <IconBox />,
    },
    {
      label: "Al día",
      value: counts.ok,
      detail: "Mantenimiento vigente",
      accent: "text-emerald-700",
      iconBg: "bg-emerald-50 text-emerald-700",
      icon: <span className="text-lg font-black">✓</span>,
    },
    {
      label: "Próximos",
      value: counts.next,
      detail: "Requieren atención pronto",
      accent: "text-amber-700",
      iconBg: "bg-amber-50 text-amber-700",
      icon: <span className="text-lg font-black">!</span>,
    },
    {
      label: "Vencidos",
      value: counts.expired,
      detail: "Necesitan seguimiento",
      accent: "text-red-700",
      iconBg: "bg-red-50 text-red-700",
      icon: <span className="text-lg font-black">!</span>,
    },
  ];

  const actions: Array<{ label: string; page: Page; icon: ReactNode }> = [
    { label: "Nuevo servicio", page: "register", icon: <IconPlus /> },
    { label: "Ver contabilidad", page: "accounting", icon: <IconMoney /> },
    { label: "Registrar técnico", page: "technicians", icon: <IconUsers /> },
    { label: "Administrar productos", page: "products", icon: <IconBox /> },
  ];

  return (
    <div className="space-y-7">
      <section>
        <div className="mb-5">
          <p className="text-sm font-semibold text-brand-600">Panel administrativo</p>
          <h2 className="mt-1 font-[Outfit] text-2xl font-800 tracking-tight text-slate-950 sm:text-3xl">
            Resumen general de tu operación
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Estado actual de los equipos y mantenimientos registrados en Nexter Ingeniería.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label} interactive className="overflow-hidden p-0">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                    <div className={`mt-2 font-[Outfit] text-4xl font-800 tracking-tight ${card.accent}`}>
                      {card.value}
                    </div>
                  </div>
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${card.iconBg}`}>
                    {card.icon}
                  </span>
                </div>
                <p className="mt-4 text-xs font-medium text-slate-400">{card.detail}</p>
              </div>
              <div className={`h-1 w-full ${card.iconBg.split(" ")[0]}`} />
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,.45fr)]">
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-[Outfit] text-xl font-800 text-slate-950">
                Mantenimientos próximos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Seguimiento reciente de los equipos registrados.
              </p>
            </div>
            <button
              onClick={() => navigate("maintenance")}
              className="self-start rounded-xl bg-brand-50 px-3.5 py-2 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-100 sm:self-auto"
            >
              Ver todos
            </button>
          </div>

          {rows.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">
                      <th className="px-6 py-3.5">Cliente</th>
                      <th className="px-4 py-3.5">Equipo</th>
                      <th className="px-4 py-3.5">Último mantenimiento</th>
                      <th className="px-4 py-3.5">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 6).map((r) => (
                      <tr key={r.equipment_id} className="transition-colors hover:bg-brand-50/30">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{r.full_name}</div>
                          <div className="mt-0.5 text-xs text-slate-400">{r.location}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-700">
                            {r.brand} {r.equipment_type}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            Cada {r.recommended_months} meses
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-slate-600">
                          {formatDate(r.last_maintenance)}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {rows.slice(0, 6).map((r) => (
                  <div key={r.equipment_id} className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-800">{r.full_name}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{r.location}</div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-sm">
                      <div className="font-medium text-slate-700">
                        {r.brand} {r.equipment_type}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Último mantenimiento: {formatDate(r.last_maintenance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-6">
              <Empty text="Aún no hay servicios registrados." />
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div>
            <h2 className="font-[Outfit] text-xl font-800 text-slate-950">Acciones rápidas</h2>
            <p className="mt-1 text-sm text-slate-500">Accesos frecuentes del sistema.</p>
          </div>

          <div className="mt-5 grid gap-3">
            {actions.map((action) => (
              <button
                key={action.page}
                onClick={() => navigate(action.page)}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-md"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 transition-transform group-hover:scale-105">
                  {action.icon}
                </span>
                <span className="flex-1 text-sm">{action.label}</span>
                <IconChevron
                  size={16}
                  className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-600"
                />
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/70 p-4">
            <div className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">
              Seguimiento
            </div>
            <p className="mt-2 text-sm leading-6 text-orange-900/70">
              Tienes <strong>{counts.next + counts.expired}</strong> equipos próximos o vencidos que requieren atención.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
