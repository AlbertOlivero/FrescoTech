import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { EquipmentForm, ServiceForm, Technician } from "../types";
import { Card, Field, inputClass, primaryButtonClass } from "../ui";

interface Props {
  form: ServiceForm;
  setForm: Dispatch<SetStateAction<ServiceForm>>;
  equipmentCount: number;
  changeEquipmentCount: (next: number) => void;
  equipment: EquipmentForm[];
  updateEquipment: (index: number, key: keyof EquipmentForm, value: string) => void;
  technicians: Technician[];
  saveService: (event: FormEvent) => void;
  saving: boolean;
}

export default function RegisterPage({
  form,
  setForm,
  equipmentCount,
  changeEquipmentCount,
  equipment,
  updateEquipment,
  technicians,
  saveService,
  saving,
}: Props) {
  return (
    <form onSubmit={saveService} className="space-y-6">
      <Card className="p-5 sm:p-7">
        <h2 className="font-[Outfit] text-xl font-800">Datos del cliente</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Nombre completo">
            <input
              className={inputClass}
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
            />
          </Field>

          <Field label="Teléfono / WhatsApp">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="809-000-0000"
            />
          </Field>

          <Field label="Correo">
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="cliente@correo.com"
            />
          </Field>

          <Field label="Fecha del servicio">
            <input
              className={inputClass}
              type="date"
              value={form.serviceDate}
              onChange={(e) => setForm((f) => ({ ...f, serviceDate: e.target.value }))}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[Outfit] text-xl font-800">Equipos / habitaciones</h2>
            <p className="mt-1 text-sm text-slate-500">
              Registra de 1 a 12 equipos para el mismo cliente.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2">
            <button
              type="button"
              onClick={() => changeEquipmentCount(equipmentCount - 1)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-xl font-bold transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md active:translate-y-0"
            >
              −
            </button>

            <div className="min-w-20 text-center">
              <div className="text-xs text-slate-400">Cantidad</div>
              <div className="font-[Outfit] text-xl font-800">{equipmentCount}</div>
            </div>

            <button
              type="button"
              onClick={() => changeEquipmentCount(equipmentCount + 1)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-xl font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg active:translate-y-0"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {equipment.map((eq, i) => (
            <div
              key={i}
              className="rounded-2xl border-2 border-slate-100 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <div className="mb-4 font-semibold">Equipo {i + 1}</div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Habitación o zona">
                  <input
                    className={inputClass}
                    value={eq.location}
                    onChange={(e) => updateEquipment(i, "location", e.target.value)}
                  />
                </Field>

                <Field label="Marca">
                  <input
                    className={inputClass}
                    value={eq.brand}
                    onChange={(e) => updateEquipment(i, "brand", e.target.value)}
                  />
                </Field>

                <Field label="Tipo">
                  <select
                    className={inputClass}
                    value={eq.equipmentType}
                    onChange={(e) => updateEquipment(i, "equipmentType", e.target.value)}
                  >
                    <option>Split</option>
                    <option>Inverter</option>
                    <option>Ventana</option>
                    <option>Central</option>
                    <option>Otro</option>
                  </select>
                </Field>

                <Field label="Frecuencia">
                  <select
                    className={inputClass}
                    value={eq.recommendedMonths}
                    onChange={(e) => updateEquipment(i, "recommendedMonths", e.target.value)}
                  >
                    <option value="3">Cada 3 meses</option>
                    <option value="4">Cada 4 meses</option>
                  </select>
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-7">
        <h2 className="font-[Outfit] text-xl font-800">Servicio y cobro</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Técnico">
            <select
              className={inputClass}
              value={form.technicianId}
              onChange={(e) => setForm((f) => ({ ...f, technicianId: e.target.value }))}
            >
              <option value="">Sin asignar / propietario</option>
              {technicians
                .filter((t) => t.active)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Monto cobrado (RD$)">
            <input
              className={inputClass}
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </Field>

          <Field label="Método de pago">
            <select
              className={inputClass}
              value={form.paymentMethod}
              onChange={(e) =>
                setForm((f) => ({ ...f, paymentMethod: e.target.value }))
              }
            >
              <option>Efectivo</option>
              <option>Transferencia</option>
              <option>Tarjeta</option>
              <option>Crédito</option>
              <option>Otro</option>
            </select>
          </Field>

          <Field label="Notas técnicas">
            <textarea
              className={`${inputClass} min-h-28 resize-y`}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <button disabled={saving} className={`${primaryButtonClass} w-full sm:w-auto`}>
            {saving
              ? "Guardando..."
              : `Guardar servicio (${equipmentCount} equipo${equipmentCount > 1 ? "s" : ""})`}
          </button>
        </div>
      </Card>
    </form>
  );
}
