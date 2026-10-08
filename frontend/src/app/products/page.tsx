"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/AuthProvider";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { api } from "@/lib/api";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  X,
  Boxes,
  Warehouse,
  TrendingUp,
  Pencil,
  AlertTriangle,
  Store,
  Package,
  Loader2,
  Trash2,
  ChevronRight,
  CheckCircle2,
  ShoppingCart
} from "lucide-react";

interface DbProduct {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  unit_price: number;
  unit: string;
  moq: number;
  stock: number;
  stock_location: string | null;
  status: string;
  is_listed_on_marketplace: boolean;
  description: string | null;
  listing_id: string | null;
  created_at: string;
  updated_at: string;
}

const UNIT_GROUPS: { label: string; units: string[] }[] = [
  { label: "Pieces & Counts", units: ["Pieces (pcs)", "Units", "Each", "Pair", "Set", "Dozen", "Gross", "Bundle of 10", "Bundle of 100"] },
  { label: "Weight", units: ["Kilogram (kg)", "Gram (g)", "Milligram (mg)", "Tonne (MT)", "Metric Tonne (t)", "Quintal (q)", "Pound (lb)", "Ounce (oz)"] },
  { label: "Volume", units: ["Litre (L)", "Millilitre (mL)", "Cubic Metre (m\u00B3)", "Gallon (gal)", "Quart (qt)", "Pint (pt)"] },
  { label: "Length & Area", units: ["Metre (m)", "Centimetre (cm)", "Millimetre (mm)", "Kilometre (km)", "Foot (ft)", "Inch (in)", "Square Metre (m\u00B2)", "Square Foot (ft\u00B2)"] },
  { label: "Packaging & Containers", units: ["Box", "Carton", "Bag", "Sack", "Pallet", "Bundle", "Bale", "Roll", "Reel", "Drum", "Barrel", "Bucket", "Bottle", "Crate", "Tray", "Tube"] },
  { label: "Material Forms & Other", units: ["Sheet", "Coil", "Ingot", "Billet", "Slab", "Bar", "Rod", "Wire", "Kilowatt-hour (kWh)", "Hour (hr)", "Lot", "Batch", "Custom"] },
];

const ALL_UNITS: string[] = UNIT_GROUPS.flatMap((g) => g.units);

const CATEGORY_OPTIONS = [
  { value: "steel", label: "Steel" },
  { value: "plastics", label: "Plastics" },
  { value: "textiles", label: "Textiles" },
  { value: "aluminum", label: "Aluminum" },
  { value: "hardware", label: "Hardware" },
  { value: "chemicals", label: "Chemicals" },
  { value: "electronics", label: "Electronics" },
  { value: "food", label: "Food & Agriculture" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = ["Active", "Under Production", "On Hold", "Discontinued"] as const;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-base font-mono text-[#5C5040]">Loading Products Portfolio...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const { user, org, loading: authLoading } = useAuth();
  const currentOrg = useCurrentOrg();

  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("steel");
  const [formPrice, setFormPrice] = useState("");
  const [formMoq, setFormMoq] = useState("");
  const [formUnit, setFormUnit] = useState("Tonne (MT)");
  const [formStock, setFormStock] = useState("");
  const [formStockLocation, setFormStockLocation] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formListOnMarketplace, setFormListOnMarketplace] = useState(true);
  const [formStatus, setFormStatus] = useState<string>("Active");

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  const orgId = org?.id ?? null;

   useEffect(() => {
     if (authLoading) return;
     if (!org?.id) {
       setProducts([]);
       setLoading(false);
       return;
     }
     fetchProducts();
   }, [org?.id, authLoading]);

    async function fetchProducts() {
      if (!org?.id) return;
      setLoading(true);
      try {
        // Use the ApiClient which already has the token set from login
        const data = await api.request<DbProduct[]>('/products');
        setProducts(data);
      } catch (err) {
        console.error("Fetch products failed:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

  function resetForm() {
    setFormName("");
    setFormCategory("steel");
    setFormPrice("");
    setFormMoq("");
    setFormUnit("Tonne (MT)");
    setFormStock("");
    setFormStockLocation("");
    setFormDescription("");
    setFormListOnMarketplace(true);
    setFormStatus("Active");
  }

  function openAddModal() {
    setEditingProduct(null);
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(p: DbProduct) {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormPrice(String(p.unit_price));
    setFormUnit(p.unit);
    setFormMoq(String(p.moq));
    setFormStock(String(p.stock));
    setFormStockLocation(p.stock_location ?? "");
    setFormDescription(p.description ?? "");
    setFormListOnMarketplace(p.is_listed_on_marketplace);
    setFormStatus(p.status);
    setIsModalOpen(true);
  }

   async function handleSave() {
     if (!org?.id || !formName.trim() || saving) return;
     setSaving(true);

     const apiPayload = {
       name: formName.trim(),
       category: formCategory,
       unit_price: Number(formPrice) || 0,
       unit: formUnit,
       moq: Number(formMoq) || 0,
       stock: Number(formStock) || 0,
       description: formDescription.trim() || null,
     };

     try {
       if (editingProduct) {
         await api.request(`/products/${editingProduct.id}`, {
           method: "PATCH",
           body: JSON.stringify({
             name: formName.trim(),
             category: formCategory,
             unit_price: Number(formPrice) || 0,
             unit: formUnit,
             moq: Number(formMoq) || 0,
             stock: Number(formStock) || 0,
             description: formDescription.trim() || null,
           }),
         });

         // Sync or withdraw listing based on marketplace toggle
         if (formListOnMarketplace) {
           await api.request(`/products/${editingProduct.id}/sync-listing`, {
             method: "POST",
           });
         } else if (editingProduct.listing_id) {
           await api.request(`/products/${editingProduct.id}/withdraw-listing`, {
             method: "POST",
           });
         }

         showToast("Product updated");
       } else {
         const created = await api.request<Record<string, any>>('/products', {
           method: "POST",
           body: JSON.stringify(apiPayload),
         });

         // Sync listing if marketplace toggle is on
         if (formListOnMarketplace) {
           await api.request(`/products/${created.id}/sync-listing`, {
             method: "POST",
           });
         }

         showToast("Product created");
       }

       await fetchProducts();
       setIsModalOpen(false);
       resetForm();
     } catch (err: any) {
       console.error("Save failed:", err);
       showToast("Error: " + (err.message || "Save failed"));
     } finally {
       setSaving(false);
     }
   }

   async function handleDelete(p: DbProduct) {
     if (!org?.id) return;

     try {
       await api.request(`/products/${p.id}`, {
         method: "DELETE",
       });

       setProducts((prev) => prev.filter((x) => x.id !== p.id));
       showToast("Product deleted");
     } catch (err) {
       console.error("Delete failed:", err);
       showToast("Delete failed");
     }
   }

   async function toggleMarketplace(p: DbProduct) {
     try {
       const newVal = !p.is_listed_on_marketplace;

       if (newVal) {
         await api.request(`/products/${p.id}/sync-listing`, {
           method: "POST",
         });
       } else {
         await api.request(`/products/${p.id}/withdraw-listing`, {
           method: "POST",
         });
       }

       await fetchProducts();
       showToast(newVal ? "Listed on marketplace" : "Removed from marketplace");
     } catch (err) {
       console.error("Toggle marketplace failed:", err);
       showToast("Failed to update marketplace listing");
     }
   }

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => (categoryFilter === "all" || p.category === categoryFilter) && (statusFilter === "all" || p.status === statusFilter))
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const listedCount = products.filter((p) => p.is_listed_on_marketplace).length;
  const totalStock = products.reduce((s, p) => s + p.stock, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
        <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-[#6B5B3E]" />
            <p className="mt-4 text-sm text-[#5C5040]">Loading products...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">Products Portfolio</h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Manage your product catalog and list items on the BizzNet marketplace
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <Plus size={16} />
            Add New Product
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Total Products</span>
              <div className="p-2.5 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]"><Package size={20} /></div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">{products.length}</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">In your catalog</p>
          </div>
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Listed on Marketplace</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]"><Store size={20} /></div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2E7D5B] mt-3">{listedCount}</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Visible to all buyers</p>
          </div>
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Total Stock</span>
              <div className="p-2.5 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]"><Warehouse size={20} /></div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">{totalStock.toLocaleString("en-IN")}</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Aggregate inventory units</p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89B8A]" />
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E8E0D4] rounded-2xl py-16 px-6 text-center">
            <Boxes size={48} className="mx-auto text-[#A89B8A] mb-4" />
            <h3 className="text-lg font-extrabold text-[#2C2418]">
              {products.length === 0 ? "No products in your catalog yet" : "No products match the current filters"}
            </h3>
            <p className="text-sm text-[#8A7E6E] mt-1 max-w-md mx-auto">
              {products.length === 0
                ? "Use the Add New Product button to create your first catalog entry."
                : "Try clearing the search or filters."}
            </p>
            {products.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-xl text-sm font-bold transition-colors"
              >
                <Plus size={16} />
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#2C2418]">Product Catalog</h2>
                <p className="text-sm text-[#5C5040] font-semibold mt-0.5">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-sans">
                <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                  <tr>
                    <th className="py-3.5 px-6 font-extrabold">Product</th>
                    <th className="py-3.5 px-6 font-extrabold">Category</th>
                    <th className="py-3.5 px-6 font-extrabold">Price</th>
                    <th className="py-3.5 px-6 font-extrabold">MOQ</th>
                    <th className="py-3.5 px-6 font-extrabold">Stock</th>
                    <th className="py-3.5 px-6 font-extrabold">Status</th>
                    <th className="py-3.5 px-6 font-extrabold">Marketplace</th>
                    <th className="py-3.5 px-6 font-extrabold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D4]">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-[#2C2418] block">{p.name}</span>
                        {p.description && (
                          <span className="text-xs text-[#8A7E6E] line-clamp-1">{p.description}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full bg-[#F5F0E8] text-[#6B5B3E] text-xs font-mono font-bold capitalize">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-extrabold text-[#2C2418]">
                        ₹{Number(p.unit_price).toLocaleString("en-IN")}/{p.unit}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-[#2C2418]">{p.moq}</td>
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-[#2C2418]">{p.stock}</span>
                        {p.stock_location && (
                          <span className="block text-xs text-[#8A7E6E]">{p.stock_location}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                            p.status === "Active"
                              ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30"
                              : p.status === "Under Production"
                              ? "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                              : p.status === "On Hold"
                              ? "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                              : "bg-[#F0EBE3] text-[#8A7E6E] border-[#8A7E6E]/30"
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => toggleMarketplace(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            p.is_listed_on_marketplace
                              ? "bg-[#EEF7F2] text-[#2E7D5B] border border-[#2E7D5B]/30 hover:bg-[#d5f0e0]"
                              : "bg-[#F0EBE3] text-[#8A7E6E] border border-[#8A7E6E]/30 hover:bg-[#E8E0D4]"
                          }`}
                        >
                          {p.is_listed_on_marketplace ? <Eye size={14} /> : <EyeOff size={14} />}
                          {p.is_listed_on_marketplace ? "Listed" : "Unlisted"}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 rounded-lg text-[#6B5B3E] hover:bg-[#F5F0E8] transition-colors"
                            title="Edit product"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#2C2418]">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5">
                  {editingProduct ? "Update product details and marketplace listing" : "Fill in the form to add a product to your catalog"}
                </p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-1.5 rounded-lg text-[#A89B8A] hover:text-[#2C2418]">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Product Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Cold-Rolled Steel CR4 Sheet"
                    className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Unit Price (INR) *</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                    min="0"
                    placeholder="48200"
                    className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Unit *</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  >
                    {UNIT_GROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.units.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">MOQ *</label>
                  <input
                    type="number"
                    value={formMoq}
                    onChange={(e) => setFormMoq(e.target.value)}
                    required
                    min="0"
                    placeholder="50"
                    className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Stock Quantity *</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    required
                    min="0"
                    placeholder="140"
                    className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Stock Location</label>
                  <input
                    type="text"
                    value={formStockLocation}
                    onChange={(e) => setFormStockLocation(e.target.value)}
                    placeholder="Warehouse A, Jamshedpur"
                    className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your product specifications, grade, certifications..."
                  className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E] resize-y"
                />
              </div>

              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#EEF7F2] rounded-lg text-[#2E7D5B]">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#2C2418] block">List on Marketplace</span>
                    <span className="text-xs text-[#8A7E6E]">Make this product visible to all buyers on the BizzNet marketplace</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formListOnMarketplace}
                    onChange={(e) => setFormListOnMarketplace(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E8E0D4] peer-focus:ring-2 peer-focus:ring-[#6B5B3E] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-[#E8E0D4] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D5B]" />
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#E8E0D4]">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-5 py-2.5 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-[#5C5040] font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formName.trim()}
                  className="px-6 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingProduct ? "Update Product" : "Add Product & List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[60] bg-[#2C2418] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <CheckCircle2 size={16} className="text-[#2E7D5B]" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
