import { BUSINESS } from "@/config/business";
import type { QuoteCartItem } from "@/types/product";
import type { PublicEquipmentStatus } from "@/types/maintenance";

export function whatsappUrl(message: string) {
  return `https://wa.me/${BUSINESS.whatsappInternational}?text=${encodeURIComponent(message)}`;
}

export function buildProductQuoteMessage(items: QuoteCartItem[]) {
  const lines = [
    `❄️ *COTIZACIÓN DE EQUIPOS — ${BUSINESS.name}*`,
    "─────────────────────────────",
  ];
  items.forEach((item, index) => {
    lines.push(`${index + 1}. *${item.name}*`);
    lines.push(`   Categoría: ${item.category}`);
    if (item.btu) lines.push(`   Capacidad: ${item.btu.toLocaleString("es-DO")} BTU`);
    lines.push(`   Cantidad: ${item.quantity}`);
  });
  lines.push("─────────────────────────────");
  lines.push("Quiero confirmar disponibilidad, precio e instalación.");
  return lines.join("\n");
}

export function buildMaintenanceBookingMessage(equipment: PublicEquipmentStatus) {
  return [
    `🔧 *SOLICITUD DE MANTENIMIENTO — ${BUSINESS.name}*`,
    "─────────────────────────────",
    `Equipo: ${equipment.brand} ${equipment.equipment_type}`,
    `Ubicación: ${equipment.location}`,
    `Último mantenimiento: ${equipment.last_maintenance ?? "Sin registro"}`,
    `Estado: ${equipment.status.replace("_", " ")}`,
    "─────────────────────────────",
    "Quiero agendar el mantenimiento de este equipo.",
  ].join("\n");
}
