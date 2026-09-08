import type { MaintenanceState } from "@/types/maintenance";

export function calculateMaintenanceStatus(
  lastMaintenance: string | null,
  recommendedMonths = 4,
): MaintenanceState {
  if (!lastMaintenance) return "VENCIDO";

  const last = new Date(`${lastMaintenance}T00:00:00`);
  if (Number.isNaN(last.getTime())) return "VENCIDO";

  const today = new Date();
  const months =
    (today.getFullYear() - last.getFullYear()) * 12 +
    (today.getMonth() - last.getMonth()) +
    (today.getDate() >= last.getDate() ? 0 : -1);

  const warningStart = Math.max(0, recommendedMonths - 1);
  if (months < warningStart) return "AL_DIA";
  if (months < recommendedMonths) return "PROXIMO";
  return "VENCIDO";
}
