"use client";

import { useState, useEffect } from "react";
import { Plus, Pill, Loader2, Edit2, CheckCircle2, Trash2, ArrowLeft } from "lucide-react";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { toast } from "sonner";

interface PrescriptionItem {
  medicine_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: any;
}

export default function PrescriptionsTab({
  patientId,
  initialData,
  onDataChange,
  isInitialLoaded,
  onLoadComplete
}: {
  patientId?: number;
  initialData: any[];
  onDataChange: (data: any[]) => void;
  isInitialLoaded: boolean;
  onLoadComplete: () => void;
}): React.JSX.Element {
  const { prescriptions, medicines, isLoading, fetchPrescriptions, fetchMedicines, addPrescription, updatePrescription, setPrescriptions } = usePrescriptions(patientId);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PrescriptionItem[]>([
    { medicine_id: "", dosage: "", frequency: "", duration: "", quantity: 1 }
  ]);

  useEffect(() => {
    if (!isInitialLoaded) {
      Promise.all([fetchPrescriptions(), fetchMedicines()]).then(() => onLoadComplete());
    }
  }, [fetchPrescriptions, fetchMedicines, isInitialLoaded, onLoadComplete]);

  useEffect(() => {
    if (isInitialLoaded && prescriptions.length === 0 && initialData.length > 0) {
      setPrescriptions(initialData);
    }
  }, [initialData, isInitialLoaded, setPrescriptions, prescriptions.length]);

  useEffect(() => {
    if (prescriptions.length > 0) {
      onDataChange(prescriptions);
    }
  }, [prescriptions, onDataChange]);

  const addItem = () => {
    setItems([...items, { medicine_id: "", dosage: "", frequency: "", duration: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
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

    // Default to exact mapping (tablet, capsule, vial, ampoule, puff, etc.)
    return "exact";
  };

  const calculateQty = (item: PrescriptionItem, med: any, currentQty: any) => {
    const category = getFormCategory(med);
    if (category === "manual") return currentQty || 1; // User decides

    const dose = parseFloat(item.dosage) || 0;
    const freqMap: Record<string, number> = {
      "once a day": 1,
      "twice a day": 2,
      "thrice a day": 3,
      "four times a day": 4
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

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const newItems = [...items];
    const updatedItem = { ...newItems[index], [field]: value };

    // Auto-calculate QTY if it's not the manual QTY field being changed
    if (field !== "quantity") {
      const selectedMed = medicines.find(m => m.id == updatedItem.medicine_id);
      updatedItem.quantity = calculateQty(updatedItem, selectedMed, updatedItem.quantity);
    }

    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const resetForm = () => {
    setNotes("");
    setItems([{ medicine_id: "", dosage: "", frequency: "", duration: "", quantity: 1 }]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.some(item => !item.medicine_id || !item.dosage || !item.duration || !item.quantity)) {
      toast.error("Please fill all required fields for each medicine");
      return;
    }

    // Stock Validation
    const overStockItem = items.find(item => {
      const med = medicines.find(m => m.id == item.medicine_id);
      const stockQty = med?.stock?.quantity || 0;
      return item.quantity > stockQty;
    });

    if (overStockItem) {
      const medName = medicines.find(m => m.id == overStockItem.medicine_id)?.name || "Unknown Medicine";
      toast.error(`Quantity for ${medName} exceeds available stock`);
      return;
    }

    setIsSubmitting(true);

    const dataToSave = {
      notes,
      items: items.map(item => {
        const selectedMed = medicines.find(m => m.id == item.medicine_id);
        return {
          medicine_id: item.medicine_id,
          medicine: selectedMed ? selectedMed.name : "Unknown Medicine",
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: parseInt(item.quantity, 10) || 1
        };
      })
    };

    // Optimistic UI Updates
    setShowForm(false);
    toast.success(editingId ? "Prescription updated successfully!" : "Prescription saved instantly!");

    try {
      if (editingId) {
        await updatePrescription(editingId, dataToSave);
      } else {
        await addPrescription(dataToSave);
      }

      setEditingId(null);
      setNotes("");
      setItems([{ medicine_id: "", dosage: "", frequency: "", duration: "", quantity: 1 }]);
    } catch (err: any) {
      // API error caught visually, background refresh restores state
      // handled by api.js interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (rx: any) => {
    setEditingId(rx.id);
    setNotes(rx.notes || "");
    const rxItems = rx.items || [];
    if (rxItems.length > 0) {
      setItems(rxItems.map((item: any) => ({
        medicine_id: item.medicine_id?.toString() || "",
        dosage: item.dosage || "",
        frequency: item.frequency || "",
        duration: item.duration || "",
        quantity: item.quantity || 1
      })));
    } else {
      setItems([{ medicine_id: "", dosage: "", frequency: "", duration: "", quantity: 1 }]);
    }
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setNotes("");
    setItems([{ medicine_id: "", dosage: "", frequency: "", duration: "", quantity: 1 }]);
    setShowForm(true);
  };

  const isActive = (rx: any) => {
    if (!rx.duration || !rx.created_at) return false;
    const daysMatch = rx.duration.match(/(\d+)\s*day/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      const created = new Date(rx.created_at);
      const expires = new Date(created.setDate(created.getDate() + days));
      return new Date() <= expires;
    }
    return true;
  };

  // ── INLINE FORM VIEW ──────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={resetForm}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Prescriptions
          </button>
          <span className="text-slate-300">/</span>
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? "Edit Prescription" : "New Prescription"}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-6 py-4 border-b border-slate-200">
            <p className="text-sm text-slate-600">
              {editingId ? "Update prescription details for this patient." : "Add one or more medications for this patient."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Medicine Items */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center">
                  <Pill className="h-3 w-3 text-primary-600" />
                </span>
                Medications
              </h4>

              {items.map((item, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Medicine *</label>
                      <select
                        required
                        value={item.medicine_id}
                        onChange={(e) => updateItem(index, 'medicine_id', e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                      >
                        <option value="">Select Medicine</option>
                        {medicines.map((m: any) => (
                          <option key={m.id} value={m.id}>{m.name} - ${m.unit_price}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Dose *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder={(() => {
                            const med = item.medicine_id ? medicines.find(m => m.id == item.medicine_id) : null;
                            if (med && getFormCategory(med) === "manual") return "e.g. Apply thinly";
                            return "e.g. 1";
                          })()}
                          value={item.dosage}
                          onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        {(() => {
                          const med = item.medicine_id ? medicines.find(m => m.id == item.medicine_id) : null;
                          if (!med) return null;
                          const category = getFormCategory(med);
                          let suffix = med.unit;
                          if (category === "volume") suffix = "ml";
                          if (category === "manual") suffix = "";
                          if (!suffix) return null;
                          return (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                              {suffix}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Frequency *</label>
                      <select
                        required
                        value={item.frequency}
                        onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                      >
                        <option value="">Select frequency...</option>
                        <option value="once a day">once a day</option>
                        <option value="twice a day">twice a day</option>
                        <option value="thrice a day">thrice a day</option>
                        <option value="four times a day">four times a day</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={Number.isNaN(item.quantity) ? "" : item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value === "" ? "" : parseInt(e.target.value, 10) as any)}
                          className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-slate-50 font-bold text-primary-700"
                        />
                        {(() => {
                          const med = medicines.find(m => m.id == item.medicine_id);
                          if (med && med.stock?.quantity !== undefined && (Number(item.quantity) || 1) > med.stock.quantity) {
                            return <p className="text-red-500 text-[10px] mt-1 font-semibold">Exceeds stock ({med.stock.quantity} left)</p>;
                          }
                          return null;
                        })()}
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 p-2 mt-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Duration (days) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 5"
                      value={item.duration}
                      onChange={(e) => updateItem(index, 'duration', e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  
                  {item.medicine_id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Item Total</span>
                      <span className="font-bold text-primary-700">
                        KSh {(item.quantity * (medicines.find((m: any) => m.id == item.medicine_id)?.unit_price || 0)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Medication
              </button>
            </div>

            <div className="bg-primary-50 p-4 rounded-xl flex justify-between items-center mb-4">
              <span className="font-bold text-primary-900 border-b border-primary-200 pb-1">Grand Total</span>
              <span className="font-bold text-primary-800 text-xl">
                KSh {items.reduce((sum, item) => sum + (item.quantity * (medicines.find((m: any) => m.id == item.medicine_id)?.unit_price || 0)), 0).toFixed(2)}
              </span>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Prescription</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Why is this prescription being given?..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || items.some(i => !i.medicine_id)}
                className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  : editingId ? "Save Changes" : "Save Prescription"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── TABLE / CARDS VIEW ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Prescriptions</h2>
        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-9 px-4 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Prescription
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center text-slate-500 text-sm">
          No prescriptions recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((rx) => {
            const active = isActive(rx);
            const rxItems = rx.items || [];

            return (
              <div
                key={rx.id}
                className={`bg-white border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col h-full ${active ? 'border-primary-100' : 'border-slate-200'}`}
              >
                {active && (
                  <div className="absolute top-0 right-0 shadow-sm z-10">
                    <div className="bg-green-500 text-white text-[10px] uppercase font-bold tracking-wider py-1 px-3 rounded-bl-lg">Active</div>
                  </div>
                )}

                <div className="mb-4 pb-3 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-slate-500 font-medium">Prescription #{rx.id}</p>
                      {!rx.is_cleared ? (
                        <button
                          onClick={() => handleEdit(rx)}
                          className="text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 p-1 rounded-md transition-colors"
                          title="Edit Prescription"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      ) : (
                        <div className="flex items-center text-slate-400 gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span className="text-[8px] font-bold uppercase">Locked</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(rx.created_at).toLocaleDateString()}</p>
                  </div>
                  {rx.notes && (
                    <p className="text-xs text-slate-500 italic max-w-xs text-right bg-slate-50 p-2 rounded-md"><span className="font-semibold text-slate-700">Reason:</span> {rx.notes}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {rxItems.map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100"
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Pill className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className={`text-sm font-bold ${active ? 'text-slate-900' : 'text-slate-600'}`}>
                            {item.medicine || 'Unknown Medicine'}
                          </h3>
                          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border shadow-sm">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 divide-x divide-slate-200">
                          <div className="text-left">
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Dosage</span>
                            <span className="block text-xs font-semibold text-slate-700 truncate" title={item.dosage}>{item.dosage}</span>
                          </div>
                          <div className="px-2 text-left">
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Frequency</span>
                            <span className="block text-xs font-semibold text-slate-700 truncate" title={item.frequency || item.dosage}>{item.frequency || '-'}</span>
                          </div>
                          <div className="px-2 text-left">
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Duration</span>
                            <span className="block text-xs font-semibold text-slate-700 truncate" title={item.duration}>{item.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}