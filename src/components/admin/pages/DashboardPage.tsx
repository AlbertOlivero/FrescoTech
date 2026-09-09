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

export default function DashboardPage({ counts, rows, navigate }: Props) {
  const cards = [
    ["Equipos registrados", counts.total, "text-brand-600", "bg-brand-50"],
    ["Al día", counts.ok, "text-emerald-600", "bg-emerald-50"],
    ["Próximos", counts.next, "text-amber-600", "bg-amber-50"],
    ["Vencidos", counts.expired, "text-red-600", "bg-red-50"],
  ] as const;

  const actions: Array<{
    label: string;
    page: Page;
    icon: ReactNode;
  }> = [
    { label: "Nuevo servicio", page: "register", icon: <IconPlus /> },
    { label: "Ver contabilidad", page: "accounting", icon: <IconMoney /> },
    { label: "Registrar técnico", page: "technicians", icon: <IconUsers /> },
    { label: "Administrar productos", page: "products", icon: <IconBox /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, color, bg]) => (
          <Card key={label} interactive className="p-5">
            <div className={`inline-flex rounded-xl px-3 py-1 text-xs font-semibold ${bg} ${color}`}>
              {label}
            </div>
            <div className={`mt-4 font-[Outfit] text-4xl font-800 ${color}`}>{value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-[Outfit] text-xl font-800">Seguimiento reciente</h2>
            <button
              onClick={() => navigate("maintenance")}
              className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-100 hover:shadow-md active:translate-y-0"
            >
              Ver todos
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {rows.slice(0, 6).map((r) => (
              <div
                key={r.equipment_id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/30 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{r.full_name}</div>
                  <div className="truncate text-sm text-slate-500">
                    {r.location} · {r.brand} {r.equipment_type}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}

            {rows.length === 0 && <Empty text="Aún no hay servicios registrados." />}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-[Outfit] text-xl font-800">Acciones rápidas</h2>

          <div className="mt-5 grid gap-3">
            {actions.map((action) => (
              <button
                key={action.page}
                onClick={() => navigate(action.page)}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left font-semibold transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:bg-brand-50 hover:shadow-lg active:translate-y-0"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700 transition-transform duration-200 group-hover:scale-110">
                  {action.icon}
                </span>
                <span className="flex-1">{action.label}</span>
                <IconChevron
                  size={17}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
