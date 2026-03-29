"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, Pill, User } from "lucide-react";
import { medicineAPI, stockAPI, prescriptionAPI } from "@/lib/api";
import { toast } from "sonner";

interface Medicine {
  id: number;
  name: string;
  unit_price: number;
}

interface Item {
  medicine_id: string;
  quantity: number;
  dosage: string;
  duration: string;
  medicine_name?: string;
}

interface DirectPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DirectPrescriptionModal({ isOpen, onClose, onSuccess }: DirectPrescriptionModalProps) {
  const [patientName, setPatientName] = useState("");
  const [items, setItems] = useState<Item[]>([{ medicine_id: "", quantity: 1, dosage: "", duration: "" }]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingMedicines(true);
        try {
          const [medsRes, stocksRes] = await Promise.all([
            medicineAPI.list(),
            stockAPI.list()
          ]);
          setMedicines(medsRes.data || []);
          setStocks(stocksRes.data || []);
        } catch (err) {
          console.error("Failed to load medicines", err);
          toast.error("Failed to load medicines. Please try again.");
        } finally {
          setIsLoadingMedicines(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addItem = () => {
    setItems([...items, { medicine_id: "", quantity: 1, dosage: "", duration: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }

    if (items.some(i => !i.medicine_id || i.quantity <= 0 || !i.dosage || !i.duration)) {
      toast.error("Please fill all medicine details");
      return;
    }

    // Check stock
    for (const item of items) {
      const stock = stocks.find(s => s.medicine_id === parseInt(item.medicine_id));
      if (!stock || stock.quantity < item.quantity) {
        toast.error(`Insufficient stock for ${medicines.find(m => m.id === parseInt(item.medicine_id))?.name}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await prescriptionAPI.storeDirect({
        patient_name: patientName,
        items: items.map(i => ({
          medicine_id: parseInt(i.medicine_id),
          quantity: i.quantity,
          dosage: i.dosage,
          duration: i.duration
        }))
      });
      toast.success("Direct prescription created successfully");
      onSuccess();
      onClose();
      // Reset form
      setPatientName("");
      setItems([{ medicine_id: "", quantity: 1, dosage: "", duration: "" }]);
    } catch (err) {
      console.error("Failed to create direct prescription", err);
    } finally {
      setIsSubmitting(false);
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
              <h2 className="text-lg font-bold text-slate-900">Direct Prescription</h2>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Walk-in Patient Medicine Purchase</p>
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
                <Pill className="h-4 w-4 text-primary-500" />
                Medicines
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-primary-600 hover:text-primary-700 text-sm font-bold flex items-center transition-colors"
              >
                <Plus className="h-4 w-4 mr-1 stroke-[3]" />
                Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-3 bg-white rounded-xl border border-slate-200 relative group transition-all hover:border-primary-300 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Medicine</label>
                      <select
                        required
                        value={item.medicine_id}
                        onChange={(e) => updateItem(index, "medicine_id", e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm text-slate-900"
                      >
                        <option value="">Select Medicine</option>
                        {isLoadingMedicines ? (
                          <option disabled>Loading...</option>
                        ) : (
                          medicines.map((m) => {
                            const stock = stocks.find(s => s.medicine_id === m.id);
                            const stockQty = stock ? stock.quantity : 0;
                            return (
                              <option key={m.id} value={m.id} disabled={stockQty <= 0}>
                                {m.name} ({stockQty} available)
                              </option>
                            );
                          })
                        )}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Dosage</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1x3"
                        value={item.dosage}
                        onChange={(e) => updateItem(index, "dosage", e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm text-slate-900"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Duration</label>
                      <input
                        type="text"
                        required
                        placeholder="5d"
                        value={item.duration}
                        onChange={(e) => updateItem(index, "duration", e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm text-slate-900"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Qty</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="absolute -top-2 -right-2 h-7 w-7 bg-white border border-red-100 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary-500/20"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 stroke-[3]" />
            )}
            Complete Prescription
          </button>
        </div>
      </div>
    </div>
  );
}
