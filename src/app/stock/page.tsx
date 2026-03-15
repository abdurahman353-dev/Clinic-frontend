"use client";

import { useState, useEffect, useMemo } from "react";
import { Package, AlertTriangle, Plus, Search, ArrowUpRight, ArrowDownRight, Loader2, X } from "lucide-react";
import { useStock } from "@/hooks/useStock";

export default function StockManagement() {
  const { medicines, isLoading, fetchMedicines, addMedicine, addStock } = useStock();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    fetchMedicines();
  }, [fetchMedicines]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : 0,
        initial_stock: formData.initial_stock ? parseInt(formData.initial_stock, 10) : 0,
        minimum_stock: formData.minimum_stock ? parseInt(formData.minimum_stock, 10) : 0,
        reorder_level: formData.reorder_level ? parseInt(formData.reorder_level, 10) : 0,
      };
      await addMedicine(payload);
      setIsAddItemModalOpen(false);
      setFormData({
        name: "", category: "Antibiotics", unit_price: "", description: "", size: "", unit: "tablets",
        dosage_form: "tablet", initial_stock: "", minimum_stock: "50", reorder_level: "100", batch_number: "", expiry_date: ""
      });
    } catch (err: any) {
      alert(err.message || "Failed to add new item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = useMemo(() => {
    return medicines.filter((item: any) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.id.toString().includes(searchTerm)
    );
  }, [medicines, searchTerm]);

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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Management</h1>
          <p className="text-slate-500 mt-1">Manage clinic inventory and supplies</p>
        </div>
        <button 
          onClick={() => setIsAddItemModalOpen(true)}
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
          <div className="flex items-center gap-2">
             <span className="flex items-center text-xs font-medium text-slate-500"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Critical</span>
             <span className="flex items-center text-xs font-medium text-slate-500 ml-3"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>Low</span>
             <span className="flex items-center text-xs font-medium text-slate-500 ml-3"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Good</span>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock Level</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
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
                        <div>
                          <div className="text-sm font-bold text-slate-900">{item.name} {item.size && `(${item.size})`}</div>
                          <div className="text-xs text-slate-500 mt-0.5">ID: {item.id} &bull; {item.dosage_form || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{item.category}</div>
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          isCritical ? 'bg-red-50 text-red-700 border-red-200' : 
                          isLow ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {isCritical && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => alert("Restock flow coming soon")} className="text-slate-400 hover:text-green-600 transition-colors p-1" title="Restock">
                            <ArrowUpRight className="h-5 w-5" />
                          </button>
                          <button onClick={() => alert("Dispense flow coming soon")} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Dispense/Adjust">
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

      {/* Add Item Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden mt-10 md:mt-0">
             <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add New Item to Inventory</h3>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddItemSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Item Details</h4></div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. Paracetamol" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select required name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Analgesics">Analgesics</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dosage Form</label>
                  <input type="text" name="dosage_form" value={formData.dosage_form} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. tablet, syrup, injection" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Size / Strength</label>
                   <input type="text" name="size" value={formData.size} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. 500mg" />
                </div>

                <div className="md:col-span-2"><h4 className="text-sm font-semibold text-slate-900 border-b pb-2 mt-2">Initial Stock Configuration</h4></div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Initial Quantity In Stock *</label>
                   <input required type="number" min="0" name="initial_stock" value={formData.initial_stock} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. 500" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Unit</label>
                     <input type="text" name="unit" value={formData.unit} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. tablets, boxes, bottles" />
                  </div>
                  <div className="flex-1">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price ($)</label>
                     <input type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="0.00" />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level (Alert when below)</label>
                   <input required type="number" min="0" name="reorder_level" value={formData.reorder_level} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. 100" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Safe Stock (Critical)</label>
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
                <button type="button" onClick={() => setIsAddItemModalOpen(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Add to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
