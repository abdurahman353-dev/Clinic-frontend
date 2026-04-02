"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  X,
  Edit2,
  ChevronDown,
  Check,
  Trash2
} from "lucide-react";
import { useStock } from "@/hooks/useStock";
import { medicineAPI } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

  export default function StockManagement() {
  const { medicines, isLoading, fetchMedicines, addMedicine, updateMedicine, addStock, adjustStock, updateCategory, deleteCategory } = useStock();
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<"restock" | "dispense">("restock");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState("");

  // Category Management State
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "Antibiotics",
    unit_price: "",
    description: "",
    size: "",
    unit: "tablets",
    dosage_form: "tablet",
    initial_stock: "",
    minimum_stock: "50",
    reorder_level: "100",
    batch_number: "",
    expiry_date: ""
  });

  useEffect(() => {
    if (user && !user.roles?.includes('super-admin')) {
      toast.error("Access denied. Only super-admins can access stock management.");
      router.push("/");
      return;
    }
    fetchMedicines();
  }, [fetchMedicines, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalSize = formData.size.trim();
    const isVolume = ["syrup", "suspension", "liquid", "drops"].includes(formData.dosage_form.toLowerCase());
    if (finalSize && isVolume && /^\d+(\.\d+)?$/.test(finalSize)) {
      finalSize += " ml";
    }

    const payload = {
      ...formData,
      size: finalSize,
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : 0,
      initial_stock: formData.initial_stock ? parseInt(formData.initial_stock, 10) : 0,
      minimum_stock: formData.minimum_stock ? parseInt(formData.minimum_stock, 10) : 0,
      reorder_level: formData.reorder_level ? parseInt(formData.reorder_level, 10) : 0,
    };

    // Optimistic UI: Close modal immediately to feel lightning fast
    setIsAddItemModalOpen(false);
    setEditingId(null);
    const originalFormData = { ...formData };
    setFormData({
      name: "", category: "Antibiotics", unit_price: "", description: "", size: "", unit: "tablets",
      dosage_form: "tablet", initial_stock: "", minimum_stock: "50", reorder_level: "100", batch_number: "", expiry_date: ""
    });

    try {
      if (editingId) {
        await updateMedicine(editingId, payload);
        toast.success("Item updated successfully");
      } else {
        await addMedicine(payload);
        toast.success("Item added to inventory successfully!");
      }
    } catch (err: any) {
      // Global errorHandler in api.js handles this
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || "",
      category: item.category || "Antibiotics",
      unit_price: item.unit_price?.toString() || "",
      description: item.description || "",
      size: item.size || "",
      unit: item.unit || "tablets",
      dosage_form: item.dosage_form || "tablet",
      initial_stock: item.stock?.quantity?.toString() || "",
      minimum_stock: item.stock?.minimum_stock?.toString() || "50",
      reorder_level: item.stock?.reorder_level?.toString() || "100",
      batch_number: item.stock?.batch_number || "",
      expiry_date: item.stock?.expiry_date ? new Date(item.stock.expiry_date).toISOString().split('T')[0] : ""
    });
    setIsAddItemModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: "", category: "Antibiotics", unit_price: "", description: "", size: "", unit: "tablets",
      dosage_form: "tablet", initial_stock: "", minimum_stock: "50", reorder_level: "100", batch_number: "", expiry_date: ""
    });
    setIsAddItemModalOpen(true);
  };

  const handleOpenAdjust = (item: any, type: "restock" | "dispense") => {
    setSelectedItem(item);
    setAdjustType(type);
    setAdjustQty("");
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.stock?.id || !adjustQty) return;

    const adjustment = parseInt(adjustQty, 10);
    const finalAdjustment = adjustType === "restock" ? adjustment : -adjustment;

    // Optimistic UI: Close modal and show success immediately
    setIsAdjustModalOpen(false);
    toast.success(adjustType === "restock" ? "Stock replenished successfully!" : "Stock dispensed successfully!");

    setIsSubmitting(true);
    try {
      await adjustStock(selectedItem.stock.id, finalAdjustment);
    } catch (err) {
      // Re-fetch or handle error (api.js interceptor handles visual error)
      fetchMedicines();
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCategoryEdit = (oldName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToEdit(oldName);
    setNewCategoryName(oldName);
    setIsEditCategoryModalOpen(true);
  };

  const confirmCategoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryToEdit || !newCategoryName || newCategoryName === categoryToEdit) {
      setIsEditCategoryModalOpen(false);
      return;
    }

    // Optimistic Closure
    const oldName = categoryToEdit;
    const nextName = newCategoryName;
    setIsEditCategoryModalOpen(false);
    toast.success(`Category "${oldName}" renamed to "${nextName}"`);
    if (formData.category === oldName) setFormData({ ...formData, category: nextName });

    try {
      await updateCategory(oldName, nextName);
    } catch (err) {
      // Hook handles state restoration
    }
  };

  const handleCategoryDelete = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToDelete(name);
    setIsDeleteCategoryModalOpen(true);
  };

  const confirmCategoryDelete = async () => {
    if (!categoryToDelete) return;

    // Optimistic Closure
    const name = categoryToDelete;
    setIsDeleteCategoryModalOpen(false);
    toast.success(`Category "${name}" removed`);
    if (formData.category === name) setFormData({ ...formData, category: "Antibiotics" });

    try {
      await deleteCategory(name);
    } catch (err) {
      // Hook handles state restoration
    }
  };

  const filteredInventory = useMemo(() => {
    return medicines.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.id.toString().includes(searchTerm);

      if (filter === "all") return matchesSearch;

      const qty = item.stock?.quantity || 0;
      const min = item.stock?.minimum_stock || 0;
      const reorder = item.stock?.reorder_level || 0;

      if (filter === "critical") return matchesSearch && (qty <= min);
      if (filter === "low") return matchesSearch && (qty > min && qty <= reorder);

      return matchesSearch;
    });
  }, [medicines, searchTerm, filter]);

  const stats = useMemo(() => {
    let totalItems = 0;
    let lowStock = 0;
    let critical = 0;

    medicines.forEach((m: any) => {
      const qty = m.stock?.quantity || 0;
      const min = m.stock?.minimum_stock || 0;
      const reorder = m.stock?.reorder_level || 0;

      totalItems += 1;

      if (qty <= min) {
        critical += 1;
      } else if (qty <= reorder) {
        lowStock += 1;
      }
    });

    return { totalItems, lowStock, critical };
  }, [medicines]);

  const availableCategories = useMemo(() => {
    const defaults = ["Antibiotics", "Analgesics", "Consumables", "Cardiovascular"];
    const existing = Array.from(new Set(medicines.map((m: any) => m.category).filter(Boolean)));
    const current = formData.category ? [formData.category] : [];
    return Array.from(new Set([...defaults, ...existing, ...current]));
  }, [medicines, formData.category]);

  const filteredCategories = availableCategories.filter(cat => 
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Management</h1>
          <p className="text-slate-500 mt-1">Manage clinic inventory and supplies</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 py-2 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Items Cataloged</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalItems}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.lowStock}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Critical Alerts</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.critical}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilter("low")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'low' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setFilter("critical")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'critical' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Critical
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No items found matching your criteria.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock Level</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price / Unit</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expiry</th>
                  <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredInventory.map((item: any) => {
                  const qty = item.stock?.quantity || 0;
                  const min = item.stock?.minimum_stock || 0;
                  const reorder = item.stock?.reorder_level || 0;

                  const isCritical = qty <= min;
                  const isLow = !isCritical && qty <= reorder;
                  const statusLabel = isCritical ? 'Critical' : isLow ? 'Low Stock' : 'In Stock';

                  // Calculate width capped at 100% relative to 3x reorder level
                  const safeDenominator = (reorder || min || 10) * 3;
                  const percentage = Math.min(100, (qty / safeDenominator) * 100);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="max-w-xs">
                          <div className="text-sm font-bold text-slate-900">{item.name} {item.size && `(${item.size})`}</div>
                          {/* <div className="text-xs text-slate-500 mt-0.5">ID: {item.id} &bull; {item.dosage_form || 'N/A'}</div> */}
                          {item.description && <div className="text-[11px] text-slate-400 mt-1 line-clamp-1" title={item.description}>{item.description}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-400 font-mono">{item.stock?.batch_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                            {qty}
                          </span>
                          <span className="text-xs text-slate-500">{item.unit || 'units'}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden max-w-[120px]">
                          <div
                            className={`h-1.5 rounded-full ${isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Reorder at: {reorder} | Min: {min}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">KSh {item.unit_price || '0.00'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.unit || 'units'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.stock?.expiry_date ? (
                          <div className={`text-xs font-medium ${new Date(item.stock.expiry_date) < new Date() ? 'text-red-600 font-bold' :
                            new Date(item.stock.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-amber-600' : 'text-slate-600'
                            }`}>
                            {new Date(item.stock.expiry_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">No date</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-primary-600 transition-colors p-1" title="Edit Item">
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleOpenAdjust(item, "restock")} className="text-slate-400 hover:text-green-600 transition-colors p-1" title="Restock">
                            <ArrowUpRight className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleOpenAdjust(item, "dispense")} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Dispense/Adjust">
                            <ArrowDownRight className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => { setIsAddItemModalOpen(false); setEditingId(null); }}
        title={editingId ? "Edit Inventory Item" : "Add New Item to Inventory"}
        description={editingId ? "Update existing stock details" : "Add a new medication or supply to the clinic inventory"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleAddItemSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Item Details</h4></div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. Paracetamol" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <div className="relative">
                <div 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-primary-500 transition-all"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                >
                  <span className={formData.category ? "text-slate-900" : "text-slate-400"}>
                    {formData.category || "Select category..."}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </div>

                {isCategoryOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
                    <div className="p-2 border-b border-slate-100 italic font-medium text-xs text-primary-500 bg-slate-50 flex items-center">
                      <Search className="h-3 w-3 mr-2" /> Search or Add New
                    </div>
                    <div className="p-2">
                       <input 
                         type="text" 
                         autoFocus
                         className="w-full px-2 py-1.5 text-sm border-0 focus:ring-0 bg-slate-50 rounded-md"
                         placeholder="New or search..."
                         value={categorySearch}
                         onChange={(e) => setCategorySearch(e.target.value)}
                         onClick={(e) => e.stopPropagation()}
                       />
                    </div>
                    <div className="max-h-[130px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                      {filteredCategories.map((cat) => (
                        <div 
                          key={cat} 
                          className={`group px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 flex items-center justify-between transition-colors ${formData.category === cat ? 'bg-primary-50 text-primary-700 font-bold' : 'text-slate-600'}`}
                          onClick={() => {
                            setFormData({...formData, category: cat});
                            setIsCategoryOpen(false);
                            setCategorySearch("");
                          }}
                        >
                          <div className="flex items-center">
                            {cat}
                            {formData.category === cat && <Check className="h-3.5 w-3.5 ml-2 text-primary-500" />}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              type="button" 
                              onClick={(e) => handleCategoryEdit(cat, e)}
                              className="p-1 hover:bg-white rounded text-slate-400 hover:text-primary-600 shadow-sm border border-transparent hover:border-slate-100"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button 
                              type="button" 
                              onClick={(e) => handleCategoryDelete(cat, e)}
                              className="p-1 hover:bg-white rounded text-slate-400 hover:text-red-600 shadow-sm border border-transparent hover:border-slate-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {categorySearch && !availableCategories.includes(categorySearch) && (
                        <div 
                          className="px-3 py-3 text-sm cursor-pointer hover:bg-slate-50 border-t border-slate-100 text-primary-600 font-bold flex items-center bg-blue-50/30"
                          onClick={() => {
                            setFormData({...formData, category: categorySearch});
                            setIsCategoryOpen(false);
                            setCategorySearch("");
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Create "{categorySearch}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosage Form *</label>
              <select required name="dosage_form" value={formData.dosage_form} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium sm:text-sm appearance-none">
                <option value="">Select form...</option>
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="syrup">Syrup</option>
                <option value="suspension">Suspension</option>
                <option value="injection">Injection</option>
                <option value="ointment">Ointment</option>
                <option value="cream">Cream</option>
                <option value="lotion">Lotion</option>
                <option value="drops">Drops</option>
                <option value="inhaler">Inhaler</option>
                <option value="sachet">Sachet</option>
                <option value="suppository">Suppository</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Size / Strength {["syrup", "suspension", "liquid", "drops"].includes(formData.dosage_form.toLowerCase()) && "(volume in ml)"}
              </label>
              <input type="text" name="size" value={formData.size} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder={["syrup", "suspension", "liquid", "drops"].includes(formData.dosage_form.toLowerCase()) ? "e.g. 200" : "e.g. 500mg"} />
            </div>

            <div className="md:col-span-2"><h4 className="text-sm font-semibold text-slate-900 border-b pb-2 mt-2">Initial Stock Configuration</h4></div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity In Stock *</label>
              <input required type="number" min="0" name="initial_stock" value={formData.initial_stock} onChange={handleChange} disabled={!!editingId} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:opacity-50 disabled:bg-slate-50" placeholder="e.g. 500" />
              {editingId && <p className="text-xs text-slate-500 mt-1">Quantity adjust/restock in separate flow.</p>}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Unit *</label>
                <select required name="unit" value={formData.unit} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium sm:text-sm appearance-none">
                  <option value="">Select unit...</option>
                  <option value="tablet">tablet</option>
                  <option value="capsule">capsule</option>
                  <option value="bottle">bottle</option>
                  <option value="vial">vial</option>
                  <option value="ampoule">ampoule</option>
                  <option value="tube">tube</option>
                  <option value="sachet">sachet</option>
                  <option value="puff">puff</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (KSh)</label>
                <input type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
              <input required type="number" min="0" name="reorder_level" value={formData.reorder_level} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. 100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min. Safe Stock</label>
              <input required type="number" min="0" name="minimum_stock" value={formData.minimum_stock} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. 50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
              <input type="text" name="batch_number" value={formData.batch_number} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
              <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Any additional notes..." />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => { setIsAddItemModalOpen(false); setEditingId(null); }} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {editingId ? "Saving..." : "Adding..."}</> : editingId ? "Save Changes" : "Add to Inventory"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={adjustType === "restock" ? "Restock Item" : "Dispense / Adjust Stock"}
        description={adjustType === "restock" ? `Registering incoming supply for ${selectedItem?.name}` : `Reducing inventory level or dispensing ${selectedItem?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100/50 space-y-4">
            <div className="flex justify-between items-center text-sm font-bold text-slate-500">
              <span className="uppercase tracking-widest text-[10px]">Current Level</span>
              <span className="text-slate-900">{selectedItem?.stock?.quantity ?? 0} {selectedItem?.unit ?? 'units'}</span>
            </div>
            <div className="pt-2">
              <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">
                {adjustType === "restock" ? "Quantity to Add *" : "Quantity to Remove *"}
              </label>
              <div className="relative">
                <input
                  required
                  type="number"
                  min="1"
                  max={adjustType === "dispense" ? selectedItem?.stock?.quantity : undefined}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className={`w-full px-4 py-4 border-2 rounded-2xl focus:ring-4 font-bold text-xl transition-all outline-none ${adjustType === "restock"
                    ? "border-green-100 focus:ring-green-500/10 focus:border-green-500"
                    : "border-red-100 focus:ring-red-500/10 focus:border-red-500"
                    }`}
                  placeholder="0"
                />
              </div>
              {adjustType === "dispense" && selectedItem?.stock?.quantity > 0 && (
                <div className="mt-2 flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-tighter">Projected Balance</span>
                  <span className="text-red-600 font-mono">
                    {Math.max(0, (selectedItem?.stock?.quantity || 0) - (parseInt(adjustQty, 10) || 0))} {selectedItem?.unit}
                  </span>
                </div>
              )}
              {adjustType === "restock" && (
                <div className="mt-2 flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-tighter">New Total Level</span>
                  <span className="text-green-600 font-mono">
                    {(selectedItem?.stock?.quantity || 0) + (parseInt(adjustQty, 10) || 0)} {selectedItem?.unit}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !adjustQty}
              className={`w-full inline-flex items-center justify-center px-4 py-5 shadow-xl text-lg font-black rounded-2xl text-white transition-all active:scale-[0.98] disabled:opacity-50 ${adjustType === "restock"
                ? "bg-green-600 hover:bg-green-700 shadow-green-100"
                : "bg-red-600 hover:bg-red-700 shadow-red-100"
                }`}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Processing...</>
              ) : adjustType === "restock" ? (
                <><ArrowUpRight className="mr-2 h-6 w-6" /> Confirm Restock</>
              ) : (
                <><ArrowDownRight className="mr-2 h-6 w-6" /> Confirm Dispense</>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="w-full py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Edit Modal */}
      <Modal
        isOpen={isEditCategoryModalOpen}
        onClose={() => setIsEditCategoryModalOpen(false)}
        title="Rename Category"
        description={`Update the name for "${categoryToEdit}"`}
        maxWidth="max-w-md"
      >
        <form onSubmit={confirmCategoryEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">New Name</label>
            <input
              autoFocus
              required
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium"
              placeholder="Enter category name..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditCategoryModalOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newCategoryName || newCategoryName === categoryToEdit}
              className="flex-1 px-4 py-2 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteCategoryModalOpen}
        onClose={() => setIsDeleteCategoryModalOpen(false)}
        onConfirm={confirmCategoryDelete}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${categoryToDelete}"? This will remove the category label from ALL items using it.`}
        confirmText="Remove Category"
        type="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
