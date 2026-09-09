import type { ReactNode } from "react";
import type { MaintenanceStatus } from "./types";

export interface IconProps {
  size?: number;
  className?: string;
}

export function SvgIcon({
  size = 20,
  className = "",
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconSnowflake = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M12 2v20M4.9 6.1l14.2 11.8M4.9 17.9 19.1 6.1" />
    <path d="m9 4 3 2 3-2M9 20l3-2 3 2" />
  </SvgIcon>
);

export const IconGrid = (p: IconProps) => (
  <SvgIcon {...p}>
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
  </SvgIcon>
);

export const IconPlus = (p: IconProps) => (
  <SvgIcon {...p}><path d="M12 5v14M5 12h14" /></SvgIcon>
);

export const IconWrench = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5-5L7.8 3.2l3 3L12.7 4.3a4 4 0 0 0 2 5L6 18l-2 2 2 2 2-2 8.7-8.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4" />
  </SvgIcon>
);

export const IconMoney = (p: IconProps) => (
  <SvgIcon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M7 9h.01M17 15h.01M12 9v6M10 11h3a1 1 0 0 1 0 2h-3" />
  </SvgIcon>
);

export const IconUsers = (p: IconProps) => (
  <SvgIcon {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M18 14a5 5 0 0 1 3 4.6" />
  </SvgIcon>
);

export const IconUser = (p: IconProps) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </SvgIcon>
);

export const IconBox = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="m21 8-9 5-9-5" />
    <path d="M3 8l9-5 9 5v8l-9 5-9-5Z" />
    <path d="M12 13v8" />
  </SvgIcon>
);

export const IconSearch = (p: IconProps) => (
  <SvgIcon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </SvgIcon>
);

export const IconLogout = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
  </SvgIcon>
);

export const IconMenu = (p: IconProps) => (
  <SvgIcon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></SvgIcon>
);

export const IconDownload = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </SvgIcon>
);

export const IconBell = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
  </SvgIcon>
);

export const IconChevron = (p: IconProps) => (
  <SvgIcon {...p}><path d="m9 18 6-6-6-6" /></SvgIcon>
);

export const IconEye = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.5" />
  </SvgIcon>
);

export const IconEyeOff = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="m3 3 18 18M10.6 6.2A9.4 9.4 0 0 1 12 6c6.5 0 10 6 10 6a18.3 18.3 0 0 1-3 3.8M6.6 6.6C3.7 8.3 2 12 2 12s3.5 6 10 6a9.7 9.7 0 0 0 4-.8" />
  </SvgIcon>
);

export const inputClass =
  "w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-all duration-200 hover:border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

export const primaryButtonClass =
  "rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";

export const softButtonClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md active:translate-y-0";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Card({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${
        interactive
          ? "transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-xl"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm text-slate-400">{text}</div>;
}

export function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const cls =
    status === "AL_DIA"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : status === "PROXIMO"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : "bg-red-50 text-red-700 ring-red-100";

  const label =
    status === "AL_DIA" ? "Al día" : status === "PROXIMO" ? "Próximo" : "Vencido";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${cls}`}>
      {label}
    </span>
  );
}
