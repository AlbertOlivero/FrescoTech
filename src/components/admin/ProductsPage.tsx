import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  Field,
  inputClass,
  primaryButtonClass,
  softButtonClass,
} from "./ui";

type ProductCategory = "Split" | "Central" | "Repuesto";

interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  btu: number | null;
  price: number | null;
  description: string;
  image: string;
  published: boolean;
  stock: number | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  name: "",
  category: "Split" as ProductCategory,
  brand: "",
  btu: "",
  price: "",
  stock: "",
  description: "",
  image: "",
  published: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    if (!supabase) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,category,brand,btu,price,description,image,published,stock,created_at,updated_at",
      )
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      setSuccess(false);
      setMessage(`No se pudieron cargar los productos: ${error.message}`);
      return;
    }

    setProducts((data ?? []) as Product[]);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    if (!form.name.trim() || !form.brand.trim()) {
      setSuccess(false);
      setMessage("Completa el nombre y la marca.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim(),
      btu: form.btu.trim() ? Number(form.btu) : null,
      price: form.price.trim() ? Number(form.price) : null,
      stock: form.stock.trim() ? Number(form.stock) : null,
      description: form.description.trim(),
      image: form.image.trim(),
      published: form.published,
    };

    setSaving(true);
    setMessage("");

    const result = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);

    setSaving(false);

    if (result.error) {
      setSuccess(false);
      setMessage(`No se pudo guardar: ${result.error.message}`);
      return;
    }

    setSuccess(true);
    setMessage(
      editingId
        ? "Producto actualizado correctamente."
        : "Producto registrado correctamente.",
    );

    resetForm();
    await loadProducts();
  }

  function editProduct(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      category: product.category,
      brand: product.brand,
      btu: product.btu === null ? "" : String(product.btu),
      price: product.price === null ? "" : String(product.price),
      stock: product.stock === null ? "" : String(product.stock),
      description: product.description ?? "",
      image: product.image ?? "",
      published: product.published,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function togglePublished(product: Product) {
    if (!supabase) return;

    const { error } = await supabase
      .from("products")
      .update({ published: !product.published })
      .eq("id", product.id);

    if (error) {
      setSuccess(false);
      setMessage(`No se pudo actualizar: ${error.message}`);
      return;
    }

    setSuccess(true);
    setMessage(
      product.published
        ? "Producto ocultado de la página."
        : "Producto publicado correctamente.",
    );

    await loadProducts();
  }

  async function deleteProduct(product: Product) {
    if (!supabase) return;

    if (!window.confirm(`¿Seguro que deseas eliminar "${product.name}"?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", product.id);

    if (error) {
      setSuccess(false);
      setMessage(`No se pudo eliminar: ${error.message}`);
      return;
    }

    if (editingId === product.id) resetForm();

    setSuccess(true);
    setMessage("Producto eliminado correctamente.");

    await loadProducts();
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-[Outfit] text-xl font-800">
                {editingId ? "Editar producto" : "Nuevo producto"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Precio, stock e imagen pueden actualizarse desde aquí.
              </p>
            </div>

            {editingId && (
              <button type="button" onClick={resetForm} className={softButtonClass}>
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={saveProduct} className="space-y-4">
            <Field label="Nombre">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoría">
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value as ProductCategory,
                    }))
                  }
                >
                  <option value="Split">Split</option>
                  <option value="Central">Central</option>
                  <option value="Repuesto">Repuesto</option>
                </select>
              </Field>

              <Field label="Marca">
                <input
                  className={inputClass}
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="BTU">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={form.btu}
                  onChange={(e) => setForm((f) => ({ ...f, btu: e.target.value }))}
                />
              </Field>

              <Field label="Precio RD$">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                />
              </Field>

              <Field label="Stock">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                />
              </Field>
            </div>

            <Field label="URL de imagen">
              <input
                className={inputClass}
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://..."
              />
            </Field>

            <Field label="Descripción">
              <textarea
                className={`${inputClass} min-h-28 resize-y`}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Field>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-md">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm((f) => ({ ...f, published: e.target.checked }))
                }
                className="h-5 w-5 accent-sky-600"
              />
              <span className="font-semibold text-slate-800">
                Publicar en la página
              </span>
            </label>

            <button disabled={saving} className={`${primaryButtonClass} w-full`}>
              {saving
                ? "Guardando..."
                : editingId
                  ? "Actualizar producto"
                  : "Guardar producto"}
            </button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h2 className="font-[Outfit] text-xl font-800">Catálogo</h2>
              <p className="mt-1 text-sm text-slate-500">
                {products.length} producto{products.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadProducts()}
              className={softButtonClass}
            >
              Actualizar
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {loading && (
              <div className="py-12 text-center text-sm text-slate-500">
                Cargando productos...
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-500">
                Todavía no hay productos registrados.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
                >
                  <div className="relative h-40 bg-slate-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-sm text-slate-400">
                        Sin imagen
                      </div>
                    )}

                    <span
                      className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                        product.published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {product.published ? "Publicado" : "Oculto"}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-[Outfit] text-lg font-800 text-slate-900">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {product.brand}
                      {product.btu ? ` · ${product.btu.toLocaleString()} BTU` : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {product.price !== null && (
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
                          RD$ {Number(product.price).toLocaleString("es-DO")}
                        </span>
                      )}
                      {product.stock !== null && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                          Stock: {product.stock}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => editProduct(product)}
                        className="rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-100 hover:shadow-md active:translate-y-0"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => void togglePublished(product)}
                        className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-md active:translate-y-0"
                      >
                        {product.published ? "Ocultar" : "Publicar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteProduct(product)}
                        className="col-span-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-md active:translate-y-0"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
