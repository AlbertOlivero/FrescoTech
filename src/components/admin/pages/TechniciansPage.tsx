import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Technician, TechnicianForm } from "../types";
import {
  Card,
  Empty,
  Field,
  IconUsers,
  inputClass,
  primaryButtonClass,
} from "../ui";

interface Props {
  technicians: Technician[];
  techForm: TechnicianForm;
  setTechForm: Dispatch<SetStateAction<TechnicianForm>>;
  createTechnician: (event: FormEvent) => void;
  toggleTechnician: (id: string, active: boolean) => void;
  deleteTechnician: (id: string, name: string) => void;
  saving: boolean;
}

export default function TechniciansPage({
  technicians,
  techForm,
  setTechForm,
  createTechnician,
  toggleTechnician,
  deleteTechnician,
  saving,
}: Props) {
  const activeCount = technicians.filter((t) => t.active).length;
  const inactiveCount = technicians.length - activeCount;

  return (
    <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-100">
            <IconUsers size={21} />
          </div>

          <div>
            <h2 className="font-[Outfit] text-xl font-800">Registrar técnico</h2>
            <p className="mt-1 text-sm text-slate-500">
              Añade al personal que podrá ser asignado a los mantenimientos.
            </p>
          </div>
        </div>

        <form onSubmit={createTechnician} className="mt-6 space-y-4">
          <Field label="Nombre completo">
            <input
              className={inputClass}
              value={techForm.fullName}
              onChange={(e) =>
                setTechForm((f) => ({ ...f, fullName: e.target.value }))
              }
              placeholder="Nombre del técnico"
              required
            />
          </Field>

          <Field label="Teléfono">
            <input
              className={inputClass}
              value={techForm.phone}
              onChange={(e) =>
                setTechForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </Field>

          <Field label="Correo">
            <input
              className={inputClass}
              type="email"
              value={techForm.email}
              onChange={(e) =>
                setTechForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </Field>

          <button disabled={saving} className={`${primaryButtonClass} w-full`}>
            {saving ? "Procesando..." : "Guardar técnico"}
          </button>
        </form>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-[Outfit] text-xl font-800">Equipo técnico</h2>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {activeCount} activos
            </span>

            {inactiveCount > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {inactiveCount} inactivos
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {technicians.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-200 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{t.full_name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {t.phone || "Sin teléfono"}
                  </div>
                  <div className="truncate text-sm text-slate-500">
                    {t.email || "Sin correo"}
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    t.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {t.active ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => toggleTechnician(t.id, !t.active)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                    t.active
                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {t.active ? "Inhabilitar" : "Activar"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => deleteTechnician(t.id, t.full_name)}
                  className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-md active:translate-y-0"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {technicians.length === 0 && (
            <Empty text="Todavía no has registrado técnicos." />
          )}
        </div>
      </Card>
    </div>
  );
}
