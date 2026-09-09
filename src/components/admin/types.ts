export type Page =
  | "dashboard"
  | "register"
  | "maintenance"
  | "accounting"
  | "technicians"
  | "products";

export type MaintenanceStatus = "AL_DIA" | "PROXIMO" | "VENCIDO";
export type StatusFilter = "TODOS" | MaintenanceStatus;
export type PeriodFilter = "DIA" | "MES" | "ANO";

export interface AdminRow {
  customer_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  equipment_id: string;
  brand: string;
  equipment_type: string;
  location: string;
  last_maintenance: string | null;
  recommended_months: number;
  status: MaintenanceStatus;
  technician_name: string | null;
}

export interface AccountingRow {
  visit_id: string;
  service_date: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  equipment_count: number;
  amount: number;
  payment_method: string;
  technician_name: string | null;
  notes: string | null;
}

export interface Technician {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
}

export interface EquipmentForm {
  location: string;
  brand: string;
  equipmentType: string;
  recommendedMonths: string;
}

export interface ServiceForm {
  fullName: string;
  phone: string;
  email: string;
  serviceDate: string;
  technicianId: string;
  amount: string;
  paymentMethod: string;
  notes: string;
}

export interface TechnicianForm {
  fullName: string;
  phone: string;
  email: string;
}
