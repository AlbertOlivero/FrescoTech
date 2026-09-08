import { useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";
import { useQuoteCart } from "@/context/QuoteCartContext";
import { buildProductQuoteMessage, whatsappUrl } from "@/lib/whatsapp";
import type { ProductCategory } from "@/types/product";

const CATEGORIES: Array<"Todos" | ProductCategory> = ["Todos", "Split", "Central", "Repuesto"];
const BTUS = ["Todos", "12000", "18000", "36000"];

export default function CatalogSection() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [btu, setBtu] = useState("Todos");
  const { items, totalItems, addItem, changeQuantity, removeItem } = useQuoteCart();

  const filtered = useMemo(() => PRODUCTS.filter(product => {
    const matchesCategory = category === "Todos" || product.category === category;
    const matchesBtu = btu === "Todos" || product.btu === Number(btu);
    return matchesCategory && matchesBtu;
  }), [category, btu]);

  return (
    <section id="equipos" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="font-[Outfit,sans-serif] font-700 text-3xl sm:text-4xl text-slate-900 mb-3">Equipos y repuestos</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">Selecciona lo que necesitas y envíanos la lista completa por WhatsApp para confirmar precio, disponibilidad e instalación.</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-8 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Categoría</label>
            <select value={category} onChange={e => setCategory(e.target.value as (typeof CATEGORIES)[number])} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:outline-none text-slate-800 bg-white">
              {CATEGORIES.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Capacidad BTU</label>
            <select value={btu} onChange={e => setBtu(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:outline-none text-slate-800 bg-white">
              {BTUS.map(item => <option key={item} value={item}>{item === "Todos" ? "Todos" : `${Number(item).toLocaleString("es-DO")} BTU`}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(product => (
            <article key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <img src={product.image} alt={product.name} className="w-full h-48 object-cover bg-slate-100" />
              <div className="p-6">
                <div className="text-xs font-semibold text-brand-600 mb-2">{product.category}{product.btu ? ` · ${product.btu.toLocaleString("es-DO")} BTU` : ""}</div>
                <h3 className="font-[Outfit,sans-serif] font-700 text-xl text-slate-900 mb-2">{product.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">{product.description}</p>
                <button onClick={() => addItem(product)} className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all duration-200 active:scale-95">Agregar a cotización</button>
              </div>
            </article>
          ))}
        </div>

        {items.length > 0 && (
          <div className="mt-10 bg-white rounded-3xl border-2 border-slate-100 shadow-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h3 className="font-[Outfit,sans-serif] font-700 text-xl text-slate-900">Tu cotización</h3>
                <p className="text-sm text-slate-500">{totalItems} artículo{totalItems === 1 ? "" : "s"} seleccionado{totalItems === 1 ? "" : "s"}</p>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              {items.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.category}{item.btu ? ` · ${item.btu.toLocaleString("es-DO")} BTU` : ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQuantity(item.id, item.quantity - 1)} className="w-9 h-9 rounded-xl border-2 border-slate-200 text-slate-600">−</button>
                    <span className="w-6 text-center font-semibold">{item.quantity}</span>
                    <button onClick={() => changeQuantity(item.id, item.quantity + 1)} className="w-9 h-9 rounded-xl border-2 border-slate-200 text-slate-600">+</button>
                    <button onClick={() => removeItem(item.id)} className="ml-2 text-xs font-semibold text-red-500 hover:text-red-600">Quitar</button>
                  </div>
                </div>
              ))}
            </div>
            <a href={whatsappUrl(buildProductQuoteMessage(items))} target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-[Outfit,sans-serif] font-700 text-base transition-all duration-200 hover:shadow-xl hover:shadow-green-200 active:scale-95 flex items-center justify-center gap-3">Enviar cotización por WhatsApp</a>
          </div>
        )}
      </div>
    </section>
  );
}
