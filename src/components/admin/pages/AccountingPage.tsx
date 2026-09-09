import type { AccountingRow, PeriodFilter } from "../types";
import { formatDate, formatMoney } from "../helpers";
import { Card, Empty, IconDownload, inputClass } from "../ui";

interface Props {
  rows: AccountingRow[];
  total: number;
  period: PeriodFilter;
  setPeriod: (value: PeriodFilter) => void;
  periodDate: string;
  setPeriodDate: (value: string) => void;
  exportCsv: () => void;
}

export default function AccountingPage({
  rows,
  total,
  period,
  setPeriod,
  periodDate,
  setPeriodDate,
  exportCsv,
}: Props) {
  const options: Array<[PeriodFilter, string]> = [
    ["DIA", "Día"],
    ["MES", "Mes"],
    ["ANO", "Año"],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card interactive className="p-5">
          <div className="text-sm text-slate-500">Ingresos del período</div>
          <div className="mt-2 font-[Outfit] text-3xl font-800 text-emerald-600">
            {formatMoney(total)}
          </div>
        </Card>

        <Card interactive className="p-5">
          <div className="text-sm text-slate-500">Servicios registrados</div>
          <div className="mt-2 font-[Outfit] text-3xl font-800 text-brand-600">
            {rows.length}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {options.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                    period === key
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className={inputClass}
                type="date"
                value={periodDate}
                onChange={(e) => setPeriodDate(e.target.value)}
              />

              <button
                onClick={exportCsv}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg active:translate-y-0"
              >
                <IconDownload /> Descargar Excel (CSV)
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Equipos</th>
                <th className="px-5 py-4">Técnico</th>
                <th className="px-5 py-4">Método</th>
                <th className="px-5 py-4 text-right">Monto</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr
                  key={r.visit_id}
                  className="transition-colors duration-200 hover:bg-emerald-50/60"
                >
                  <td className="px-5 py-4">{formatDate(r.service_date)}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{r.full_name}</div>
                    <div className="text-xs text-slate-500">{r.phone || r.email}</div>
                  </td>
                  <td className="px-5 py-4">{r.equipment_count}</td>
                  <td className="px-5 py-4">
                    {r.technician_name || "Propietario / sin asignar"}
                  </td>
                  <td className="px-5 py-4">{r.payment_method}</td>
                  <td className="px-5 py-4 text-right font-bold text-emerald-700">
                    {formatMoney(Number(r.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && <Empty text="No hay servicios en este período." />}
        </div>
      </Card>
    </div>
  );
}
