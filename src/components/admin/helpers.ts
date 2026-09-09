import type { Page, PeriodFilter } from "./types";

export function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(value: string | null) {
  if (!value) return "Sin registro";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : new Intl.DateTimeFormat("es-DO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function periodRange(kind: PeriodFilter, anchor: string) {
  const base = anchor ? new Date(`${anchor}T12:00:00`) : new Date();

  let from: Date;
  let to: Date;

  if (kind === "DIA") {
    from = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    to = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  } else if (kind === "MES") {
    from = new Date(base.getFullYear(), base.getMonth(), 1);
    to = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  } else {
    from = new Date(base.getFullYear(), 0, 1);
    to = new Date(base.getFullYear(), 11, 31);
  }

  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

  return { from: iso(from), to: iso(to) };
}

export const pageTitles: Record<Page, [string, string]> = {
  dashboard: ["Dashboard", "Resumen general de tu operación"],
  register: ["Registrar servicio", "Guarda un mantenimiento y varios equipos del mismo cliente"],
  maintenance: ["Mantenimientos", "Consulta clientes, equipos y próximos vencimientos"],
  accounting: ["Contabilidad", "Ingresos por servicios con filtros por día, mes y año"],
  technicians: ["Técnicos", "Administra el personal asignado a los mantenimientos"],
  products: ["Productos", "Administra el catálogo que se mostrará en la página"],
};
