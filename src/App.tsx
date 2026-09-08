import { useState, useRef } from "react";
import CatalogSection from "@/components/catalog/CatalogSection";
import StatusLookupSection from "@/components/maintenance/StatusLookupSection";
import { BUSINESS, ZONES } from "@/config/business";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceType = "installation" | "maintenance" | null;
type Step = 1 | 2 | 3;

interface InstallData {
  acType: string;
  btu: string;
  quantity: number;
  distance: string;
  description: string;
}

interface MaintData {
  acType: string;
  quantity: number;
  lastMaint: string;
  symptoms: string[];
  description: string;
}

interface ContactData {
  name: string;
  email: string;
  whatsapp: string;
  zone: string;
}

interface QuoteResult {
  materialsMin: number;
  materialsMax: number;
  laborMin: number;
  laborMax: number;
  materials: string[];
}

// ─── Pricing Logic ────────────────────────────────────────────────────────────

const BTU_MATERIALS: Record<string, [number, number]> = {
  "9000": [4200, 5800],
  "12000": [5200, 7000],
  "18000": [7000, 9500],
  "24000": [9500, 13000],
  "nosé": [5200, 13000],
};

const DISTANCE_SURCHARGE: Record<string, [number, number]> = {
  "menos3": [0, 0],
  "3a6": [900, 1400],
  "mas6": [1800, 2800],
};

const AC_LABOR: Record<string, [number, number]> = {
  "Split": [3500, 4500],
  "Ventana": [2800, 3800],
  "Inverter": [4000, 5500],
  "Central": [7500, 12000],
  "No sé": [3500, 12000],
};

const MAINT_BASE: [number, number] = [1500, 2200];
const MAINT_SYMPTOM_EXTRA: [number, number] = [600, 1800];

function calcInstallQuote(data: InstallData): QuoteResult {
  const qty = Math.max(1, data.quantity);
  const btuRange = BTU_MATERIALS[data.btu] ?? BTU_MATERIALS["nosé"];
  const distRange = DISTANCE_SURCHARGE[data.distance] ?? [0, 0];
  const laborRange = AC_LABOR[data.acType] ?? AC_LABOR["No sé"];

  const matMin = (btuRange[0] + distRange[0]) * qty;
  const matMax = (btuRange[1] + distRange[1]) * qty;
  const labMin = laborRange[0] * qty;
  const labMax = laborRange[1] * qty;

  const mats: string[] = [];
  if (data.btu !== "nosé") {
    if (parseInt(data.btu) <= 12000) mats.push("Tubería de cobre 1/4\" y 3/8\"");
    else mats.push("Tubería de cobre 3/8\" y 5/8\"");
  } else {
    mats.push("Tubería de cobre (calibre según unidad)");
  }
  mats.push("Cable eléctrico calibre 12 AWG");
  mats.push("Gas refrigerante R-410A");
  mats.push("Soportes y herrajes de montaje");
  mats.push("Breaker termomagnético");
  if (data.distance === "mas6") mats.push("Extensión de tubería adicional");
  mats.push("Canaleta plástica de acabado");

  return { materialsMin: matMin, materialsMax: matMax, laborMin: labMin, laborMax: labMax, materials: mats };
}

function calcMaintQuote(data: MaintData): QuoteResult {
  const qty = Math.max(1, data.quantity);
  const hasSymptoms = data.symptoms.filter(s => s !== "mantenimiento").length > 0;
  const labMin = MAINT_BASE[0] * qty + (hasSymptoms ? MAINT_SYMPTOM_EXTRA[0] : 0);
  const labMax = MAINT_BASE[1] * qty + (hasSymptoms ? MAINT_SYMPTOM_EXTRA[1] : 0);
  const matMin = 600 * qty;
  const matMax = 1200 * qty;

  const mats = [
    "Líquido desengrasante especial",
    "Limpieza de filtros y evaporador",
    "Revisión de gas refrigerante",
    "Revisión eléctrica y de compresor",
  ];
  if (hasSymptoms) mats.push("Diagnóstico y reparación de fallas detectadas");

  return { materialsMin: matMin, materialsMax: matMax, laborMin: labMin, laborMax: labMax, materials: mats };
}

function fmtRD(n: number) {
  return `RD$${n.toLocaleString("es-DO")}`;
}

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────

const IconSnowflake = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
    <polyline points="7 7 12 2 17 7" /><polyline points="7 17 12 22 17 17" />
    <polyline points="2 7 7 12 2 17" /><polyline points="22 7 17 12 22 17" />
  </svg>
);

const IconWrench = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const IconThermometer = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

const IconZap = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconCheck = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconWhatsApp = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const IconStar = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconPhone = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.7a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconMapPin = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconFacebook = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const IconInstagram = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const WA_NUMBER = BUSINESS.whatsappInternational;

const SYMPTOMS = [
  { value: "no_enfria", label: "No enfría bien" },
  { value: "ruido", label: "Hace ruido" },
  { value: "gotea", label: "Gotea agua" },
  { value: "mal_olor", label: "Mal olor" },
  { value: "no_enciende", label: "No enciende" },
  { value: "mantenimiento", label: "Mantenimiento preventivo de rutina" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {([1, 2, 3] as Step[]).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
            s < step ? "bg-brand-600 text-white" :
            s === step ? "bg-brand-500 text-white shadow-lg shadow-brand-200" :
            "bg-slate-200 text-slate-400"
          }`}>
            {s < step ? <IconCheck size={14} /> : s}
          </div>
          {s < 3 && <div className={`w-12 h-0.5 transition-all duration-300 ${s < step ? "bg-brand-500" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  );
}

function SelectBtn({
  selected, onClick, children
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer text-sm font-medium ${
        selected
          ? "border-brand-500 bg-brand-50 text-brand-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50"
      }`}
    >
      {children}
    </button>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {children}{required && <span className="text-accent-500 ml-1">*</span>}
    </label>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:outline-none transition-colors text-slate-800 placeholder:text-slate-400 bg-white ${props.className ?? ""}`}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:outline-none transition-colors text-slate-800 placeholder:text-slate-400 bg-white resize-none ${props.className ?? ""}`}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:outline-none transition-colors text-slate-800 bg-white appearance-none cursor-pointer ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Quoter state
  const [step, setStep] = useState<Step>(1);
  const [serviceType, setServiceType] = useState<ServiceType>(null);
  const [installData, setInstallData] = useState<InstallData>({
    acType: "", btu: "", quantity: 1, distance: "", description: ""
  });
  const [maintData, setMaintData] = useState<MaintData>({
    acType: "", quantity: 1, lastMaint: "", symptoms: [], description: ""
  });
  const [contact, setContact] = useState<ContactData>({
    name: "", email: "", whatsapp: "", zone: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  const quoterRef = useRef<HTMLDivElement>(null);

  const scrollToQuoter = () => {
    quoterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  function validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (serviceType === "installation") {
      if (!installData.acType) e.acType = "Selecciona el tipo de aire";
      if (!installData.btu) e.btu = "Selecciona la capacidad";
      if (!installData.distance) e.distance = "Selecciona la distancia";
    } else {
      if (!maintData.acType) e.acType = "Selecciona el tipo de aire";
      if (!maintData.lastMaint) e.lastMaint = "Selecciona cuándo fue el último mantenimiento";
      if (maintData.symptoms.length === 0) e.symptoms = "Selecciona al menos un síntoma";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateContact(): boolean {
    const e: Record<string, string> = {};
    if (!contact.name.trim()) e.name = "Ingresa tu nombre completo";
    if (!contact.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) e.email = "Ingresa un correo válido";
    if (!contact.whatsapp.trim() || !/^\+?[\d\s\-]{8,15}$/.test(contact.whatsapp)) e.whatsapp = "Ingresa un número de WhatsApp válido";
    if (!contact.zone.trim()) e.zone = "Indica tu zona o sector";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleStep2Next() {
    if (!validateStep2()) return;
    const result = serviceType === "installation"
      ? calcInstallQuote(installData)
      : calcMaintQuote(maintData);
    setQuote(result);
    setStep(3);
    setTimeout(() => quoterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function buildWAMessage(): string {
    const lines: string[] = [];
    lines.push("🌬️ *SOLICITUD DE COTIZACIÓN — FrescoTech RD*");
    lines.push("─────────────────────────────");
    lines.push(`📋 *Servicio:* ${serviceType === "installation" ? "Instalación nueva" : "Mantenimiento"}`);

    if (serviceType === "installation") {
      lines.push(`❄️ *Tipo de aire:* ${installData.acType || "No especificado"}`);
      lines.push(`⚡ *Capacidad BTU:* ${installData.btu !== "nosé" ? installData.btu + " BTU" : "Por definir"}`);
      lines.push(`🔢 *Cantidad de unidades:* ${installData.quantity}`);
      const distLabel = installData.distance === "menos3" ? "Menos de 3 m"
        : installData.distance === "3a6" ? "Entre 3 y 6 m"
        : installData.distance === "mas6" ? "Más de 6 m" : "No especificada";
      lines.push(`📏 *Distancia tubería:* ${distLabel}`);
      if (installData.description) lines.push(`💬 *Detalles:* ${installData.description}`);
    } else {
      lines.push(`❄️ *Tipo de aire:* ${maintData.acType || "No especificado"}`);
      lines.push(`🔢 *Cantidad de unidades:* ${maintData.quantity}`);
      const lastLabel = {
        "menos6": "Menos de 6 meses",
        "6a12": "Entre 6 y 12 meses",
        "mas1": "Más de un año",
        "nunca": "Nunca",
      }[maintData.lastMaint] ?? "No especificado";
      lines.push(`🕐 *Último mantenimiento:* ${lastLabel}`);
      const symLabels = maintData.symptoms.map(s => SYMPTOMS.find(x => x.value === s)?.label ?? s);
      lines.push(`🔍 *Síntomas:* ${symLabels.join(", ")}`);
      if (maintData.description) lines.push(`💬 *Detalles:* ${maintData.description}`);
    }

    if (quote) {
      lines.push("─────────────────────────────");
      lines.push("💰 *COTIZACIÓN ESTIMADA*");
      lines.push(`🔩 Materiales: ${fmtRD(quote.materialsMin)} – ${fmtRD(quote.materialsMax)}`);
      lines.push(`👨‍🔧 Mano de obra: ${fmtRD(quote.laborMin)} – ${fmtRD(quote.laborMax)}`);
      lines.push(`📊 *Total estimado: ${fmtRD(quote.materialsMin + quote.laborMin)} – ${fmtRD(quote.materialsMax + quote.laborMax)}*`);
      lines.push("⚠️ _Cotización preliminar, sujeta a inspección._");
    }

    lines.push("─────────────────────────────");
    lines.push("👤 *DATOS DE CONTACTO*");
    lines.push(`Nombre: ${contact.name}`);
    lines.push(`Correo: ${contact.email}`);
    lines.push(`WhatsApp: ${contact.whatsapp}`);
    lines.push(`Zona/Sector: ${contact.zone}`);

    return lines.join("\n");
  }

  function handleSendWA() {
    if (!validateContact()) return;
    const msg = buildWAMessage();
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  function resetQuoter() {
    setStep(1);
    setServiceType(null);
    setInstallData({ acType: "", btu: "", quantity: 1, distance: "", description: "" });
    setMaintData({ acType: "", quantity: 1, lastMaint: "", symptoms: [], description: "" });
    setContact({ name: "", email: "", whatsapp: "", zone: "" });
    setErrors({});
    setQuote(null);
  }

  const totalMin = quote ? quote.materialsMin + quote.laborMin : 0;
  const totalMax = quote ? quote.materialsMax + quote.laborMax : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "Inter, sans-serif" }}>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
              <IconSnowflake size={18} className="text-white" />
            </div>
            <div>
              <span className="font-[Outfit,sans-serif] font-800 text-lg leading-none text-slate-900">FrescoTech</span>
              <span className="font-[Outfit,sans-serif] font-600 text-lg leading-none text-brand-500"> RD</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#servicios" className="hover:text-brand-600 transition-colors">Servicios</a>
            <a href="#equipos" className="hover:text-brand-600 transition-colors">Equipos</a>
            <a href="#cotizador" className="hover:text-brand-600 transition-colors">Cotizador</a>
            <a href="#estado" className="hover:text-brand-600 transition-colors">Estado</a>
            <a href="#testimonios" className="hover:text-brand-600 transition-colors">Testimonios</a>
          </nav>

          <div className="flex items-center gap-3">
            <a href={`tel:${BUSINESS.phoneInternational}`} className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-600 transition-colors">
              <IconPhone size={15} />
              <span className="font-medium">{BUSINESS.phoneDisplay}</span>
            </a>
            <button
              onClick={scrollToQuoter}
              className="bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-accent-200 active:scale-95"
            >
              Cotiza ahora
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&h=700&fit=crop&auto=format')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-900/30 to-brand-900/60" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-500/20 border border-brand-400/30 rounded-full px-4 py-1.5 mb-6">
                <IconSnowflake size={14} className="text-brand-300" />
                <span className="text-brand-200 text-sm font-medium">Servicio profesional en RD</span>
              </div>
              <h1 className="font-[Outfit,sans-serif] font-800 text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-5">
                Instalación y<br />
                <span className="text-brand-300">mantenimiento</span><br />
                sin sorpresas
              </h1>
              <p className="text-brand-100 text-lg leading-relaxed mb-8 max-w-lg">
                Aires acondicionados residenciales y comerciales. Cotización estimada al instante, precio final confirmado en inspección.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={scrollToQuoter}
                  className="bg-accent-500 hover:bg-accent-400 text-white font-semibold px-7 py-4 rounded-2xl text-base transition-all duration-200 hover:shadow-xl hover:shadow-accent-500/30 active:scale-95 flex items-center justify-center gap-2"
                >
                  <IconZap size={18} />
                  Cotiza gratis ahora
                </button>
                <a
                  href={`https://wa.me/${WA_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-4 rounded-2xl text-base transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <IconWhatsApp size={18} />
                  Escríbenos
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-brand-400/20 rounded-3xl blur-2xl" />
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=500&fit=crop&auto=format"
                  alt="Técnico de FrescoTech instalando aire acondicionado"
                  className="relative rounded-3xl shadow-2xl object-cover w-full h-[420px] border border-white/10"
                />
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <IconCheck size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Instalaciones completadas</div>
                    <div className="font-[Outfit,sans-serif] font-700 text-slate-900">+1,200 unidades</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-16 pt-10 border-t border-white/10">
            {[
              { value: "8+", label: "Años de experiencia" },
              { value: "1,200+", label: "Unidades instaladas" },
              { value: "15", label: "Zonas de cobertura" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-[Outfit,sans-serif] font-800 text-3xl sm:text-4xl text-white mb-1">{stat.value}</div>
                <div className="text-brand-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section id="servicios" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-[Outfit,sans-serif] font-700 text-3xl sm:text-4xl text-slate-900 mb-3">Nuestros servicios</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Soluciones completas para mantener tu ambiente fresco y cómodo.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: <IconSnowflake size={28} className="text-brand-500" />,
                title: "Instalación",
                desc: "Instalamos todo tipo de equipos — split, inverter, ventana y central — con materiales de primera calidad y garantía en mano de obra.",
                price: "Desde RD$3,500",
                color: "brand",
              },
              {
                icon: <IconWrench size={28} className="text-accent-500" />,
                title: "Mantenimiento",
                desc: "Mantenimiento preventivo para extender la vida útil de tu equipo y reducir el consumo eléctrico hasta un 30%.",
                price: "Desde RD$1,500/unidad",
                color: "accent",
              },
              {
                icon: <IconThermometer size={28} className="text-emerald-500" />,
                title: "Reparación",
                desc: "Diagnóstico profesional y reparación de fallas eléctricas, de compresor, goteras, ruidos y más.",
                price: "Desde RD$900",
                color: "emerald",
              },
            ].map((svc) => (
              <div
                key={svc.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                  svc.color === "brand" ? "bg-brand-50" :
                  svc.color === "accent" ? "bg-orange-50" : "bg-emerald-50"
                }`}>
                  {svc.icon}
                </div>
                <h3 className="font-[Outfit,sans-serif] font-700 text-xl text-slate-900 mb-2">{svc.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{svc.desc}</p>
                <div className={`text-sm font-semibold ${
                  svc.color === "brand" ? "text-brand-600" :
                  svc.color === "accent" ? "text-accent-600" : "text-emerald-600"
                }`}>
                  {svc.price}
                </div>
                <button
                  onClick={scrollToQuoter}
                  className="mt-4 w-full py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-600 transition-all duration-200"
                >
                  Solicitar cotización →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CatalogSection />

      {/* ── COTIZADOR ── */}
      <section id="cotizador" ref={quoterRef} className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-[Outfit,sans-serif] font-700 text-3xl sm:text-4xl text-slate-900 mb-3">Cotizador interactivo</h2>
            <p className="text-slate-500 text-lg">Obtén un estimado al instante. Completa los pasos y te enviamos el detalle por WhatsApp.</p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl p-6 sm:p-8">
            <StepIndicator step={step} />

            {/* STEP 1 */}
            {step === 1 && (
              <div>
                <h3 className="font-[Outfit,sans-serif] font-700 text-xl text-slate-900 mb-6 text-center">¿Qué servicio necesitas?</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => { setServiceType("installation"); setStep(2); setErrors({}); }}
                    className={`group p-6 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer ${
                      serviceType === "installation"
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 hover:border-brand-300 hover:bg-brand-50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                      <IconSnowflake size={24} className="text-brand-600" />
                    </div>
                    <div className="font-[Outfit,sans-serif] font-700 text-lg text-slate-900 mb-1">🛠️ Instalación nueva</div>
                    <div className="text-slate-500 text-sm">Instalar uno o más equipos de A/C</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setServiceType("maintenance"); setStep(2); setErrors({}); }}
                    className={`group p-6 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer ${
                      serviceType === "maintenance"
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 hover:border-brand-300 hover:bg-brand-50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                      <IconWrench size={24} className="text-accent-600" />
                    </div>
                    <div className="font-[Outfit,sans-serif] font-700 text-lg text-slate-900 mb-1">🔧 Mantenimiento</div>
                    <div className="text-slate-500 text-sm">Preventivo, correctivo o reparación</div>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2A — Installation */}
            {step === 2 && serviceType === "installation" && (
              <div className="space-y-5">
                <h3 className="font-[Outfit,sans-serif] font-700 text-xl text-slate-900 mb-2">Detalles de la instalación</h3>

                <div>
                  <Label required>Tipo de aire acondicionado</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {["Split", "Ventana", "Inverter", "Central", "No sé"].map(t => (
                      <SelectBtn key={t} selected={installData.acType === t} onClick={() => setInstallData(d => ({ ...d, acType: t }))}>
                        {t}
                      </SelectBtn>
                    ))}
                  </div>
                  {errors.acType && <p className="text-red-500 text-xs mt-1">{errors.acType}</p>}
                </div>

                <div>
                  <Label required>Capacidad en BTU</Label>
                  <Select value={installData.btu} onChange={e => setInstallData(d => ({ ...d, btu: e.target.value }))}>
                    <option value="">Selecciona la capacidad</option>
                    <option value="9000">9,000 BTU — Habitación pequeña (~12 m²)</option>
                    <option value="12000">12,000 BTU — Habitación mediana (~18 m²)</option>
                    <option value="18000">18,000 BTU — Sala o habitación grande (~25 m²)</option>
                    <option value="24000">24,000 BTU — Espacio amplio o comercial (~35 m²)</option>
                    <option value="nosé">No sé — ayúdame a elegir</option>
                  </Select>
                  {errors.btu && <p className="text-red-500 text-xs mt-1">{errors.btu}</p>}
                  {installData.btu === "nosé" && (
                    <div className="mt-2 p-3 bg-brand-50 rounded-xl text-xs text-brand-700 border border-brand-100">
                      💡 <strong>¿No sabes el BTU?</strong> Mide el largo × ancho de la habitación. Para hasta 12 m² elige 9,000 BTU; 12-18 m² → 12,000; 18-28 m² → 18,000; más de 28 m² → 24,000.
                    </div>
                  )}
                </div>

                <div>
                  <Label required>Cantidad de unidades a instalar</Label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setInstallData(d => ({ ...d, quantity: Math.max(1, d.quantity - 1) }))}
                      className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 hover:border-brand-400 transition-colors">−</button>
                    <span className="font-[Outfit,sans-serif] font-700 text-2xl text-slate-900 w-8 text-center">{installData.quantity}</span>
                    <button type="button" onClick={() => setInstallData(d => ({ ...d, quantity: Math.min(10, d.quantity + 1) }))}
                      className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 hover:border-brand-400 transition-colors">+</button>
                  </div>
                </div>

                <div>
                  <Label required>Distancia entre unidad interior y exterior</Label>
                  <div className="space-y-2">
                    {[
                      { value: "menos3", label: "Menos de 3 metros", hint: "Pared con pared, muy cerca" },
                      { value: "3a6", label: "Entre 3 y 6 metros", hint: "Distancia estándar" },
                      { value: "mas6", label: "Más de 6 metros", hint: "Requiere tubería larga adicional" },
                    ].map(opt => (
                      <SelectBtn key={opt.value} selected={installData.distance === opt.value} onClick={() => setInstallData(d => ({ ...d, distance: opt.value }))}>
                        <span className="font-semibold">{opt.label}</span>
                        <span className="text-slate-400 ml-2 text-xs">{opt.hint}</span>
                      </SelectBtn>
                    ))}
                  </div>
                  {errors.distance && <p className="text-red-500 text-xs mt-1">{errors.distance}</p>}
                </div>

                <div>
                  <Label>Cuéntanos más sobre tu espacio</Label>
                  <Textarea
                    rows={3}
                    placeholder="Ej.: Oficina en el 3er piso, pared de concreto, sin toma eléctrica cercana..."
                    value={installData.description}
                    onChange={e => setInstallData(d => ({ ...d, description: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setStep(1); setErrors({}); }} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    ← Atrás
                  </button>
                  <button type="button" onClick={handleStep2Next} className="flex-2 flex-grow py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all duration-200 active:scale-95">
                    Ver mi cotización →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2B — Maintenance */}
            {step === 2 && serviceType === "maintenance" && (
              <div className="space-y-5">
                <h3 className="font-[Outfit,sans-serif] font-700 text-xl text-slate-900 mb-2">Detalles del mantenimiento</h3>

                <div>
                  <Label required>Tipo de aire acondicionado</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {["Split", "Ventana", "Inverter", "Central", "No sé"].map(t => (
                      <SelectBtn key={t} selected={maintData.acType === t} onClick={() => setMaintData(d => ({ ...d, acType: t }))}>
                        {t}
                      </SelectBtn>
                    ))}
                  </div>
                  {errors.acType && <p className="text-red-500 text-xs mt-1">{errors.acType}</p>}
                </div>

                <div>
                  <Label required>Cantidad de unidades</Label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setMaintData(d => ({ ...d, quantity: Math.max(1, d.quantity - 1) }))}
                      className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 hover:border-brand-400 transition-colors">−</button>
                    <span className="font-[Outfit,sans-serif] font-700 text-2xl text-slate-900 w-8 text-center">{maintData.quantity}</span>
                    <button type="button" onClick={() => setMaintData(d => ({ ...d, quantity: Math.min(10, d.quantity + 1) }))}
                      className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 hover:border-brand-400 transition-colors">+</button>
                  </div>
                </div>

                <div>
                  <Label required>¿Cuándo fue el último mantenimiento?</Label>
                  <div className="space-y-2">
                    {[
                      { value: "menos6", label: "Menos de 6 meses" },
                      { value: "6a12", label: "Entre 6 y 12 meses" },
                      { value: "mas1", label: "Hace más de un año" },
                      { value: "nunca", label: "Nunca le han dado mantenimiento" },
                    ].map(opt => (
                      <SelectBtn key={opt.value} selected={maintData.lastMaint === opt.value} onClick={() => setMaintData(d => ({ ...d, lastMaint: opt.value }))}>
                        {opt.label}
                      </SelectBtn>
                    ))}
                  </div>
                  {errors.lastMaint && <p className="text-red-500 text-xs mt-1">{errors.lastMaint}</p>}
                </div>

                <div>
                  <Label required>Síntomas o motivo del servicio</Label>
                  <div className="space-y-2">
                    {SYMPTOMS.map(s => (
                      <label key={s.value} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          maintData.symptoms.includes(s.value) ? "bg-brand-500 border-brand-500" : "border-slate-300 group-hover:border-brand-400"
                        }`}
                          onClick={() => setMaintData(d => ({
                            ...d,
                            symptoms: d.symptoms.includes(s.value)
                              ? d.symptoms.filter(x => x !== s.value)
                              : [...d.symptoms, s.value]
                          }))}
                        >
                          {maintData.symptoms.includes(s.value) && <IconCheck size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-slate-700 select-none">{s.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.symptoms && <p className="text-red-500 text-xs mt-1">{errors.symptoms}</p>}
                </div>

                <div>
                  <Label>Describe el problema con más detalle</Label>
                  <Textarea
                    rows={3}
                    placeholder="Ej.: El equipo gotea cuando está encendido más de 2 horas y tiene un olor a humedad..."
                    value={maintData.description}
                    onChange={e => setMaintData(d => ({ ...d, description: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setStep(1); setErrors({}); }} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    ← Atrás
                  </button>
                  <button type="button" onClick={handleStep2Next} className="flex-grow py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all duration-200 active:scale-95">
                    Ver mi cotización →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Quote + Contact */}
            {step === 3 && quote && (
              <div className="space-y-6">
                {/* Quote result */}
                <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl p-5 border border-brand-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
                      <IconCheck size={16} className="text-white" />
                    </div>
                    <h3 className="font-[Outfit,sans-serif] font-700 text-lg text-brand-900">Cotización preliminar</h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center py-2 border-b border-brand-200">
                      <span className="text-sm text-slate-600">🔩 Materiales estimados</span>
                      <span className="font-semibold text-slate-800 text-sm">{fmtRD(quote.materialsMin)} – {fmtRD(quote.materialsMax)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-brand-200">
                      <span className="text-sm text-slate-600">👨‍🔧 Mano de obra</span>
                      <span className="font-semibold text-slate-800 text-sm">{fmtRD(quote.laborMin)} – {fmtRD(quote.laborMax)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-[Outfit,sans-serif] font-700 text-slate-800">Total estimado</span>
                      <span className="font-[Outfit,sans-serif] font-800 text-brand-700 text-lg">{fmtRD(totalMin)} – {fmtRD(totalMax)}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Incluye materiales estimados:</p>
                    <ul className="space-y-1">
                      {quote.materials.map(m => (
                        <li key={m} className="flex items-start gap-2 text-xs text-slate-600">
                          <IconCheck size={12} className="text-brand-500 mt-0.5 shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    ⚠️ <strong>Cotización preliminar.</strong> El precio final se confirma tras la inspección técnica gratuita en sitio.
                  </div>
                </div>

                {/* Contact form */}
                <div>
                  <h3 className="font-[Outfit,sans-serif] font-700 text-lg text-slate-900 mb-4">Tus datos de contacto</h3>
                  <div className="space-y-4">
                    <div>
                      <Label required>Nombre completo</Label>
                      <Input
                        type="text"
                        placeholder="Ej.: María García"
                        value={contact.name}
                        onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Label required>Correo electrónico</Label>
                      <Input
                        type="email"
                        placeholder="tu@correo.com"
                        value={contact.email}
                        onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <Label required>Número de WhatsApp</Label>
                      <Input
                        type="tel"
                        placeholder="+1 829 555 0000"
                        value={contact.whatsapp}
                        onChange={e => setContact(c => ({ ...c, whatsapp: e.target.value }))}
                      />
                      {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                    </div>
                    <div>
                      <Label required>Zona o sector</Label>
                      <select
                        value={contact.zone}
                        onChange={e => setContact(c => ({ ...c, zone: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:outline-none transition-colors text-slate-800 bg-white appearance-none cursor-pointer"
                      >
                        <option value="">Selecciona tu zona</option>
                        {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                      {errors.zone && <p className="text-red-500 text-xs mt-1">{errors.zone}</p>}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendWA}
                  className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-[Outfit,sans-serif] font-700 text-base transition-all duration-200 hover:shadow-xl hover:shadow-green-200 active:scale-95 flex items-center justify-center gap-3"
                >
                  <IconWhatsApp size={22} />
                  Enviar solicitud por WhatsApp
                </button>
                <p className="text-center text-xs text-slate-400">
                  Se abrirá WhatsApp con el mensaje listo para enviar. Solo presiona "Enviar".
                </p>

                <button type="button" onClick={resetQuoter} className="w-full py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  ← Nueva cotización
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <StatusLookupSection />

      {/* ── TESTIMONIOS ── */}
      <section id="testimonios" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-[Outfit,sans-serif] font-700 text-3xl sm:text-4xl text-slate-900 mb-3">Lo que dicen nuestros clientes</h2>
            <p className="text-slate-500 text-lg">Más de 8 años enfriando hogares y negocios en la República Dominicana.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                name: "Carmen Rosario",
                zone: "Los Prados, D.N.",
                text: "Excelente servicio. Instalaron dos split en mi apartamento en un solo día y dejaron todo limpio. El precio fue exactamente lo que cotizaron.",
                rating: 5,
                img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format",
              },
              {
                name: "José Miguel Peña",
                zone: "Santiago de los Caballeros",
                text: "Le daban mantenimiento a los 4 equipos de mi negocio hace años y nunca falla. Recomendado 100%, muy puntuales y profesionales.",
                rating: 5,
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format",
              },
              {
                name: "Patricia Núñez",
                zone: "Boca Chica",
                text: "El equipo de FrescoTech resolvió un goteo que otro técnico no pudo arreglar. Vinieron el mismo día que llamé. Muy recomendado.",
                rating: 5,
                img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format",
              },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <IconStar key={i} size={16} className="text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <IconMapPin size={11} /> {t.zone}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
            {[
              { emoji: "🏆", value: "8+ años", label: "De experiencia" },
              { emoji: "❄️", value: "1,200+", label: "Unidades instaladas" },
              { emoji: "📍", value: "15 zonas", label: "De cobertura" },
              { emoji: "⭐", value: "4.9 / 5", label: "Calificación promedio" },
            ].map(b => (
              <div key={b.label} className="bg-white rounded-2xl p-5 text-center border border-slate-100 shadow-sm">
                <div className="text-3xl mb-2">{b.emoji}</div>
                <div className="font-[Outfit,sans-serif] font-800 text-xl text-slate-900">{b.value}</div>
                <div className="text-xs text-slate-500 mt-1">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-brand-900 text-white pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
                  <IconSnowflake size={18} className="text-white" />
                </div>
                <span className="font-[Outfit,sans-serif] font-800 text-xl">FrescoTech <span className="text-brand-300">RD</span></span>
              </div>
              <p className="text-brand-200 text-sm leading-relaxed mb-4">
                Instalación y mantenimiento profesional de aires acondicionados en la República Dominicana.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-brand-700 hover:bg-brand-600 flex items-center justify-center transition-colors">
                  <IconFacebook size={17} />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-brand-700 hover:bg-brand-600 flex items-center justify-center transition-colors">
                  <IconInstagram size={17} />
                </a>
                <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-green-600 hover:bg-green-500 flex items-center justify-center transition-colors">
                  <IconWhatsApp size={17} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-[Outfit,sans-serif] font-700 text-sm uppercase tracking-wider text-brand-300 mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm text-brand-200">
                {["Instalación de A/C", "Mantenimiento preventivo", "Reparación y diagnóstico", "Cambio de gas refrigerante", "Instalación de breakers"].map(s => (
                  <li key={s} className="hover:text-white transition-colors cursor-pointer">{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-[Outfit,sans-serif] font-700 text-sm uppercase tracking-wider text-brand-300 mb-4">Contacto</h4>
              <ul className="space-y-3 text-sm text-brand-200">
                <li className="flex items-center gap-2.5">
                  <IconPhone size={15} className="text-brand-400 shrink-0" />
                  <a href={`tel:${BUSINESS.phoneInternational}`} className="hover:text-white transition-colors">{BUSINESS.phoneDisplay}</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <IconWhatsApp size={15} className="text-green-400 shrink-0" />
                  <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp directo</a>
                </li>
                <li className="flex items-start gap-2.5">
                  <IconMapPin size={15} className="text-brand-400 shrink-0 mt-0.5" />
                  <span>Cobertura: {BUSINESS.coverage}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-brand-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-brand-400 text-xs">© {new Date().getFullYear()} FrescoTech RD. Todos los derechos reservados.</p>
            <button
              onClick={scrollToQuoter}
              className="bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 active:scale-95"
            >
              Cotiza gratis →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
