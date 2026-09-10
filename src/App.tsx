import { useState, useRef, useEffect } from "react";
import CatalogSection from "@/components/catalog/CatalogSection";
import StatusLookupSection from "@/components/maintenance/StatusLookupSection";
import { BUSINESS, ZONES } from "@/config/business";

import { supabase } from "./lib/supabase";

type NexterPublicProduct = {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  btu: string | number | null;
  price: number | null;
  description: string | null;
  image: string | null;
  published: boolean | null;
  stock: number | null;
};

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


function IconHome({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V20h13v-9.5" />
    </svg>
  );
}

function IconGear({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.14.38.36.72.65 1 .29.28.66.46 1.05.5h.1v4h-.1c-.39.04-.76.22-1.05.5-.29.28-.51.62-.65 1Z" />
    </svg>
  );
}

export default function App() {

  /* NEXTER_PRODUCT_QUOTE_MODAL_STATE */
  const [selectedProduct, setSelectedProduct] = useState<NexterPublicProduct | null>(null);

  const buildProductWhatsAppUrl = (product: NexterPublicProduct) => {
    const priceText =
      typeof product.price === "number"
        ? new Intl.NumberFormat("es-DO", {
            style: "currency",
            currency: "DOP",
            maximumFractionDigits: 0,
          }).format(product.price)
        : "Consultar precio";

    const details = [
      "Hola, quiero cotizar este producto de Nexter Ingeniería:",
      "",
      `Producto: ${product.name}`,
      product.brand ? `Marca: ${product.brand}` : null,
      product.category ? `Categoría: ${product.category}` : null,
      product.btu ? `BTU: ${product.btu}` : null,
      `Precio: ${priceText}`,
      typeof product.stock === "number"
        ? `Disponibilidad: ${product.stock > 0 ? product.stock + " unidad(es)" : "Agotado"}`
        : null,
      product.description ? `Descripción: ${product.description}` : null,
      "",
      "Me gustaría recibir información para realizar la cotización.",
    ].filter(Boolean);

    return `https://wa.me/18297082720?text=${encodeURIComponent(details.join("\n"))}`;
  };


  /* NEXTER_PUBLIC_PRODUCTS_QUERY */
  const [publicProducts, setPublicProducts] = useState<NexterPublicProduct[]>([]);
  const [publicProductsLoading, setPublicProductsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadPublicProducts = async () => {
      setPublicProductsLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("id,name,category,brand,btu,price,description,image,published,stock,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("No se pudieron cargar los productos publicados:", error);
        setPublicProducts([]);
      } else {
        setPublicProducts(
          (data ?? []).map((row: any) => ({
            id: row.id,
            name: row.name,
            category: row.category,
            brand: row.brand,
            btu: row.btu,
            price: row.price == null ? null : Number(row.price),
            description: row.description,
            image: row.image,
            published: row.published,
            stock: row.stock,
            created_at: row.created_at,

          })),
        );
      }

      setPublicProductsLoading(false);
    };

    loadPublicProducts();

    return () => {
      active = false;
    };
  }, []);

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
    lines.push("🌬️ *SOLICITUD DE COTIZACIÓN — Nexter Ingeniería*");
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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-[92px] max-w-[1672px] items-center justify-between px-[5.5%]">
          <a href="#inicio" className="flex shrink-0 items-center">
            <img
              src="/nexter-logo-master.png"
              alt="Nexter Ingeniería"
              className="h-[60px] w-auto object-contain"
            />
          </a>

          <nav className="hidden items-center gap-[38px] text-[16px] font-semibold text-[#0b2a56] lg:flex">
            <a href="#inicio" className="transition-colors hover:text-[#168df0]">Inicio</a>
            <a href="#servicios" className="transition-colors hover:text-[#168df0]">Servicios</a>
            <a href="#productos" className="transition-colors hover:text-[#168df0]">Productos</a>
            <a href="#cotizador" className="transition-colors hover:text-[#168df0]">Cotizar</a>
            <a href="#contacto" className="transition-colors hover:text-[#168df0]">Contacto</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={scrollToQuoter}
              className="hidden min-w-[260px] justify-center rounded-full bg-[#168df0] px-7 py-[14px] text-[16px] font-bold text-white shadow-[0_10px_26px_rgba(22,141,240,.23)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0b7edb] hover:shadow-[0_14px_32px_rgba(22,141,240,.30)] sm:inline-flex"
            >
              Solicitar cotización
            </button>

            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-brand-50 lg:hidden"
            >
              <span className="text-xl leading-none">{menuOpen ? "×" : "☰"}</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-4 shadow-lg lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-1 text-sm font-semibold text-slate-700">
              {[
                ["Inicio", "#inicio"],
                ["Servicios", "#servicios"],
                ["Productos", "#productos"],
                ["Cotizar", "#cotizador"],
                ["Contacto", "#contacto"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {label}
                </a>
              ))}
              <button
                onClick={() => { setMenuOpen(false); scrollToQuoter(); }}
                className="mt-2 rounded-xl bg-[#168df0] px-4 py-3 font-bold text-white"
              >
                Solicitar cotización
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="inicio" className="relative overflow-hidden bg-white pt-[92px]">
        <div className="relative mx-auto max-w-[1672px]">
          <div className="relative min-h-[445px] lg:min-h-[455px]">
            <div className="absolute inset-y-0 right-0 hidden w-[54%] overflow-hidden lg:block">
              <img
                src="/nexter-hero-master.webp"
                alt="Aire acondicionado inverter Nexter Ingeniería"
                className="h-[92%] w-[92%] object-contain object-right-top ml-auto mt-3"
                    style={{
                    width: "128%",
                    maxWidth: "none",
                    marginLeft: "-28%",
                    marginRight: "0",
                    objectPosition: "right center",
                    clipPath: "inset(0 0 0 13%)",
                  }}
                  />
              <div className="absolute inset-y-0 left-0 w-[28%] bg-gradient-to-r from-white via-white/80 to-transparent" />
            </div>

            <div className="relative z-10 mx-auto grid min-h-[455px] max-w-[1672px] items-center px-[5.8%] lg:grid-cols-[46%_54%]">
              <div className="max-w-[650px] pb-3">
                <h1 className="font-[Outfit,sans-serif] text-[50px] font-900 leading-[.96] tracking-[-.045em] text-[#08285a] sm:text-[60px] lg:text-[70px]">
                  Climatización
                  <br />
                  que impulsa
                  <br />
                  <span className="text-[#f97316]">tu negocio</span>
                </h1>

                <p className="mt-7 max-w-[590px] text-[17px] leading-[1.5] text-[#526b8c] sm:text-[20px]">
                  Soluciones de climatización, mantenimiento y servicio técnico para hogares,
                  comercios e industrias en toda la República Dominicana.
                </p>

                <button
                  onClick={scrollToQuoter}
                  className="mt-7 inline-flex min-w-[360px] items-center justify-between rounded-full bg-[#168df0] px-8 py-[17px] text-[20px] font-bold text-white shadow-[0_10px_24px_rgba(22,141,240,.24)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#0b7edb] max-sm:min-w-0 max-sm:w-full"
                >
                  <span>Solicitar cotización</span>
                  <span className="text-[30px] font-light leading-none">→</span>
                </button>
              </div>

              <div className="mt-8 lg:hidden">
                <img
                  src="/nexter-hero-master.webp"
                  alt="Aire acondicionado inverter Nexter Ingeniería"
                  className="w-full rounded-[26px] object-cover shadow-xl"
                />
              </div>
            </div>
          </div>

          <div className="relative z-20 -mt-1 border-t border-slate-50 bg-white">
            <div className="mx-auto grid max-w-[1672px] gap-5 px-[5.8%] py-[14px] sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {[
                ["Servicio técnico", "especializado", <IconWrench size={25} />],
                ["Mantenimiento", "preventivo", <IconHome size={25} />],
                ["Equipos y repuestos", "originales", <IconGear size={25} />],
                ["Atención en", "toda RD", <IconMapPin size={25} />],
              ].map(([title, subtitle, icon]) => (
                <div key={String(title)} className="flex min-w-0 items-center gap-5">
                  <div className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-full bg-[#e8f5ff] text-[#168df0]">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[17px] font-600 leading-[1.25] text-[#0b2a56]">{title}</div>
                    <div className="mt-1 text-[17px] leading-[1.25] text-[#0b2a56]">{subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

{/* ── SERVICIOS ── */}
      <section id="servicios" className="bg-[#f7fbff] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-800 uppercase tracking-[.22em] text-brand-600">Nuestras soluciones</span>
            <h2 className="mt-3 font-[Outfit,sans-serif] text-3xl font-800 tracking-tight text-[#0f2744] sm:text-4xl">
              Ingeniería aplicada a tu confort
            </h2>
            <p className="mt-4 text-slate-600">
              Servicio técnico especializado para hogares, comercios y proyectos que requieren soluciones confiables.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <IconSnowflake size={25} />,
                title: "Climatización",
                desc: "Instalación de equipos split, inverter, ventana y sistemas comerciales con terminación profesional.",
                accent: "bg-brand-500",
              },
              {
                icon: <IconWrench size={25} />,
                title: "Servicio técnico",
                desc: "Diagnóstico y reparación de fallas eléctricas, drenaje, refrigeración y funcionamiento general.",
                accent: "bg-accent-500",
              },
              {
                icon: <IconCheck size={25} />,
                title: "Mantenimiento",
                desc: "Planes preventivos y correctivos orientados a prolongar la vida útil y eficiencia de tus equipos.",
                accent: "bg-brand-700",
              },
            ].map((svc) => (
              <article
                key={svc.title}
                className="group rounded-[28px] border border-slate-100 bg-white p-7 shadow-[0_12px_35px_rgba(15,39,68,.06)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_22px_55px_rgba(15,39,68,.13)]"
              >
                <div className={`grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg ${svc.accent}`}>
                  {svc.icon}
                </div>
                <h3 className="mt-6 font-[Outfit,sans-serif] text-xl font-800 text-[#0f2744]">{svc.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{svc.desc}</p>
                <button
                  onClick={scrollToQuoter}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-800 text-brand-600 transition-all group-hover:gap-3 group-hover:text-brand-700"
                >
                  Solicitar cotización <span>→</span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>


      {/* ── PRODUCTOS ── */}
      
      {/* ── PRODUCTOS DESDE SUPABASE ── */}
      <section id="productos" className="scroll-mt-24 bg-white px-[5.8%] py-20">
        <div className="mx-auto max-w-[1672px]">
          <div className="mb-10">
            <span className="text-[13px] font-extrabold uppercase tracking-[0.22em] text-[#168df0]">
              Productos
            </span>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#0b2a56] md:text-5xl">
              Equipos disponibles
            </h2>
            <p className="mt-4 max-w-2xl text-[17px] leading-7 text-slate-600">
              Equipos publicados en nuestro catálogo y disponibles para cotización.
            </p>
          </div>

          {publicProductsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[390px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          ) : publicProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publicProducts.map((product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,60,95,.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,60,95,.14)]"
                >
                  <div className="relative flex min-h-[235px] items-center justify-center overflow-hidden bg-[#f6fbff] p-7">
                    <img
                      src={product.image ?? ""}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#168df0]">
                      {product.brand && <span>{product.brand}</span>}
                      {product.category && <span>• {product.category}</span>}
                    </div>

                    <h3 className="mt-2 text-[22px] font-extrabold text-[#0b2a56]">
                      {product.name}
                    </h3>

                    {product.btu && (
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        {product.btu} BTU
                      </p>
                    )}

                    {product.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {product.description}
                      </p>
                    )}

                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        {typeof product.price === "number" ? (
                          <p className="text-[22px] font-black text-[#0b2a56]">
                            {new Intl.NumberFormat("es-DO", {
                              style: "currency",
                              currency: "DOP",
                              maximumFractionDigits: 0,
                            }).format(product.price)}
                          </p>
                        ) : (
                          <p className="font-bold text-[#0b2a56]">Consultar precio</p>
                        )}

                        {typeof product.stock === "number" && (
                          <p className="mt-1 text-xs text-slate-500">
                            {product.stock > 0 ? `${product.stock} disponible(s)` : "Agotado"}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="inline-flex items-center justify-center rounded-full bg-[#168df0] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0b7edb]"
                      >
                        Cotizar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-xl font-extrabold text-[#0b2a56]">
                No hay productos publicados en este momento
              </h3>
              <p className="mt-2 text-slate-600">
                Los equipos marcados como publicados en Supabase aparecerán aquí automáticamente.
              </p>
            </div>
          )}
        </div>
      </section>


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
      

      {/* ── FOOTER ── */}
            
      
      
      
      
      
      {/* NEXTER_PRODUCT_QUOTE_MODAL_UI */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#041f33]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Cotizar ${selectedProduct.name}`}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[30px] bg-white shadow-[0_30px_90px_rgba(0,0,0,.30)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-7 py-6">
              <div>
                <span className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#168df0]">
                  Detalles del producto
                </span>
                <h3 className="mt-2 text-2xl font-black text-[#0b2a56]">
                  {selectedProduct.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 transition hover:bg-slate-200"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="grid gap-7 p-7 md:grid-cols-[260px_1fr]">
              <div className="flex min-h-[240px] items-center justify-center rounded-[24px] bg-[#f5fbff] p-6">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="max-h-[220px] w-full object-contain"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#e5f5ff] text-4xl">
                    ❄
                  </div>
                )}
              </div>

              <div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  {selectedProduct.brand && (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Marca
                      </span>
                      <span className="mt-1 block font-bold text-[#0b2a56]">
                        {selectedProduct.brand}
                      </span>
                    </div>
                  )}

                  {selectedProduct.category && (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Categoría
                      </span>
                      <span className="mt-1 block font-bold text-[#0b2a56]">
                        {selectedProduct.category}
                      </span>
                    </div>
                  )}

                  {selectedProduct.btu && (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Capacidad
                      </span>
                      <span className="mt-1 block font-bold text-[#0b2a56]">
                        {selectedProduct.btu} BTU
                      </span>
                    </div>
                  )}

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Disponibilidad
                    </span>
                    <span className="mt-1 block font-bold text-[#0b2a56]">
                      {typeof selectedProduct.stock === "number"
                        ? selectedProduct.stock > 0
                          ? `${selectedProduct.stock} unidad(es)`
                          : "Agotado"
                        : "Consultar"}
                    </span>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div className="mt-5">
                    <h4 className="font-extrabold text-[#0b2a56]">Descripción</h4>
                    <p className="mt-2 leading-7 text-slate-600">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Precio
                    </span>
                    <p className="mt-1 text-2xl font-black text-[#0b2a56]">
                      {typeof selectedProduct.price === "number"
                        ? new Intl.NumberFormat("es-DO", {
                            style: "currency",
                            currency: "DOP",
                            maximumFractionDigits: 0,
                          }).format(selectedProduct.price)
                        : "Consultar precio"}
                    </p>
                  </div>

                  <a
                    href={buildProductWhatsAppUrl(selectedProduct)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#25D366] px-6 py-3 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#20bd5a]"
                  >
                    Cotizar por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

<footer id="contacto" className="relative overflow-hidden bg-[radial-gradient(circle_at_15%_100%,rgba(14,165,233,.11),transparent_30%),linear-gradient(105deg,#062f4a_0%,#073854_54%,#062f4a_100%)] text-white">
        {/* Subtle left-side geometry */}
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[48px] border-[#0ea5e9]/[0.04]" />

        {/* Nexter diagonal brand accents */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[310px] overflow-hidden lg:block">
          <div className="absolute -right-16 top-0 h-full w-[148px] skew-x-[-25deg] bg-[#f97316]" />
          <div className="absolute right-[76px] top-0 h-full w-[78px] skew-x-[-25deg] bg-[#20a8df]" />
          <div className="absolute right-[140px] top-0 h-full w-[64px] skew-x-[-25deg] bg-[#f97316]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1672px] px-[5.2%] py-11 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_.82fr_.92fr] lg:items-start lg:gap-0">
            {/* Text branding: no raster logo in footer */}
            <div className="max-w-[650px] lg:pr-16">
              <div className="inline-flex flex-col">
                <span className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.30em] text-[#46b8f2]">
                  Ingeniería & climatización
                </span>

                <div className="leading-none">
                  <span className="block text-[44px] font-black tracking-[-0.04em] text-[#168df0] sm:text-[50px]">
                    Nexter
                  </span>
                  <span className="mt-1 block text-[34px] font-black tracking-[-0.035em] text-[#f97316] sm:text-[40px]">
                    Ingeniería
                  </span>
                </div>

                <div className="mt-5 h-[3px] w-24 rounded-full bg-gradient-to-r from-[#168df0] to-[#f97316]" />
              </div>

              <p className="mt-6 max-w-[640px] text-[16px] leading-[1.75] text-slate-300">
                Climatización, mantenimiento, instalación y servicio técnico con
                soluciones pensadas para mantener tus espacios y tu operación en movimiento.
              </p>
            </div>

            {/* Services */}
            <div className="lg:border-l lg:border-white/20 lg:px-14">
              <h3 className="text-[20px] font-extrabold text-white">
                Nuestros servicios
              </h3>

              <div className="mt-6 space-y-[14px] text-[15px] text-slate-300">
                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-none stroke-[#18a8e5]" strokeWidth="1.8">
                    <path d="M12 2v20M4.22 6.5 19.78 17.5M19.78 6.5 4.22 17.5M7.5 4.22 16.5 19.78M16.5 4.22 7.5 19.78"/>
                  </svg>
                  <span>Instalación de aires</span>
                </div>

                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-none stroke-[#18a8e5]" strokeWidth="1.8">
                    <path d="M14.7 6.3a4 4 0 0 0-5.65 5.65L3 18l3 3 6.05-6.05a4 4 0 0 0 5.65-5.65l-2.1 2.1-3-3 2.1-2.1Z"/>
                  </svg>
                  <span>Mantenimiento preventivo</span>
                </div>

                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-none stroke-[#18a8e5]" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.17.37.39.71.66 1 .28.27.64.45 1.04.5h.1v4h-.1c-.4.05-.76.23-1.04.5-.27.29-.49.63-.66 1Z"/>
                  </svg>
                  <span>Reparación y diagnóstico</span>
                </div>

                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-none stroke-[#18a8e5]" strokeWidth="1.8">
                    <path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z"/>
                    <path d="m4.5 6.8 7.5 4.3 7.5-4.3M12 11.1V22"/>
                  </svg>
                  <span>Equipos y repuestos</span>
                </div>

                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-none stroke-[#18a8e5]" strokeWidth="1.8">
                    <path d="M12 22s7-3 7-9V5l-7-3-7 3v8c0 6 7 9 7 9Z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  <span>Asesoría profesional</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="lg:border-l lg:border-white/20 lg:pl-14 lg:pr-24">
              <h3 className="text-[20px] font-extrabold text-white">
                Contáctanos
              </h3>

              <div className="mt-6 space-y-[14px] text-[15px] text-slate-200">
                <a href="tel:+18297082720" className="flex items-center gap-4 transition hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-none stroke-[#39aef1]" strokeWidth="1.8">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>829-708-2720</span>
                </a>

                <a href="https://wa.me/18297082720" target="_blank" rel="noreferrer" className="flex items-center gap-4 transition hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-none stroke-[#73b9eb]" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M8.7 8.7c.5 3.5 3.1 6.1 6.6 6.6M8.7 8.7l1.5-.7 1.2 2.3-1 .9M15.3 15.3l.7-1.5-2.3-1.2-.9 1"/>
                  </svg>
                  <span>WhatsApp directo</span>
                </a>

                <a href="mailto:servicio@nexteringenieria.com" className="flex items-center gap-4 transition hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-none stroke-[#39aef1]" strokeWidth="1.8">
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <path d="m3 7 9 6 9-6"/>
                  </svg>
                  <span>servicio@nexteringenieria.com</span>
                </a>

                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-none stroke-[#73b9eb]" strokeWidth="1.8">
                    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/>
                    <circle cx="12" cy="10" r="2.5"/>
                  </svg>
                  <span>República Dominicana</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/20 pt-6 text-[13px] text-slate-300">
            <p>© 2026 Nexter Ingeniería. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
