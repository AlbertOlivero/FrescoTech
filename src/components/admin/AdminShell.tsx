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

const nav: Array<{ key: Page; label: string; icon: ReactNode }> = [
  { key: "dashboard", label: "Dashboard", icon: <IconGrid /> },
  { key: "register", label: "Registrar servicio", icon: <IconPlus /> },
  { key: "maintenance", label: "Mantenimientos", icon: <IconWrench /> },
  { key: "accounting", label: "Contabilidad", icon: <IconMoney /> },
  { key: "technicians", label: "Técnicos", icon: <IconUsers /> },
  { key: "products", label: "Productos", icon: <IconBox /> },
];

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-14 w-16 shrink-0 items-center justify-center">
        <img
          src="/nexter-mark.png"
          alt="Nexter Ingeniería"
          className="h-14 w-16 object-contain"
        />
      </div>
      <div className="min-w-0 leading-none">
        <div className="font-[Outfit] text-xl font-800 tracking-tight">
          <span className="text-white">Nexter</span>{" "}
          <span className="text-orange-400">Ingeniería</span>
        </div>
        <div className="mt-2 text-[9px] font-bold uppercase tracking-[.28em] text-sky-200/80">
          Administración
        </div>
      </div>
    </div>
  );
}

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
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-brand-950 to-brand-900 text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Brand />
      </div>

      <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.24em] text-slate-400">
          Menú principal
        </div>
        {nav.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
              page === item.key
                ? "bg-brand-500 text-white shadow-lg shadow-brand-950/30"
                : "text-slate-300 hover:translate-x-1 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg transition-all ${
                page === item.key
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-slate-300 group-hover:bg-white/10"
              }`}
            >
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            <IconChevron
              size={15}
              className={`transition-all ${
                page === item.key
                  ? "opacity-100"
                  : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              }`}
            />
          </button>
        ))}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-white/10 bg-brand-950/40 p-3">
        <button
          type="button"
          onClick={() => navigate("maintenance")}
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:bg-white/10"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-400/15 text-orange-300">
                <IconBell size={17} />
              </span>
              Alertas
            </div>
            <span className="rounded-full bg-orange-400 px-2 py-0.5 text-xs font-bold text-slate-950">
              {alertCount}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            Equipos que requieren seguimiento.
          </p>
        </button>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">
            Sesión activa
          </div>
          <div className="truncate text-xs text-slate-300">{sessionEmail}</div>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition-all hover:border-red-400/30 hover:bg-red-500 hover:text-white"
          >
            <IconLogout size={17} /> Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );

  const [title, subtitle] = pageTitles[page];

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          />
          <div className="relative h-full w-[86%] max-w-72 shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}

      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="flex min-h-[76px] items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 lg:hidden"
              aria-label="Abrir menú"
            >
              <IconMenu />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-[Outfit] text-xl font-800 tracking-tight text-slate-950 sm:text-2xl">
                {title}
              </h1>
              <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">
                {subtitle}
              </p>
            </div>

            <div className="hidden min-w-0 items-center gap-3 border-l border-slate-200 pl-4 md:flex">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 font-[Outfit] text-sm font-800 text-brand-700">
                {sessionEmail.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800">Administrador</div>
                <div className="max-w-44 truncate text-xs text-slate-500">{sessionEmail}</div>
              </div>
            </div>

            <button onClick={refreshAll} className={softButtonClass}>
              Actualizar
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
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
