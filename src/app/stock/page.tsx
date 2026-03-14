import { Package, AlertTriangle, Plus, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StockManagement() {
  const inventory = [
    { id: "ITM-001", name: "Amoxicillin 500mg", category: "Antibiotics", stock: 450, minRequired: 200, unit: "tablets", status: "In Stock" },
    { id: "ITM-002", name: "Paracetamol 500mg", category: "Analgesics", stock: 1200, minRequired: 500, unit: "tablets", status: "In Stock" },
    { id: "ITM-003", name: "Surgical Masks", category: "Consumables", stock: 50, minRequired: 500, unit: "boxes", status: "Low Stock" },
    { id: "ITM-004", name: "Latex Gloves (M)", category: "Consumables", stock: 15, minRequired: 100, unit: "boxes", status: "Critical" },
    { id: "ITM-005", name: "Lisinopril 10mg", category: "Cardiovascular", stock: 320, minRequired: 150, unit: "tablets", status: "In Stock" },
    { id: "ITM-006", name: "Syringes (5ml)", category: "Consumables", stock: 80, minRequired: 200, unit: "pieces", status: "Low Stock" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Management</h1>
          <p className="text-slate-500 mt-1">Manage clinic inventory and supplies</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 py-2 shadow-sm">
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
              <p className="text-sm font-medium text-slate-500">Total Items</p>
              <h3 className="text-2xl font-bold text-slate-900">1,248</h3>
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
              <h3 className="text-2xl font-bold text-slate-900">12</h3>
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
              <h3 className="text-2xl font-bold text-slate-900">3</h3>
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
        <div className="overflow-x-auto">
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
              {inventory.map((item) => {
                const isLow = item.status === 'Low Stock';
                const isCritical = item.status === 'Critical';
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                          {item.stock}
                        </span>
                        <span className="text-xs text-slate-500">{item.unit}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden max-w-[120px]">
                        <div 
                           className={`h-1.5 rounded-full ${isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`} 
                           style={{ width: `${Math.min(100, (item.stock / (item.minRequired * 3)) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Min req: {item.minRequired}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        isCritical ? 'bg-red-50 text-red-700 border-red-200' : 
                        isLow ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {isCritical && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-slate-400 hover:text-green-600 transition-colors p-1" title="Restock">
                          <ArrowUpRight className="h-5 w-5" />
                        </button>
                        <button className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Dispense">
                          <ArrowDownRight className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
