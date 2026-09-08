export type MaintenanceState = "AL_DIA" | "PROXIMO" | "VENCIDO";

export interface PublicEquipmentStatus {
  equipment_id: string;
  brand: string;
  equipment_type: string;
  location: string;
  last_maintenance: string | null;
  recommended_months: number;
  status: MaintenanceState;
}
