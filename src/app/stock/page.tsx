"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Package,
  AlertTriangle,
  Plus,
  PackagePlus,
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
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const BULK_DOSAGE_FORMS = ["tablet", "capsule", "syrup", "suspension", "injection", "ointment", "cream", "lotion", "drops", "inhaler", "sachet", "suppository"];
const BULK_UNITS = ["tablet", "capsule", "bottle", "vial", "ampoule", "tube", "sachet", "puff"];

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  availableCategories: string[];
  onEditCategory?: (cat: string, e: React.MouseEvent) => void;
  onDeleteCategory?: (cat: string, e: React.MouseEvent) => void;
  placeholder?: string;
  size?: "sm" | "md";
}

function CategoryDropdown({
  value,
  onChange,
  availableCategories,
  onEditCategory,
  onDeleteCategory,
  placeholder = "Select category...",
  size = "md"
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    return availableCategories.filter(cat =>
      cat.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableCategories, search]);

  const isExactMatch = availableCategories.some(
    cat => cat.toLowerCase() === search.trim().toLowerCase()
  );

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div
        className={`w-full ${size === 'sm' ? 'px-3 py-2 text-xs sm:text-sm' : 'px-3 py-2 text-sm'} border border-slate-300 rounded-md shadow-sm bg-white flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-primary-500 transition-all select-none hover:border-slate-400`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`truncate mr-2 ${value ? "text-slate-900 font-medium" : "text-slate-400"}`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 italic font-medium text-xs text-primary-600 bg-slate-50 flex items-center">
            <Search className="h-3 w-3 mr-2" /> Search or Add New
          </div>
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              autoFocus
              className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-slate-50 rounded-md placeholder-slate-400"
              placeholder="Search or type new..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (search.trim()) {
                    onChange(search.trim());
                    setIsOpen(false);
                    setSearch("");
                  }
                }
              }}
            />
          </div>
          <div className="max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 divide-y divide-slate-50">
            {filtered.map((cat) => (
              <div
                key={cat}
                className={`group px-3 py-2 text-xs sm:text-sm cursor-pointer hover:bg-primary-50 flex items-center justify-between transition-colors ${
                  value === cat ? 'bg-primary-50 text-primary-700 font-bold' : 'text-slate-700'
                }`}
                onClick={() => {
                  onChange(cat);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <div className="flex items-center truncate mr-2">
                  <span className="truncate">{cat}</span>
                  {value === cat && <Check className="h-3.5 w-3.5 ml-2 text-primary-600 flex-shrink-0" />}
                </div>
                {(onEditCategory || onDeleteCategory) && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {onEditCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCategory(cat, e);
                        }}
                        className="p-1 hover:bg-white rounded text-slate-400 hover:text-primary-600 shadow-sm border border-transparent hover:border-slate-100"
                        title="Rename category"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                    {onDeleteCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCategory(cat, e);
                        }}
                        className="p-1 hover:bg-white rounded text-slate-400 hover:text-red-600 shadow-sm border border-transparent hover:border-slate-100"
                        title="Delete category"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && !search.trim() && (
              <div className="px-3 py-3 text-xs text-slate-400 text-center italic">
                No categories available
              </div>
            )}

            {search.trim() && !isExactMatch && (
              <div
                className="px-3 py-2.5 text-xs sm:text-sm cursor-pointer hover:bg-primary-100/60 border-t border-slate-100 text-primary-700 font-bold flex items-center bg-primary-50/50 transition-colors"
                onClick={() => {
                  onChange(search.trim());
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <Plus className="h-4 w-4 mr-2 text-primary-600 flex-shrink-0" />
                <span className="truncate">Create &quot;{search.trim()}&quot;</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StockManagement() {
  const { medicines, meta, summary, allCategories, isLoading, fetchMedicines, addMedicine, updateMedicine, bulkAddMedicines, adjustStock, updateCategory, deleteCategory } = useStock();
  const { user } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Bulk Add New Items Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const emptyBulkRow = {
    name: "",
    category: "",
    dosage_form: "tablet",
    size: "",
    unit: "tablet",
    unit_price: "",
    buying_price: "",
    initial_stock: "",
    minimum_stock: "",
    reorder_level: "",
    batch_number: "",
    expiry_date: "",
    description: ""
  };
  const [bulkRows, setBulkRows] = useState<any[]>([{ ...emptyBulkRow }]);

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
    buying_price: "",
    description: "",
    size: "",
    unit: "tablet",
    dosage_form: "tablet",
    initial_stock: "",
    minimum_stock: "",
    reorder_level: "",
    batch_number: "",
    expiry_date: ""
  });

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const loadStock = useCallback(async (options: { silent?: boolean } = {}) => {
    const params: any = {
      'page': currentPage,
      'filter[search]': debouncedSearch
    };
    if (filter !== "all") {
      params['filter[status]'] = filter;
    }
    await fetchMedicines(params, options);
  }, [fetchMedicines, currentPage, debouncedSearch, filter]);

  useEffect(() => {
    if (user && !user.roles?.includes('super-admin')) {
      toast.error("Access denied. Only super-admins can access stock management.");
      router.push("/");
      return;
    }
    loadStock();
  }, [loadStock, user, router]);

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
      buying_price: formData.buying_price ? parseFloat(formData.buying_price) : null,
      initial_stock: formData.initial_stock ? parseFloat(formData.initial_stock) : 0,
      minimum_stock: formData.minimum_stock ? parseInt(formData.minimum_stock, 10) : 0,
      reorder_level: formData.reorder_level ? parseInt(formData.reorder_level, 10) : 0,
    };

    // Optimistic UI: Close modal immediately to feel lightning fast
    setIsAddItemModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "", category: "Antibiotics", unit_price: "", buying_price: "", description: "", size: "", unit: "tablet",
      dosage_form: "tablet", initial_stock: "", minimum_stock: "", reorder_level: "", batch_number: "", expiry_date: ""
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
      buying_price: item.stock?.buying_price?.toString() || "",
      description: item.description || "",
      size: item.size || "",
      unit: item.unit || "tablet",
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
      name: "", category: "Antibiotics", unit_price: "", buying_price: "", description: "", size: "", unit: "tablet",
      dosage_form: "tablet", initial_stock: "", minimum_stock: "", reorder_level: "", batch_number: "", expiry_date: ""
    });
    setIsAddItemModalOpen(true);
  };

  const handleOpenBulk = () => {
    setIsBulkModalOpen(true);
  };

  const addBulkRow = () => setBulkRows(prev => [...prev, { ...emptyBulkRow }]);

  const removeBulkRow = (index: number) => {
    setBulkRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const updateBulkRow = (index: number, field: string, value: string) => {
    setBulkRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const rowHasContent = (row: any) =>
    (row.name?.trim() || row.category?.trim() || row.size?.trim() ||
      row.unit_price !== "" || row.buying_price !== "" || row.initial_stock !== "" ||
      row.minimum_stock !== "" || row.reorder_level !== "" ||
      row.batch_number?.trim() || row.expiry_date || row.description?.trim());

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const filledRows = bulkRows.filter(rowHasContent);

    if (filledRows.length === 0) {
      toast.error("Add at least one new item.");
      return;
    }

    if (filledRows.some(row => !row.name?.trim())) {
      toast.error("Item name is required for every row.");
      return;
    }

    const payload = filledRows.map(row => {
      let finalSize = (row.size || "").trim();
      const isVolume = ["syrup", "suspension", "liquid", "drops"].includes((row.dosage_form || "").toLowerCase());
      if (finalSize && isVolume && /^\d+(\.\d+)?$/.test(finalSize)) {
        finalSize += " ml";
      }

      return {
        name: row.name.trim(),
        category: (row.category || "").trim() || null,
        unit_price: row.unit_price !== "" ? parseFloat(row.unit_price) : 0,
        description: (row.description || "").trim() || null,
        size: finalSize || null,
        unit: row.unit || null,
        dosage_form: row.dosage_form || null,
        initial_stock: row.initial_stock !== "" ? parseFloat(row.initial_stock) : 0,
        buying_price: row.buying_price !== "" ? parseFloat(row.buying_price) : null,
        minimum_stock: row.minimum_stock !== "" ? parseInt(row.minimum_stock, 10) : 0,
        reorder_level: row.reorder_level !== "" ? parseInt(row.reorder_level, 10) : 0,
        batch_number: (row.batch_number || "").trim() || null,
        expiry_date: row.expiry_date || null,
      };
    });

    setIsSubmitting(true);
    try {
      await bulkAddMedicines(payload);
      toast.success(`${payload.length} new ${payload.length === 1 ? 'item' : 'items'} added to inventory!`);
      setIsBulkModalOpen(false);
      setBulkRows([{ ...emptyBulkRow }]);
      setSearchTerm("");
      setDebouncedSearch("");
      setFilter("all");
      setCurrentPage(1);
    } catch (err) {
      // Global error handler in api.js shows the message
    } finally {
      setIsSubmitting(false);
    }
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

    const adjustment = parseFloat(adjustQty);
    const finalAdjustment = adjustType === "restock" ? adjustment : -adjustment;

    // Optimistic UI: Close modal and show success immediately
    setIsAdjustModalOpen(false);
    toast.success(adjustType === "restock" ? "Stock replenished successfully!" : "Stock dispensed successfully!");

    setIsSubmitting(true);
    try {
      await adjustStock(selectedItem.stock.id, finalAdjustment);
    } catch (err) {
      // Re-fetch to restore the correct state on error
      loadStock({ silent: true });
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

    const oldName = categoryToEdit;
    const nextName = newCategoryName;
    setIsEditCategoryModalOpen(false);
    toast.success(`Category "${oldName}" renamed to "${nextName}"`);
    if (formData.category === oldName) setFormData({ ...formData, category: nextName });
    setBulkRows(prev => prev.map(r => r.category === oldName ? { ...r, category: nextName } : r));

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

    const name = categoryToDelete;
    setIsDeleteCategoryModalOpen(false);
    toast.success(`Category "${name}" removed`);
    if (formData.category === name) setFormData({ ...formData, category: "Antibiotics" });
    setBulkRows(prev => prev.map(r => r.category === name ? { ...r, category: "" } : r));

    try {
      await deleteCategory(name);
    } catch (err) {
      // Hook handles state restoration
    }
  };

  const stats = useMemo(() => {
    return {
      totalItems: summary?.total || 0,
      lowStock: summary?.low || 0,
      critical: summary?.critical || 0
    };
  }, [summary]);

  const availableCategories = useMemo(() => {
    // Use server-fetched full list; also include currently selected category and bulk categories
    const current = formData.category ? [formData.category] : [];
    const bulkCats = bulkRows.map(r => r.category).filter(Boolean);
    return Array.from(new Set([...allCategories, ...current, ...bulkCats]));
  }, [allCategories, formData.category, bulkRows]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Management</h1>
          <p className="text-slate-500 mt-1">Manage clinic inventory and supplies</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenBulk}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 h-10 px-4 py-2 shadow-sm"
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Bulk Add Items
          </button>
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 py-2 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </button>
        </div>
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
              onClick={() => { setFilter("all"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All Items
            </button>
            <button
              onClick={() => { setFilter("low"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'low' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Low Stock
            </button>
            <button
              onClick={() => { setFilter("critical"); setCurrentPage(1); }}
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
          ) : medicines.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No items found matching your criteria.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Brand Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock Level</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price / Unit</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expiry</th>
                  <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {medicines.map((item: any) => {
                  const qty = item.stock?.quantity || 0;
                  const min = item.stock?.minimum_stock || 0;
                  const reorder = item.stock?.reorder_level || 0;

                  const isCritical = qty <= min;
                  const isLow = !isCritical && qty <= reorder;

                  // Calculate width capped at 100% relative to 3x reorder level
                  const safeDenominator = (reorder || min || 10) * 3;
                  const percentage = Math.min(100, (qty / safeDenominator) * 100);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="max-w-xs">
                          <div className="text-sm font-bold text-slate-900">{item.name} {item.size && `(${item.size})`}</div>
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
                        <div className="text-xs text-slate-500 mt-0.5">Selling / {item.unit || 'units'}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Buying: <span className="font-medium text-slate-700">KSh {item.stock?.buying_price ?? '0.00'}</span>
                        </div>
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

        {/* Pagination */}
        <Pagination
          meta={meta}
          onPageChange={(page) => setCurrentPage(page)}
        />
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
              <CategoryDropdown
                value={formData.category}
                onChange={cat => setFormData(prev => ({ ...prev, category: cat }))}
                availableCategories={availableCategories}
                onEditCategory={handleCategoryEdit}
                onDeleteCategory={handleCategoryDelete}
                placeholder="Select category..."
                size="md"
              />
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
              <input required type="number" min="0" step="0.01" name="initial_stock" value={formData.initial_stock} onChange={handleChange} disabled={!!editingId} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:opacity-50 disabled:bg-slate-50" placeholder="e.g. 500" />
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (KSh)</label>
                <input type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Buying Price (KSh)</label>
              <input type="number" step="0.01" min="0" name="buying_price" value={formData.buying_price} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Cost price per unit" />
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name</label>
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

      {/* Bulk Add New Items Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Add New Items"
        description="Create multiple new medications or supplies with their initial stock at once"
        maxWidth="max-w-6xl"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
            {bulkRows.map((row, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">New Item {index + 1}</h4>
                  {bulkRows.length > 1 && (
                    <button type="button" onClick={() => removeBulkRow(index)} className="text-slate-400 hover:text-red-600 transition-colors" title="Remove item">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Item Name *</label>
                    <input type="text" value={row.name} onChange={e => updateBulkRow(index, 'name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. Paracetamol" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                    <CategoryDropdown
                      value={row.category}
                      onChange={cat => updateBulkRow(index, 'category', cat)}
                      availableCategories={availableCategories}
                      onEditCategory={handleCategoryEdit}
                      onDeleteCategory={handleCategoryDelete}
                      placeholder="Select or create..."
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Dosage Form</label>
                    <select value={row.dosage_form} onChange={e => updateBulkRow(index, 'dosage_form', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                      <option value="">Select form...</option>
                      {BULK_DOSAGE_FORMS.map(form => (
                        <option key={form} value={form}>{form.charAt(0).toUpperCase() + form.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Size / Strength</label>
                    <input type="text" value={row.size} onChange={e => updateBulkRow(index, 'size', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. 500mg or 200ml" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tracking Unit</label>
                    <select value={row.unit} onChange={e => updateBulkRow(index, 'unit', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                      <option value="">Select unit...</option>
                      {BULK_UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Quantity in Stock</label>
                    <input type="number" min="0" step="0.01" value={row.initial_stock} onChange={e => updateBulkRow(index, 'initial_stock', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Defaults to 0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Selling Price (KSh)</label>
                    <input type="number" step="0.01" min="0" value={row.unit_price} onChange={e => updateBulkRow(index, 'unit_price', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Buying Price (KSh)</label>
                    <input type="number" step="0.01" min="0" value={row.buying_price} onChange={e => updateBulkRow(index, 'buying_price', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Cost per unit" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Reorder Level</label>
                    <input type="number" min="0" value={row.reorder_level} onChange={e => updateBulkRow(index, 'reorder_level', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Defaults to 0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Min. Safe Stock</label>
                    <input type="number" min="0" value={row.minimum_stock} onChange={e => updateBulkRow(index, 'minimum_stock', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Defaults to 0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Brand Name</label>
                    <input type="text" value={row.batch_number} onChange={e => updateBulkRow(index, 'batch_number', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Expiry Date</label>
                    <input type="date" value={row.expiry_date} onChange={e => updateBulkRow(index, 'expiry_date', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                    <textarea rows={2} value={row.description} onChange={e => updateBulkRow(index, 'description', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Optional notes..." />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button type="button" onClick={addBulkRow} className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
              <Plus className="h-4 w-4 mr-1" /> Add Another Item
            </button>
            <span className="text-xs text-slate-400">Blank rows are ignored</span>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Add Items"}
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
                  min="0.1"
                  step="0.01"
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
                    {Math.max(0, (selectedItem?.stock?.quantity || 0) - (parseFloat(adjustQty) || 0))} {selectedItem?.unit}
                  </span>
                </div>
              )}
              {adjustType === "restock" && (
                <div className="mt-2 flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-tighter">New Total Level</span>
                  <span className="text-green-600 font-mono">
                    {(selectedItem?.stock?.quantity || 0) + (parseFloat(adjustQty) || 0)} {selectedItem?.unit}
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
