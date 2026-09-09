import { useEffect, useMemo, useState, type FormEvent } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import AdminShell from "./AdminShell";
import LoginView from "./LoginView";
import ProductsPage from "./ProductsPage";

import DashboardPage from "./pages/DashboardPage";
import RegisterPage from "./pages/RegisterPage";
import MaintenancePage from "./pages/MaintenancePage";
import AccountingPage from "./pages/AccountingPage";
import TechniciansPage from "./pages/TechniciansPage";

import { periodRange, todayIso } from "./helpers";
import type {
  AccountingRow,
  AdminRow,
  EquipmentForm,
  Page,
  PeriodFilter,
  ServiceForm,
  StatusFilter,
  Technician,
  TechnicianForm,
} from "./types";

export default function AdminApp() {
  const [sessionReady, setSessionReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionEmail, setSessionEmail] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const [page, setPage] = useState<Page>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [rows, setRows] = useState<AdminRow[]>([]);
  const [accountingRows, setAccountingRows] = useState<AccountingRow[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [period, setPeriod] = useState<PeriodFilter>("MES");
  const [periodDate, setPeriodDate] = useState(todayIso());

  const [techForm, setTechForm] = useState<TechnicianForm>({
    fullName: "",
    phone: "",
    email: "",
  });

  const [form, setForm] = useState<ServiceForm>({
    fullName: "",
    phone: "",
    email: "",
    serviceDate: todayIso(),
    technicianId: "",
    amount: "",
    paymentMethod: "Efectivo",
    notes: "",
  });

  const [equipmentCount, setEquipmentCount] = useState(1);

  const [equipment, setEquipment] = useState<EquipmentForm[]>([
    {
      location: "Habitación principal",
      brand: "",
      equipmentType: "Split",
      recommendedMonths: "4",
    },
  ]);

  useEffect(() => {
    if (!supabase) {
      setSessionReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
      setSessionEmail(data.session?.user.email ?? "");
      setSessionReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
      setSessionEmail(session?.user.email ?? "");
      setSessionReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authenticated) void refreshAll();
  }, [authenticated]);

  useEffect(() => {
    if (authenticated && page === "accounting") void loadAccounting();
  }, [authenticated, page, period, periodDate]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : error.message,
      );
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  async function refreshAll() {
    if (!supabase) return;

    setLoading(true);

    const [dash, tech] = await Promise.all([
      supabase.rpc("admin_maintenance_dashboard_v2"),
      supabase.rpc("admin_technicians"),
    ]);

    if (!dash.error) setRows((dash.data ?? []) as AdminRow[]);
    if (!tech.error) setTechnicians((tech.data ?? []) as Technician[]);

    if (dash.error) {
      setSuccess(false);
      setMessage(`No se pudo actualizar mantenimientos: ${dash.error.message}`);
    } else if (tech.error) {
      setSuccess(false);
      setMessage(`No se pudieron actualizar técnicos: ${tech.error.message}`);
    }

    setLoading(false);
  }

  async function loadAccounting() {
    if (!supabase) return;

    const range = periodRange(period, periodDate);

    const { data, error } = await supabase.rpc("admin_service_accounting", {
      p_from: range.from,
      p_to: range.to,
    });

    if (error) {
      setSuccess(false);
      setMessage(`No se pudo cargar contabilidad: ${error.message}`);
      return;
    }

    setAccountingRows((data ?? []) as AccountingRow[]);
  }

  function changeEquipmentCount(next: number) {
    const count = Math.max(1, Math.min(12, next));
    setEquipmentCount(count);

    setEquipment((prev) => {
      const copy = [...prev];

      while (copy.length < count) {
        copy.push({
          location: `Zona ${copy.length + 1}`,
          brand: "",
          equipmentType: "Split",
          recommendedMonths: "4",
        });
      }

      return copy.slice(0, count);
    });
  }

  function updateEquipment(
    index: number,
    key: keyof EquipmentForm,
    value: string,
  ) {
    setEquipment((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }

  async function saveService(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    if (!form.fullName.trim() || (!form.phone.trim() && !form.email.trim())) {
      setSuccess(false);
      setMessage("Escribe el nombre y por lo menos un teléfono o correo.");
      return;
    }

    if (equipment.some((e) => !e.location.trim())) {
      setSuccess(false);
      setMessage("Cada equipo debe tener una habitación o zona.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.rpc("register_maintenance_service_v2", {
      p_full_name: form.fullName.trim(),
      p_phone: form.phone.trim() || null,
      p_email: form.email.trim() || null,
      p_service_date: form.serviceDate,
      p_technician_id: form.technicianId || null,
      p_amount: Number(form.amount || 0),
      p_payment_method: form.paymentMethod,
      p_notes: form.notes.trim() || null,
      p_equipment: equipment.map((e) => ({
        location: e.location.trim(),
        brand: e.brand.trim() || "Sin especificar",
        equipment_type: e.equipmentType,
        recommended_months: Number(e.recommendedMonths),
      })),
    });

    setSaving(false);

    if (error) {
      setSuccess(false);
      setMessage(`No se pudo guardar: ${error.message}`);
      return;
    }

    setSuccess(true);
    setMessage("Servicio registrado correctamente.");

    setForm({
      fullName: "",
      phone: "",
      email: "",
      serviceDate: todayIso(),
      technicianId: "",
      amount: "",
      paymentMethod: "Efectivo",
      notes: "",
    });

    setEquipmentCount(1);

    setEquipment([
      {
        location: "Habitación principal",
        brand: "",
        equipmentType: "Split",
        recommendedMonths: "4",
      },
    ]);

    await refreshAll();
  }

  async function createTechnician(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !techForm.fullName.trim()) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase.rpc("admin_create_technician", {
      p_full_name: techForm.fullName.trim(),
      p_phone: techForm.phone.trim() || null,
      p_email: techForm.email.trim() || null,
    });

    setSaving(false);

    if (error) {
      setSuccess(false);
      setMessage(error.message);
      return;
    }

    setSuccess(true);
    setMessage("Técnico registrado.");

    setTechForm({
      fullName: "",
      phone: "",
      email: "",
    });

    await refreshAll();
  }

  async function toggleTechnician(id: string, active: boolean) {
    if (!supabase) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase.rpc("admin_toggle_technician", {
      p_technician_id: id,
      p_active: active,
    });

    setSaving(false);

    if (error) {
      setSuccess(false);
      setMessage(`No se pudo actualizar el técnico: ${error.message}`);
      return;
    }

    setSuccess(true);
    setMessage(
      active
        ? "Técnico activado correctamente."
        : "Técnico inhabilitado correctamente.",
    );

    await refreshAll();
  }

  async function deleteTechnician(id: string, name: string) {
    if (!supabase) return;

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${name}?\n\nLos servicios históricos no se borrarán, pero quedarán sin técnico asignado.`,
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase.rpc("admin_delete_technician", {
      p_technician_id: id,
    });

    setSaving(false);

    if (error) {
      setSuccess(false);
      setMessage(`No se pudo eliminar el técnico: ${error.message}`);
      return;
    }

    setSuccess(true);
    setMessage("Técnico eliminado correctamente.");

    await refreshAll();
  }

  function navigate(next: Page) {
    setPage(next);
    setMobileMenuOpen(false);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((r) => {
      const text = [
        r.full_name,
        r.phone,
        r.email,
        r.brand,
        r.location,
        r.technician_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!term || text.includes(term)) &&
        (statusFilter === "TODOS" || r.status === statusFilter)
      );
    });
  }, [rows, search, statusFilter]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      ok: rows.filter((r) => r.status === "AL_DIA").length,
      next: rows.filter((r) => r.status === "PROXIMO").length,
      expired: rows.filter((r) => r.status === "VENCIDO").length,
    }),
    [rows],
  );

  const accountingTotal = useMemo(
    () => accountingRows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [accountingRows],
  );

  function exportAccountingCsv() {
    const lines = [
      [
        "Fecha",
        "Cliente",
        "Telefono",
        "Correo",
        "Equipos",
        "Monto RD$",
        "Metodo",
        "Tecnico",
        "Notas",
      ],
      ...accountingRows.map((r) => [
        r.service_date,
        r.full_name,
        r.phone ?? "",
        r.email ?? "",
        String(r.equipment_count),
        String(r.amount),
        r.payment_method,
        r.technician_name ?? "",
        r.notes ?? "",
      ]),
    ];

    const csv =
      "\uFEFF" +
      lines
        .map((row) =>
          row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
        )
        .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `frescotech-contabilidad-${periodDate}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  if (!sessionReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Cargando panel...
      </div>
    );
  }

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 p-6">
        <div className="max-w-lg rounded-3xl bg-white p-8 text-center">
          <h1 className="text-2xl font-bold">Falta configurar Supabase</h1>
          <p className="mt-3 text-slate-500">
            Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LoginView
        email={email}
        password={password}
        showPassword={showPassword}
        authLoading={authLoading}
        authMessage={authMessage}
        setEmail={setEmail}
        setPassword={setPassword}
        setShowPassword={setShowPassword}
        signIn={signIn}
      />
    );
  }

  return (
    <AdminShell
      page={page}
      sessionEmail={sessionEmail}
      mobileMenuOpen={mobileMenuOpen}
      alertCount={counts.next + counts.expired}
      message={message}
      success={success}
      navigate={navigate}
      setMobileMenuOpen={setMobileMenuOpen}
      signOut={signOut}
      refreshAll={refreshAll}
    >
      {page === "dashboard" && (
        <DashboardPage counts={counts} rows={rows} navigate={navigate} />
      )}

      {page === "register" && (
        <RegisterPage
          form={form}
          setForm={setForm}
          equipmentCount={equipmentCount}
          changeEquipmentCount={changeEquipmentCount}
          equipment={equipment}
          updateEquipment={updateEquipment}
          technicians={technicians}
          saveService={saveService}
          saving={saving}
        />
      )}

      {page === "maintenance" && (
        <MaintenancePage
          rows={filteredRows}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          loading={loading}
        />
      )}

      {page === "accounting" && (
        <AccountingPage
          rows={accountingRows}
          total={accountingTotal}
          period={period}
          setPeriod={setPeriod}
          periodDate={periodDate}
          setPeriodDate={setPeriodDate}
          exportCsv={exportAccountingCsv}
        />
      )}

      {page === "technicians" && (
        <TechniciansPage
          technicians={technicians}
          techForm={techForm}
          setTechForm={setTechForm}
          createTechnician={createTechnician}
          toggleTechnician={toggleTechnician}
          deleteTechnician={deleteTechnician}
          saving={saving}
        />
      )}

      {page === "products" && <ProductsPage />}
    </AdminShell>
  );
}
