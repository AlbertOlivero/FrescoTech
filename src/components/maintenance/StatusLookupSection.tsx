import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { BUSINESS } from "@/config/business";

type Status = "AL_DIA" | "PROXIMO" | "VENCIDO";
interface Row { equipment_id:string; brand:string; equipment_type:string; location:string; last_maintenance:string|null; recommended_months:number; status:Status; }

const inputClass = "w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-all duration-200 hover:border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

export default function StatusLookupSection() {
  const [identifier,setIdentifier] = useState("");
  const [rows,setRows] = useState<Row[]>([]);
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");

  useEffect(()=>{
    const q = new URLSearchParams(window.location.search);
    const value = q.get("correo") || q.get("email") || q.get("telefono") || "";
    if (value) { setIdentifier(value); void runLookup(value); }
  },[]);

  async function runLookup(value:string){
    if(!supabase || !value.trim()) return;
    setLoading(true); setMessage("");
    const {data,error}=await supabase.rpc("public_equipment_status_v2",{p_identifier:value.trim()});
    setLoading(false);
    if(error){ setRows([]); setMessage("No pudimos consultar ahora. Inténtalo nuevamente."); return; }
    const result=(data??[]) as Row[]; setRows(result); if(result.length===0)setMessage("No encontramos equipos asociados a ese correo o teléfono.");
  }
  function submit(e:FormEvent){e.preventDefault();void runLookup(identifier)}
  function wa(row:Row){
    const msg=`Hola ${BUSINESS.name}, quiero agendar mantenimiento para mi equipo ${row.brand} ${row.equipment_type} ubicado en ${row.location}.`;
    window.open(`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(msg)}`,"_blank","noopener,noreferrer");
  }
  return <section id="estado" className="bg-slate-50 py-16 sm:py-20"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">Consulta rápida</span><h2 className="mt-4 font-[Outfit] text-3xl font-800 text-slate-900 sm:text-4xl">Revisa el estado de tus equipos</h2><p className="mt-3 text-slate-500">Busca solamente con tu correo o número de teléfono. No necesitas cuenta.</p></div><form onSubmit={submit} className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl sm:flex-row"><input className={inputClass} value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Correo o teléfono"/><button className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg">{loading?"Consultando...":"Consultar"}</button></form>{message&&<p className="mt-5 text-center text-sm text-slate-500">{message}</p>}<div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map(row=><article key={row.equipment_id} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl"><div className="flex items-start justify-between gap-4"><div><div className="font-[Outfit] text-xl font-800 text-slate-900">{row.brand} {row.equipment_type}</div><div className="mt-1 text-sm text-slate-500">{row.location}</div></div><StatusBadge status={row.status}/></div><div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 transition group-hover:bg-brand-50"><div>Último mantenimiento: <b>{row.last_maintenance||"Sin registro"}</b></div><div className="mt-1">Frecuencia recomendada: <b>{row.recommended_months} meses</b></div></div><button onClick={()=>wa(row)} className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg">Agendar por WhatsApp</button></article>)}</div></div></section>;
}
function StatusBadge({status}:{status:Status}){const cls=status==="AL_DIA"?"bg-emerald-50 text-emerald-700":status==="PROXIMO"?"bg-amber-50 text-amber-700":"bg-red-50 text-red-700";return <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{status==="AL_DIA"?"AL DÍA":status==="PROXIMO"?"PRÓXIMO":"VENCIDO"}</span>}
