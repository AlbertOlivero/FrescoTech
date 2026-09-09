import type { FormEvent } from "react";
import {
  IconBell,
  IconEye,
  IconEyeOff,
  IconSnowflake,
  IconUser,
  IconWrench,
} from "./ui";

interface Props {
  email: string;
  password: string;
  showPassword: boolean;
  authLoading: boolean;
  authMessage: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  signIn: (event: FormEvent) => void;
}

export default function LoginView({
  email,
  password,
  showPassword,
  authLoading,
  authMessage,
  setEmail,
  setPassword,
  setShowPassword,
  signIn,
}: Props) {
  return (
    <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-brand-900 via-brand-900 to-brand-700 px-14 py-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(56,189,248,.35), transparent 28%), radial-gradient(circle at 85% 72%, rgba(14,165,233,.25), transparent 32%)",
          }}
        />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full border border-white/10" />

        <div className="relative z-10 flex w-full flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/25">
              <IconSnowflake size={23} />
            </div>
            <div>
              <div className="font-[Outfit,sans-serif] text-xl font-800 leading-none">
                FrescoTech RD
              </div>
              <div className="mt-1 text-xs uppercase tracking-[.18em] text-brand-200">
                Panel administrativo
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-2 text-sm text-brand-100">
              <IconUser size={16} /> Área privada y segura
            </div>

            <h1 className="font-[Outfit,sans-serif] text-5xl font-800 leading-[1.05] tracking-tight xl:text-6xl">
              Gestiona tus servicios
              <br />
              <span className="text-brand-300">desde un solo lugar.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-brand-100/80">
              Clientes, equipos y mantenimientos organizados para que tengas el
              control de cada servicio y cada vencimiento.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                { icon: <IconWrench size={19} />, label: "Servicios" },
                { icon: <IconBell size={19} />, label: "Alertas" },
                { icon: <IconUser size={19} />, label: "Acceso seguro" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg"
                >
                  <div className="mb-2 text-brand-300">{item.icon}</div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-brand-200/60">
            © {new Date().getFullYear()} FrescoTech RD · Sistema de gestión interna
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
        <form onSubmit={signIn} className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white">
              <IconSnowflake size={22} />
            </div>
            <div>
              <div className="font-[Outfit,sans-serif] text-xl font-800 text-slate-900">
                FrescoTech RD
              </div>
              <div className="text-xs text-slate-400">Panel administrativo</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <IconUser size={22} />
            </div>

            <h2 className="font-[Outfit,sans-serif] text-3xl font-800 tracking-tight text-slate-950 sm:text-4xl">
              Bienvenido de vuelta
            </h2>

            <p className="mt-2 text-slate-500">
              Inicia sesión para acceder al panel de administración.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@frescotechrd.com"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-brand-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                <span className="text-xs text-slate-400">Acceso autorizado</span>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-brand-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-brand-600 active:scale-95"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            {authMessage && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {authMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 font-semibold text-white shadow-lg shadow-brand-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Verificando...
                </>
              ) : (
                <>
                  <IconUser size={18} /> Iniciar sesión
                </>
              )}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-200 pt-6 text-xs text-slate-400">
            <IconUser size={14} /> Sesión protegida con Supabase Auth
          </div>
        </form>
      </section>
    </div>
  );
}
