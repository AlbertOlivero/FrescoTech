import type { ReactNode } from "react";
import { pageTitles } from "./helpers";
import type { Page } from "./types";
import {
  IconBell,
  IconBox,
  IconChevron,
  IconGrid,
  IconLogout,
  IconMenu,
  IconMoney,
  IconPlus,
  IconSnowflake,
  IconUsers,
  IconWrench,
  softButtonClass,
} from "./ui";

interface Props {
  page: Page;
  sessionEmail: string;
  mobileMenuOpen: boolean;
  alertCount: number;
  message: string;
  success: boolean;
  children: ReactNode;
  navigate: (page: Page) => void;
  setMobileMenuOpen: (open: boolean) => void;
  signOut: () => void;
  refreshAll: () => void;
}

const nav: Array<{
  key: Page;
  label: string;
  icon: ReactNode;
}> = [
  { key: "dashboard", label: "Dashboard", icon: <IconGrid /> },
  { key: "register", label: "Registrar servicio", icon: <IconPlus /> },
  { key: "maintenance", label: "Mantenimientos", icon: <IconWrench /> },
  { key: "accounting", label: "Contabilidad", icon: <IconMoney /> },
  { key: "technicians", label: "Técnicos", icon: <IconUsers /> },
  { key: "products", label: "Productos", icon: <IconBox /> },
];

export default function AdminShell({
  page,
  sessionEmail,
  mobileMenuOpen,
  alertCount,
  message,
  success,
  children,
  navigate,
  setMobileMenuOpen,
  signOut,
  refreshAll,
}: Props) {
  const Sidebar = () => (
    <aside className="flex h-full flex-col bg-gradient-to-b from-brand-900 to-brand-800 text-white">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:scale-105">
            <IconSnowflake />
          </div>
          <div>
            <div className="font-[Outfit] text-xl font-800">
              FrescoTech <span className="text-brand-300">RD</span>
            </div>
            <div className="text-[10px] tracking-[.22em] text-brand-200">
              ADMINISTRACIÓN
            </div>
          </div>
        </div>
      </div>

      <nav className="space-y-2 p-4">
        {nav.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 hover:translate-x-1 hover:bg-white/10 hover:text-white hover:shadow-lg active:translate-x-0 ${
              page === item.key
                ? "bg-brand-500 text-white shadow-lg shadow-brand-950/20"
                : "text-brand-100"
            }`}
          >
            <span className="transition-transform duration-200 group-hover:scale-110">
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            <IconChevron
              size={16}
              className={`transition-all duration-200 ${
                page === item.key
                  ? "opacity-100"
                  : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              }`}
            />
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3 p-4">
        <button
          type="button"
          onClick={() => navigate("maintenance")}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg active:translate-y-0"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <IconBell size={17} /> Alertas
          </div>
          <p className="mt-1 text-xs text-brand-200">
            {alertCount} equipos requieren seguimiento.
          </p>
        </button>

        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
          <div className="truncate text-xs text-brand-100">{sessionEmail}</div>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-500 hover:text-white hover:shadow-lg active:translate-y-0"
          >
            <IconLogout size={17} /> Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );

  const [title, subtitle] = pageTitles[page];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          />
          <div className="relative h-full w-[86%] max-w-72 shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}

      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md active:translate-y-0 lg:hidden"
              aria-label="Abrir menú"
            >
              <IconMenu />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-[Outfit] text-xl font-800 sm:text-2xl">
                {title}
              </h1>
              <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">
                {subtitle}
              </p>
            </div>

            <button onClick={refreshAll} className={softButtonClass}>
              Actualizar
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {message && (
            <div
              className={`mb-5 rounded-2xl border p-4 text-sm ${
                success
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-red-100 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}
