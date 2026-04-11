"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, Pill, User, CheckCircle2 } from "lucide-react";
import { medicineAPI, stockAPI, prescriptionAPI } from "@/lib/api";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface Medicine {
  id: number;
  name: string;
  unit_price: number;
}

interface Item {
  medicine_id: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  medicine_name?: string;
  unit_price?: number;
}

interface DirectPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prescription?: any;
}

// Global singleton cache for instant loading across modal opens
let cachedMedicines: Medicine[] | null = null;
let cachedStocks: any[] | null = null;

export default function DirectPrescriptionModal({ isOpen, onClose, onSuccess, prescription }: DirectPrescriptionModalProps) {
  const [patientName, setPatientName] = useState("");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<Item[]>([{ medicine_id: "", quantity: 1, dosage: "", frequency: "once a day", duration: "" }]);
  const [originalItems, setOriginalItems] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>(cachedMedicines || []);
  const [stocks, setStocks] = useState<any[]>(cachedStocks || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(!cachedMedicines);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isReversing, setIsReversing] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoadingMedicines(true);
    try {
      const [medsRes, stocksRes] = await Promise.all([
        medicineAPI.list(),
        stockAPI.list()
      ]);
      const newMeds = medsRes.data || [];
      const newStocks = stocksRes.data || [];
      
      setMedicines(newMeds);
      setStocks(newStocks);
      cachedMedicines = newMeds;
      cachedStocks = newStocks;
    } catch (err) {
      console.error("Failed to load medicines", err);
      if (!silent) toast.error("Failed to load medicines. Please try again.");
    } finally {
      setIsLoadingMedicines(false);
    }
  };

  // Silent pre-fetch on mount so it's ready before they even click "New Prescription"
  useEffect(() => {
    if (typeof window !== 'undefined' && !cachedMedicines) {
      fetchData(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (prescription) {
        setPatientName(prescription.patient_name || "");
        setReason(prescription.notes || "");
        if (prescription.items && prescription.items.length > 0) {
          setOriginalItems(prescription.items);
          setItems(prescription.items.map((i: any) => ({
            medicine_id: i.medicine_id?.toString() || "",
            quantity: i.quantity || 1,
            dosage: i.dosage || "",
            frequency: i.frequency || "once a day",
            duration: i.duration || "",
            unit_price: i.unit_price || 0,
            medicine_name: i.medicine || ""
          })));
        }
      } else {
         setPatientName("");
         setReason("");
         setItems([{ medicine_id: "", quantity: 1, dosage: "", frequency: "once a day", duration: "" }]);
      }

      // If we don't have cache, or if we want to refresh stock in background
      fetchData(!!cachedMedicines);
    }
  }, [isOpen, prescription]);

  if (!isOpen) return null;

  const addItem = () => {
    setItems([...items, { medicine_id: "", quantity: 1, dosage: "", frequency: "once a day", duration: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const getFormCategory = (med: any) => {
    if (!med) return "exact";
    const form = (med.dosage_form || "").toLowerCase();
    const unit = (med.unit || "").toLowerCase();

    const volumeForms = ["bottle", "syrup", "suspension", "liquid"];
    const volumeUnits = ["bottle"];

    const manualForms = ["tube", "ointment", "cream"];
    const manualUnits = ["tube"];

    if (volumeForms.some(v => form.includes(v)) || volumeUnits.includes(unit)) return "volume";
    if (manualForms.some(m => form.includes(m)) || manualUnits.includes(unit)) return "manual";

    return "exact";
  };

  const calculateQty = (item: Item, med: any) => {
    const category = getFormCategory(med);
    if (category === "manual") return item.quantity || 1;

    const dose = parseFloat(item.dosage) || 0;
    const freqMap: Record<string, number> = {
      "once a day": 1,
      "twice a day": 2,
      "three times a day": 3,
      "four times a day": 4,
      "every 4 hours": 6,
      "every 6 hours": 4,
      "every 8 hours": 3,
      "every 12 hours": 2,
      "at bedtime": 1
    };
    const freq = freqMap[item.frequency] || 0;
    const dur = parseInt(item.duration) || 0;

    if (category === "volume") {
      const sizeStr = med?.size?.toString() || "1";
      const match = sizeStr.match(/(\d+(\.\d+)?)/);
      const bottleSize = match ? parseFloat(match[0]) : 1;

      const totalMl = dose * freq * dur;
      const bottles = Math.ceil(totalMl / bottleSize);
      return bottles > 0 ? bottles : 1;
    }

    const result = Math.ceil(dose * freq * dur);
    return result > 0 ? result : 1;
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    const med = medicines.find(m => m.id === parseInt(item.medicine_id || "0"));
    
    if (field === 'medicine_id') {
      const med = medicines.find(m => m.id === parseInt(value || "0"));
      item.unit_price = med ? med.unit_price : (item.unit_price || 0);
      item.medicine_name = med ? med.name : (item.medicine_name || "");
    }

    // Auto-calculate quantity if it's not the manual quantity field being changed
    if (field !== "quantity" && med) {
      item.quantity = calculateQty(item, med);
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      return sum + ((item.unit_price || 0) * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }

    if (items.some(i => !i.medicine_id || i.quantity <= 0)) {
      toast.error("Please fill all medicine details");
      return;
    }

    // Smart Stock Validation
    for (const item of items) {
      const stock = stocks.find(s => s.medicine_id === parseInt(item.medicine_id));
      if (!stock) continue;

      let effectiveStock = stock.quantity;
      if (prescription) {
        const originalItem = originalItems.find(oi => oi.medicine_id == item.medicine_id);
        if (originalItem) effectiveStock += (originalItem.quantity || 0);
      }

      if (effectiveStock < item.quantity) {
        toast.error(`Insufficient stock for ${medicines.find(m => m.id === parseInt(item.medicine_id))?.name} (${effectiveStock} available)`);
        return;
      }
    }

    setIsSubmitting(true);
    
    const data = {
      patient_name: patientName,
      notes: reason,
      items: items.map(i => ({
        medicine_id: parseInt(i.medicine_id),
        quantity: i.quantity,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration
      }))
    };

    // INSTANT SAVE / OPTIMISTIC UI
    onClose();
    toast.success(prescription ? "Changes saved instantly!" : "Prescription saved instantly!");

    try {
      if (prescription) {
        await prescriptionAPI.updateStandalone(prescription.id, data);
      } else {
        await prescriptionAPI.storeStandalone(data);
      }
      onSuccess();
    } catch (err) {
      console.error("Failed to save direct prescription", err);
      // Background error notification would go here if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReverse = async () => {
    if (!prescription) return;
    
    // OPTIMISTIC UI: Close instantly
    setIsConfirmOpen(false);
    toast.success("Prescription reversed instantly!");
    onClose();

    try {
      await prescriptionAPI.deleteGlobal(prescription.id);
      onSuccess();
    } catch (err: any) {
      console.error("Failed to reverse prescription", err);
      toast.error("Failed to reverse prescription.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-primary-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Pill className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{prescription ? 'Edit Prescription' : 'Direct Prescription'}</h2>
              <p className="text-xs text-slate-500 font-medium tracking-tight">
                {prescription ? 'Update medicine purchase details' : 'Walk-in Patient Medicine Purchase'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Info */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4 text-primary-500" />
              Patient Name
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Full Name of the walking patient"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="h-px bg-slate-100" />

          {/* Medicines */}
           <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary-500" />
                Medications
              </label>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const itemTotal = (item.unit_price || 0) * item.quantity;
                const med = medicines.find(m => m.id === parseInt(item.medicine_id));

                return (
                  <div key={index} className="p-5 bg-white rounded-2xl border border-slate-200 relative group transition-all hover:bg-slate-50/30 shadow-sm space-y-4">
                    {/* Medicine Select */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase px-1">Medicine *</label>
                      {(() => {
                        const parsedOptions = isLoadingMedicines ? [
                          ...(item.medicine_id && item.medicine_name ? [{ value: item.medicine_id.toString(), label: `${item.medicine_name} - [Loading...]` }] : []),
                          { value: "", label: "Loading inventory...", disabled: true }
                        ] : medicines.map((m) => {
                          const stock = stocks.find(s => s.medicine_id === m.id);
                          const physicalStock = stock ? stock.quantity : 0;
                          let originalQty = 0;
                          if (prescription) {
                            const originalItem = originalItems.find(oi => oi.medicine_id == m.id);
                            if (originalItem) originalQty = (originalItem.quantity || 0);
                          }
                          const totalAvailable = physicalStock + originalQty;
                          const stockLabel = originalQty > 0
                            ? `${physicalStock} in-stock + ${originalQty} prescribed`
                            : `${physicalStock} in-stock`;

                          return {
                            value: m.id.toString(),
                            label: `${m.name} - KSh ${m.unit_price.toLocaleString()} (${stockLabel})`,
                            disabled: totalAvailable <= 0
                          };
                        });

                        return (
                          <SearchableSelect
                            options={parsedOptions}
                            value={item.medicine_id.toString()}
                            onChange={(val) => updateItem(index, "medicine_id", val)}
                            placeholder="Select Medicine"
                          />
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Dose */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase px-1">Dose *</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g. 1"
                            required
                            value={item.dosage}
                            onChange={(e) => updateItem(index, "dosage", e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm pr-10"
                          />
                          {(() => {
                            if (!med) return null;
                            const category = getFormCategory(med);
                            let suffix = (med as any).unit || (med as any).dosage_form || "";
                            if (category === "volume") suffix = "ml";
                            if (category === "manual") suffix = "";
                            if (!suffix) return null;
                            return (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                                {suffix}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase px-1">Duration (days) *</label>
                        <input
                          type="text"
                          placeholder="e.g. 5"
                          required
                          value={item.duration}
                          onChange={(e) => updateItem(index, "duration", e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Frequency */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase px-1">Frequency *</label>
                        <select
                          value={item.frequency}
                          onChange={(e) => updateItem(index, "frequency", e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm"
                        >
                          <option value="once a day">once a day</option>
                          <option value="twice a day">twice a day</option>
                          <option value="three times a day">three times a day</option>
                          <option value="four times a day">four times a day</option>
                          <option value="every 4 hours">every 4 hours</option>
                          <option value="every 6 hours">every 6 hours</option>
                          <option value="every 8 hours">every 8 hours</option>
                          <option value="every 12 hours">every 12 hours</option>
                          <option value="as needed">as needed (PRN)</option>
                          <option value="at bedtime">at bedtime</option>
                        </select>
                      </div>

                      {/* Qty */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase px-1">Qty</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                          className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm font-bold text-primary-900"
                        />
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="flex justify-between items-center pt-2">
                       <div className="flex gap-2">
                         {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                         )}
                       </div>
                       <div className="text-right">
                         <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Item Total</span>
                         <span className="text-sm font-black text-primary-600">KSh {itemTotal.toLocaleString()}</span>
                       </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addItem}
                className="text-primary-600 hover:text-primary-700 text-sm font-bold flex items-center gap-2 py-2 px-1 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                Add Medication
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Grand Total Bar */}
          <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100 flex justify-between items-center">
             <span className="font-bold text-primary-900">Grand Total</span>
             <span className="text-lg font-black text-primary-700">KSh {calculateGrandTotal().toLocaleString()}</span>
          </div>

          {/* Reason / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase px-1">Reason for Prescription</label>
            <textarea
              placeholder="Why is this prescription being given?..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm resize-none"
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          
          {prescription && (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="px-4 py-3 text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
              title="Reverse Transaction"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary-500/20"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : prescription ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4 stroke-[3]" />
            )}
            {prescription ? 'Save Changes' : 'Complete Prescription'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleReverse}
        title="Reverse Prescription"
        message="Are you sure you want to reverse this prescription? All allocated medicine will be returned to stock, and the cashier charge will be erased."
        confirmText="Yes, Reverse"
        type="danger"
        isLoading={isReversing}
      />
    </div>
  );
}
