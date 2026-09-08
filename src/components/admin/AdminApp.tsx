import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Page = "dashboard" | "register" | "maintenance" | "accounting" | "technicians";
type MaintenanceStatus = "AL_DIA" | "PROXIMO" | "VENCIDO";
type StatusFilter = "TODOS" | MaintenanceStatus;
type PeriodFilter = "DIA" | "MES" | "ANO";

interface AdminRow {
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

interface AccountingRow {
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

interface Technician {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
}

interface EquipmentForm {
  location: string;
  brand: string;
  equipmentType: string;
  recommendedMonths: string;
}

interface IconProps {
  size?: number;
  className?: string;
}

function SvgIcon({ size = 20, className = "", children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const IconSnowflake = (p: IconProps) => <SvgIcon {...p}><path d="M12 2v20M4.9 6.1l14.2 11.8M4.9 17.9 19.1 6.1"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></SvgIcon>;
const IconGrid = (p: IconProps) => <SvgIcon {...p}><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></SvgIcon>;
const IconPlus = (p: IconProps) => <SvgIcon {...p}><path d="M12 5v14M5 12h14"/></SvgIcon>;
const IconWrench = (p: IconProps) => <SvgIcon {...p}><path d="M14.7 6.3a4 4 0 0 0-5-5L7.8 3.2l3 3L12.7 4.3a4 4 0 0 0 2 5L6 18l-2 2 2 2 2-2 8.7-8.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4"/></SvgIcon>;
const IconMoney = (p: IconProps) => <SvgIcon {...p}><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h.01M17 15h.01M12 9v6M10 11h3a1 1 0 0 1 0 2h-3"/></SvgIcon>;
const IconUsers = (p: IconProps) => <SvgIcon {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M18 14a5 5 0 0 1 3 4.6"/></SvgIcon>;
const IconSearch = (p: IconProps) => <SvgIcon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></SvgIcon>;
const IconLogout = (p: IconProps) => <SvgIcon {...p}><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></SvgIcon>;
const IconCalendar = (p: IconProps) => <SvgIcon {...p}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></SvgIcon>;
const IconMenu = (p: IconProps) => <SvgIcon {...p}><path d="M4 7h16M4 12h16M4 17h16"/></SvgIcon>;
const IconDownload = (p: IconProps) => <SvgIcon {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></SvgIcon>;
const IconBell = (p: IconProps) => <SvgIcon {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></SvgIcon>;
const IconChevron = (p: IconProps) => <SvgIcon {...p}><path d="m9 18 6-6-6-6"/></SvgIcon>;
const IconEye = (p: IconProps) => <SvgIcon {...p}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></SvgIcon>;
const IconEyeOff = (p: IconProps) => <SvgIcon {...p}><path d="m3 3 18 18M10.6 6.2A9.4 9.4 0 0 1 12 6c6.5 0 10 6 10 6a18.3 18.3 0 0 1-3 3.8M6.6 6.6C3.7 8.3 2 12 2 12s3.5 6 10 6a9.7 9.7 0 0 0 4-.8"/></SvgIcon>;

function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return "Sin registro";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(value || 0);
}

function statusLabel(s: MaintenanceStatus) {
  return s === "AL_DIA" ? "Al día" : s === "PROXIMO" ? "Próximo" : "Vencido";
}

function periodRange(kind: PeriodFilter, anchor: string) {
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
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: iso(from), to: iso(to) };
}

function pageTitle(page: Page) {
  return {
    dashboard: ["Dashboard", "Resumen general de tu operación"],
    register: ["Registrar servicio", "Guarda un mantenimiento y varios equipos del mismo cliente"],
    maintenance: ["Mantenimientos", "Consulta clientes, equipos y próximos vencimientos"],
    accounting: ["Contabilidad", "Ingresos por servicios con filtros por día, mes y año"],
    technicians: ["Técnicos", "Registra quién realiza cada mantenimiento"],
  }[page];
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}</label>;
}

const inputClass = "w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-all duration-200 hover:border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

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

  const [techForm, setTechForm] = useState({ fullName: "", phone: "", email: "" });

  const [form, setForm] = useState({
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
  const [equipment, setEquipment] = useState<EquipmentForm[]>([{ location: "Habitación principal", brand: "", equipmentType: "Split", recommendedMonths: "4" }]);

  useEffect(() => {
    if (!supabase) { setSessionReady(true); return; }
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

  useEffect(() => { if (authenticated) void refreshAll(); }, [authenticated]);
  useEffect(() => { if (authenticated && page === "accounting") void loadAccounting(); }, [authenticated, page, period, periodDate]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setAuthLoading(true); setAuthMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setAuthLoading(false);
    if (error) setAuthMessage(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : error.message);
  }

  async function signOut() { await supabase?.auth.signOut(); }

  async function refreshAll() {
    if (!supabase) return;
    setLoading(true);
    const [dash, tech] = await Promise.all([
      supabase.rpc("admin_maintenance_dashboard_v2"),
      supabase.rpc("admin_technicians"),
    ]);
    if (!dash.error) setRows((dash.data ?? []) as AdminRow[]);
    if (!tech.error) setTechnicians((tech.data ?? []) as Technician[]);
    setLoading(false);
  }

  async function loadAccounting() {
    if (!supabase) return;
    const range = periodRange(period, periodDate);
    const { data, error } = await supabase.rpc("admin_service_accounting", { p_from: range.from, p_to: range.to });
    if (!error) setAccountingRows((data ?? []) as AccountingRow[]);
  }

  function changeEquipmentCount(next: number) {
    const count = Math.max(1, Math.min(12, next));
    setEquipmentCount(count);
    setEquipment((prev) => {
      const copy = [...prev];
      while (copy.length < count) copy.push({ location: `Zona ${copy.length + 1}`, brand: "", equipmentType: "Split", recommendedMonths: "4" });
      return copy.slice(0, count);
    });
  }

  function updateEquipment(index: number, key: keyof EquipmentForm, value: string) {
    setEquipment((prev) => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  async function saveService(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    if (!form.fullName.trim() || (!form.phone.trim() && !form.email.trim())) {
      setSuccess(false); setMessage("Escribe el nombre y por lo menos un teléfono o correo."); return;
    }
    if (equipment.some((e) => !e.location.trim())) {
      setSuccess(false); setMessage("Cada equipo debe tener una habitación o zona."); return;
    }
    setSaving(true); setMessage("");
    const { error } = await supabase.rpc("register_maintenance_service_v2", {
      p_full_name: form.fullName.trim(),
      p_phone: form.phone.trim() || null,
      p_email: form.email.trim() || null,
      p_service_date: form.serviceDate,
      p_technician_id: form.technicianId || null,
      p_amount: Number(form.amount || 0),
      p_payment_method: form.paymentMethod,
      p_notes: form.notes.trim() || null,
      p_equipment: equipment.map((e) => ({ location: e.location.trim(), brand: e.brand.trim() || "Sin especificar", equipment_type: e.equipmentType, recommended_months: Number(e.recommendedMonths) })),
    });
    setSaving(false);
    if (error) { setSuccess(false); setMessage(`No se pudo guardar: ${error.message}`); return; }
    setSuccess(true); setMessage("Servicio registrado correctamente.");
    setForm({ fullName: "", phone: "", email: "", serviceDate: todayIso(), technicianId: "", amount: "", paymentMethod: "Efectivo", notes: "" });
    setEquipmentCount(1);
    setEquipment([{ location: "Habitación principal", brand: "", equipmentType: "Split", recommendedMonths: "4" }]);
    await refreshAll();
  }

  async function createTechnician(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !techForm.fullName.trim()) return;
    setSaving(true); setMessage("");
    const { error } = await supabase.rpc("admin_create_technician", { p_full_name: techForm.fullName.trim(), p_phone: techForm.phone.trim() || null, p_email: techForm.email.trim() || null });
    setSaving(false);
    if (error) { setSuccess(false); setMessage(error.message); return; }
    setSuccess(true); setMessage("Técnico registrado.");
    setTechForm({ fullName: "", phone: "", email: "" });
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
    setMessage(active ? "Técnico activado correctamente." : "Técnico inhabilitado correctamente.");
    await refreshAll();
  }

  async function deleteTechnician(id: string, name: string) {
    if (!supabase) return;

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${name}?\n\nLos servicios históricos no se borrarán, pero quedarán sin técnico asignado.`
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

  function navigate(next: Page) { setPage(next); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const text = [r.full_name, r.phone, r.email, r.brand, r.location, r.technician_name].filter(Boolean).join(" ").toLowerCase();
      return (!term || text.includes(term)) && (statusFilter === "TODOS" || r.status === statusFilter);
    });
  }, [rows, search, statusFilter]);

  const counts = useMemo(() => ({
    total: rows.length,
    ok: rows.filter((r) => r.status === "AL_DIA").length,
    next: rows.filter((r) => r.status === "PROXIMO").length,
    expired: rows.filter((r) => r.status === "VENCIDO").length,
  }), [rows]);

  const accountingTotal = useMemo(() => accountingRows.reduce((sum, r) => sum + Number(r.amount || 0), 0), [accountingRows]);

  function exportAccountingCsv() {
    const lines = [
      ["Fecha", "Cliente", "Telefono", "Correo", "Equipos", "Monto RD$", "Metodo", "Tecnico", "Notas"],
      ...accountingRows.map((r) => [r.service_date, r.full_name, r.phone ?? "", r.email ?? "", String(r.equipment_count), String(r.amount), r.payment_method, r.technician_name ?? "", r.notes ?? ""]),
    ];
    const csv = "\uFEFF" + lines.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `frescotech-contabilidad-${periodDate}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  if (!sessionReady) return <div className="min-h-screen bg-slate-950 grid place-items-center text-white">Cargando panel...</div>;

  if (!isSupabaseConfigured || !supabase) {
    return <div className="min-h-screen bg-slate-950 grid place-items-center p-6"><div className="max-w-lg rounded-3xl bg-white p-8 text-center"><h1 className="text-2xl font-bold">Falta configurar Supabase</h1><p className="mt-3 text-slate-500">Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.</p></div></div>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden grid place-items-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,.18),transparent_30%)]" />
        <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:grid-cols-2">
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-10 text-white">
            <div><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><IconSnowflake size={25}/></div><div><div className="text-2xl font-[Outfit] font-800">FrescoTech RD</div><div className="text-xs tracking-[.24em] text-brand-200">ADMINISTRACIÓN</div></div></div>
            <h2 className="mt-14 max-w-sm text-4xl font-[Outfit] font-800 leading-tight">Controla clientes, mantenimientos e ingresos desde un solo lugar.</h2><p className="mt-5 max-w-md text-brand-100">Preparado para crecer: varios equipos por cliente, técnicos, alertas y contabilidad.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-brand-100">Acceso privado protegido por Supabase Auth.</div>
          </div>
          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mb-8 lg:hidden flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500 text-white"><IconSnowflake/></div><div><div className="font-[Outfit] text-xl font-800">FrescoTech RD</div><div className="text-xs tracking-[.2em] text-slate-400">ADMIN</div></div></div>
            <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Panel privado</span>
            <h1 className="mt-4 text-3xl font-[Outfit] font-800 text-slate-900">Bienvenido de nuevo</h1><p className="mt-2 text-slate-500">Inicia sesión para administrar los servicios.</p>
            <form onSubmit={signIn} className="mt-8 space-y-5">
              <Field label="Correo"><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@ejemplo.com"/></Field>
              <Field label="Contraseña"><div className="relative"><input className={`${inputClass} pr-12`} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"/><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand-600">{showPassword ? <IconEyeOff/> : <IconEye/>}</button></div></Field>
              {authMessage && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{authMessage}</div>}
              <button disabled={authLoading} className="w-full rounded-xl bg-brand-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-brand-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl disabled:opacity-60">{authLoading ? "Entrando..." : "Iniciar sesión"}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const nav = [
    ["dashboard", "Dashboard", <IconGrid/>], ["register", "Registrar servicio", <IconPlus/>], ["maintenance", "Mantenimientos", <IconWrench/>], ["accounting", "Contabilidad", <IconMoney/>], ["technicians", "Técnicos", <IconUsers/>],
  ] as const;
  const [title, subtitle] = pageTitle(page);

  const Sidebar = () => (
    <aside className="flex h-full flex-col bg-gradient-to-b from-brand-900 to-brand-800 text-white">
      <div className="border-b border-white/10 p-5"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-950/20"><IconSnowflake/></div><div><div className="font-[Outfit] text-xl font-800">FrescoTech <span className="text-brand-300">RD</span></div><div className="text-[10px] tracking-[.22em] text-brand-200">ADMINISTRACIÓN</div></div></div></div>
      <nav className="space-y-2 p-4">{nav.map(([key, label, icon]) => <button key={key} onClick={() => navigate(key)} className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${page === key ? "bg-brand-500 text-white shadow-lg shadow-brand-950/20" : "text-brand-100 hover:translate-x-1 hover:bg-white/10 hover:text-white"}`}><span className="transition-transform group-hover:scale-110">{icon}</span><span className="flex-1">{label}</span><IconChevron size={16} className={`transition ${page === key ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}/></button>)}</nav>
      <div className="px-4 pt-1"><div className="rounded-2xl border border-white/10 bg-white/10 p-3"><div className="truncate text-xs text-brand-100">{sessionEmail}</div><button onClick={signOut} className="mt-2 flex w-full items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold transition-all hover:bg-red-500 hover:text-white"><IconLogout size={17}/> Cerrar sesión</button></div></div>
      <div className="mt-auto p-4 space-y-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"><div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"/>Sistema operativo</div><p className="mt-1 text-xs text-brand-200">Supabase conectado y panel activo.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"><div className="flex items-center gap-2 text-sm font-semibold"><IconBell size={17}/>Alertas</div><p className="mt-1 text-xs text-brand-200">{counts.next + counts.expired} equipos requieren seguimiento.</p></div></div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block"><Sidebar/></div>
      {mobileMenuOpen && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú"/><div className="relative h-full w-[86%] max-w-72 shadow-2xl"><Sidebar/></div></div>}
      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="flex min-h-20 items-center gap-4 px-4 sm:px-6 lg:px-8"><button onClick={() => setMobileMenuOpen(true)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 lg:hidden"><IconMenu/></button><div className="min-w-0 flex-1"><h1 className="truncate font-[Outfit] text-xl sm:text-2xl font-800">{title}</h1><p className="hidden truncate text-sm text-slate-500 sm:block">{subtitle}</p></div><button onClick={refreshAll} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700">Actualizar</button></div></header>
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {message && <div className={`mb-5 rounded-2xl border p-4 text-sm ${success ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`}>{message}</div>}

          {page === "dashboard" && <Dashboard counts={counts} rows={rows} accountingRows={accountingRows} navigate={navigate}/>} 
          {page === "register" && <RegisterPage form={form} setForm={setForm} equipmentCount={equipmentCount} changeEquipmentCount={changeEquipmentCount} equipment={equipment} updateEquipment={updateEquipment} technicians={technicians} saveService={saveService} saving={saving}/>} 
          {page === "maintenance" && <MaintenancePage rows={filteredRows} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} loading={loading}/>} 
          {page === "accounting" && <AccountingPage rows={accountingRows} total={accountingTotal} period={period} setPeriod={setPeriod} periodDate={periodDate} setPeriodDate={setPeriodDate} exportCsv={exportAccountingCsv}/>} 
          {page === "technicians" && <TechniciansPage technicians={technicians} techForm={techForm} setTechForm={setTechForm} createTechnician={createTechnician} toggleTechnician={toggleTechnician} deleteTechnician={deleteTechnician} saving={saving}/>} 
        </div>
      </main>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl ${className}`}>{children}</div>; }

function Dashboard({ counts, rows, navigate }: { counts: {total:number;ok:number;next:number;expired:number}; rows: AdminRow[]; accountingRows: AccountingRow[]; navigate:(p:Page)=>void }) {
  const cards = [["Equipos registrados", counts.total, "text-brand-600", "bg-brand-50"], ["Al día", counts.ok, "text-emerald-600", "bg-emerald-50"], ["Próximos", counts.next, "text-amber-600", "bg-amber-50"], ["Vencidos", counts.expired, "text-red-600", "bg-red-50"]] as const;
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,color,bg])=><Card key={label} className="p-5"><div className={`inline-flex rounded-xl px-3 py-1 text-xs font-semibold ${bg} ${color}`}>{label}</div><div className={`mt-4 font-[Outfit] text-4xl font-800 ${color}`}>{value}</div></Card>)}</div>
  <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]"><Card className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-[Outfit] text-xl font-800">Seguimiento reciente</h2><p className="text-sm text-slate-500">Últimos equipos registrados</p></div><button onClick={()=>navigate("maintenance")} className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100">Ver todos</button></div><div className="mt-5 space-y-3">{rows.slice(0,6).map(r=><div key={r.equipment_id} className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4 transition hover:border-brand-200 hover:bg-brand-50/30 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="font-semibold">{r.full_name}</div><div className="truncate text-sm text-slate-500">{r.location} · {r.brand} {r.equipment_type}</div></div><StatusBadge status={r.status}/></div>)}{rows.length===0&&<Empty text="Aún no hay servicios registrados."/>}</div></Card>
  <Card className="p-5 sm:p-6"><h2 className="font-[Outfit] text-xl font-800">Acciones rápidas</h2><div className="mt-5 grid gap-3">{[["Nuevo servicio","register",<IconPlus/>],["Ver contabilidad","accounting",<IconMoney/>],["Registrar técnico","technicians",<IconUsers/>]] .map(([label,key,icon])=><button key={String(key)} onClick={()=>navigate(key as Page)} className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left font-semibold transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700 transition group-hover:scale-110">{icon}</span><span className="flex-1">{label}</span><IconChevron size={17}/></button>)}</div></Card></div></div>;
}

function RegisterPage({ form,setForm,equipmentCount,changeEquipmentCount,equipment,updateEquipment,technicians,saveService,saving }: any) {
  return <form onSubmit={saveService} className="space-y-6"><Card className="p-5 sm:p-7"><div className="mb-6"><h2 className="font-[Outfit] text-xl font-800">Datos del cliente</h2><p className="mt-1 text-sm text-slate-500">Quitamos la cédula. El cliente se identifica por teléfono o correo.</p></div><div className="grid gap-5 md:grid-cols-2"><Field label="Nombre completo"><input className={inputClass} value={form.fullName} onChange={(e)=>setForm((f:any)=>({...f,fullName:e.target.value}))} required/></Field><Field label="Teléfono / WhatsApp"><input className={inputClass} value={form.phone} onChange={(e)=>setForm((f:any)=>({...f,phone:e.target.value}))} placeholder="809-000-0000"/></Field><Field label="Correo"><input className={inputClass} type="email" value={form.email} onChange={(e)=>setForm((f:any)=>({...f,email:e.target.value}))} placeholder="cliente@correo.com"/></Field><Field label="Fecha del servicio"><input className={inputClass} type="date" value={form.serviceDate} onChange={(e)=>setForm((f:any)=>({...f,serviceDate:e.target.value}))}/></Field></div></Card>
  <Card className="p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-[Outfit] text-xl font-800">Equipos / habitaciones</h2><p className="mt-1 text-sm text-slate-500">Un mismo cliente puede registrar varios aires en zonas diferentes.</p></div><div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2"><button type="button" onClick={()=>changeEquipmentCount(equipmentCount-1)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-xl font-bold transition hover:border-brand-300 hover:text-brand-700">−</button><div className="min-w-20 text-center"><div className="text-xs text-slate-400">Cantidad</div><div className="font-[Outfit] text-xl font-800">{equipmentCount}</div></div><button type="button" onClick={()=>changeEquipmentCount(equipmentCount+1)} className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-xl font-bold text-white transition hover:scale-105 hover:bg-brand-700">+</button></div></div><div className="mt-6 grid gap-4 xl:grid-cols-2">{equipment.map((eq:EquipmentForm,i:number)=><div key={i} className="rounded-2xl border-2 border-slate-100 p-4 transition-all hover:border-brand-200 hover:shadow-md"><div className="mb-4 flex items-center justify-between"><span className="font-semibold">Equipo {i+1}</span><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Zona {i+1}</span></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Habitación o zona"><input className={inputClass} value={eq.location} onChange={(e)=>updateEquipment(i,"location",e.target.value)} placeholder="Habitación principal"/></Field><Field label="Marca"><input className={inputClass} value={eq.brand} onChange={(e)=>updateEquipment(i,"brand",e.target.value)} placeholder="Daikin, LG, Samsung..."/></Field><Field label="Tipo"><select className={inputClass} value={eq.equipmentType} onChange={(e)=>updateEquipment(i,"equipmentType",e.target.value)}><option>Split</option><option>Inverter</option><option>Ventana</option><option>Central</option><option>Otro</option></select></Field><Field label="Frecuencia"><select className={inputClass} value={eq.recommendedMonths} onChange={(e)=>updateEquipment(i,"recommendedMonths",e.target.value)}><option value="3">Cada 3 meses</option><option value="4">Cada 4 meses</option></select></Field></div></div>)}</div></Card>
  <Card className="p-5 sm:p-7"><h2 className="font-[Outfit] text-xl font-800">Servicio y cobro</h2><div className="mt-5 grid gap-5 md:grid-cols-2"><Field label="Técnico"><select className={inputClass} value={form.technicianId} onChange={(e)=>setForm((f:any)=>({...f,technicianId:e.target.value}))}><option value="">Sin asignar / propietario</option>{technicians.filter((t:Technician)=>t.active).map((t:Technician)=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></Field><Field label="Monto cobrado (RD$)"><input className={inputClass} type="number" min="0" step="0.01" value={form.amount} onChange={(e)=>setForm((f:any)=>({...f,amount:e.target.value}))}/></Field><Field label="Método de pago"><select className={inputClass} value={form.paymentMethod} onChange={(e)=>setForm((f:any)=>({...f,paymentMethod:e.target.value}))}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Crédito</option><option>Otro</option></select></Field><Field label="Notas técnicas"><textarea className={`${inputClass} min-h-28 resize-y`} value={form.notes} onChange={(e)=>setForm((f:any)=>({...f,notes:e.target.value}))}/></Field></div><div className="mt-6 flex justify-end"><button disabled={saving} className="w-full rounded-2xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl sm:w-auto">{saving ? "Guardando..." : `Guardar servicio (${equipmentCount} equipo${equipmentCount>1?"s":""})`}</button></div></Card></form>;
}

function MaintenancePage({ rows,search,setSearch,statusFilter,setStatusFilter,loading }: any) {
  return <Card className="overflow-hidden"><div className="border-b border-slate-100 p-4 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="relative flex-1"><IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input className={`${inputClass} pl-11`} placeholder="Buscar por nombre, teléfono, correo, zona o técnico..." value={search} onChange={(e)=>setSearch(e.target.value)}/></div><div className="flex flex-wrap gap-2">{["TODOS","AL_DIA","PROXIMO","VENCIDO"].map(s=><button key={s} onClick={()=>setStatusFilter(s)} className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 ${statusFilter===s?"bg-brand-600 text-white shadow":"bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"}`}>{s==="TODOS"?"Todos":s==="AL_DIA"?"Al día":s==="PROXIMO"?"Próximos":"Vencidos"}</button>)}</div></div></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Cliente</th><th className="px-5 py-4">Equipo</th><th className="px-5 py-4">Último servicio</th><th className="px-5 py-4">Técnico</th><th className="px-5 py-4">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((r:AdminRow)=><tr key={r.equipment_id} className="transition hover:bg-brand-50/50"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{r.full_name}</div><div className="text-xs text-slate-500">{r.phone || r.email || "Sin contacto"}</div></td><td className="px-5 py-4"><div>{r.brand} · {r.equipment_type}</div><div className="text-xs text-slate-500">{r.location}</div></td><td className="px-5 py-4">{formatDate(r.last_maintenance)}</td><td className="px-5 py-4">{r.technician_name || "Sin asignar"}</td><td className="px-5 py-4"><StatusBadge status={r.status}/></td></tr>)}</tbody></table>{!loading&&rows.length===0&&<Empty text="No hay registros que coincidan con el filtro."/>}</div></Card>;
}

function AccountingPage({ rows,total,period,setPeriod,periodDate,setPeriodDate,exportCsv }: any) {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2"><Card className="p-5"><div className="text-sm text-slate-500">Ingresos del período</div><div className="mt-2 font-[Outfit] text-3xl font-800 text-emerald-600">{formatMoney(total)}</div></Card><Card className="p-5"><div className="text-sm text-slate-500">Servicios registrados</div><div className="mt-2 font-[Outfit] text-3xl font-800 text-brand-600">{rows.length}</div></Card></div><Card className="overflow-hidden"><div className="border-b border-slate-100 p-4 sm:p-6"><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div className="flex flex-wrap gap-2">{[["DIA","Día"],["MES","Mes"],["ANO","Año"]].map(([k,l])=><button key={k} onClick={()=>setPeriod(k)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${period===k?"bg-brand-600 text-white shadow":"bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"}`}>{l}</button>)}</div><div className="flex flex-col gap-3 sm:flex-row"><input className={inputClass} type="date" value={periodDate} onChange={(e)=>setPeriodDate(e.target.value)}/><button onClick={exportCsv} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700"><IconDownload/>Descargar Excel (CSV)</button></div></div></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Fecha</th><th className="px-5 py-4">Cliente</th><th className="px-5 py-4">Equipos</th><th className="px-5 py-4">Técnico</th><th className="px-5 py-4">Método</th><th className="px-5 py-4 text-right">Monto</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((r:AccountingRow)=><tr key={r.visit_id} className="transition hover:bg-emerald-50/50"><td className="px-5 py-4">{formatDate(r.service_date)}</td><td className="px-5 py-4"><div className="font-semibold">{r.full_name}</div><div className="text-xs text-slate-500">{r.phone || r.email}</div></td><td className="px-5 py-4">{r.equipment_count}</td><td className="px-5 py-4">{r.technician_name || "Propietario / sin asignar"}</td><td className="px-5 py-4">{r.payment_method}</td><td className="px-5 py-4 text-right font-bold text-emerald-700">{formatMoney(Number(r.amount))}</td></tr>)}</tbody></table>{rows.length===0&&<Empty text="No hay servicios en este período."/>}</div></Card></div>;
}

function TechniciansPage({
  technicians,
  techForm,
  setTechForm,
  createTechnician,
  toggleTechnician,
  deleteTechnician,
  saving,
}: any) {
  const activeCount = technicians.filter((t: Technician) => t.active).length;
  const inactiveCount = technicians.length - activeCount;

  return (
    <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
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
                setTechForm((f: any) => ({ ...f, fullName: e.target.value }))
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
                setTechForm((f: any) => ({ ...f, phone: e.target.value }))
              }
              placeholder="809-000-0000"
            />
          </Field>

          <Field label="Correo">
            <input
              className={inputClass}
              type="email"
              value={techForm.email}
              onChange={(e) =>
                setTechForm((f: any) => ({ ...f, email: e.target.value }))
              }
              placeholder="tecnico@correo.com"
            />
          </Field>

          <button
            disabled={saving}
            className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Procesando..." : "Guardar técnico"}
          </button>
        </form>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[Outfit] text-xl font-800">Equipo técnico</h2>
            <p className="mt-1 text-sm text-slate-500">
              Inhabilita temporalmente o elimina registros creados por error.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
              {technicians.length} total
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              {activeCount} activos
            </span>
            {inactiveCount > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {inactiveCount} inactivos
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {technicians.map((t: Technician) => (
            <div
              key={t.id}
              className={`group rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                t.active
                  ? "border-slate-200 bg-white hover:border-brand-300"
                  : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-900">
                    {t.full_name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {t.phone || "Sin teléfono"}
                  </div>
                  <div className="truncate text-sm text-slate-500">
                    {t.email || "Sin correo"}
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    t.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
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
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
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
                  className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>

              {!t.active && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  Este técnico no aparecerá al registrar nuevos servicios.
                </div>
              )}
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

function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const cls = status === "AL_DIA" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : status === "PROXIMO" ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-red-50 text-red-700 ring-red-100";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${cls}`}>{statusLabel(status)}</span>;
}
function Empty({ text }: { text: string }) { return <div className="p-8 text-center text-sm text-slate-400">{text}</div>; }
