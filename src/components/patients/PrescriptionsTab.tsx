"use client";

import { useState, useEffect } from "react";
import { Plus, Pill, Loader2, Edit2, X, CheckCircle2, Trash2 } from "lucide-react";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

interface PrescriptionItem {
  medicine_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PrescriptionItem[]>([
    { medicine_id: "", dosage: "", frequency: "", duration: "", quantity: "1" }
  ]);

  useEffect(() => {
    if (!isInitialLoaded) {
      Promise.all([fetchPrescriptions(), fetchMedicines()]).then(() => onLoadComplete());
    }
  }, [fetchPrescriptions, fetchMedicines, isInitialLoaded, onLoadComplete]);

  // Sync internal prescriptions with lifted state
  useEffect(() => {
    if (isInitialLoaded && prescriptions.length === 0 && initialData.length > 0) {
      setPrescriptions(initialData);
    }
  }, [initialData, isInitialLoaded, setPrescriptions, prescriptions.length]);

  // Update lifted state when internal prescriptions change
  useEffect(() => {
    if (prescriptions.length > 0) {
      onDataChange(prescriptions);
    }
  }, [prescriptions, onDataChange]);

  const addItem = () => {
    setItems([...items, { medicine_id: "", dosage: "", frequency: "", duration: "", quantity: "1" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (items.some(item => !item.medicine_id || !item.dosage || !item.duration || !item.quantity)) {
      toast.error("Please fill all required fields for each medicine");
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

    try {
      if (editingId) {
        // When editing, we currently only support single item update for simplicity 
        // as per the existing backend delta logic concerns.
        await updatePrescription(editingId, dataToSave);
        toast.success("Prescription updated successfully");
      } else {
        await addPrescription(dataToSave);
        toast.success("Prescription added successfully");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNotes("");
      setItems([{ medicine_id: "", dosage: "", frequency: "", duration: "", quantity: "1" }]);
    } catch (err: any) {
      // toast.error is handled by api.js interceptor
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
        quantity: item.quantity?.toString() || "1"
      })));
    } else {
      setItems([{ medicine_id: "", dosage: "", frequency: "", duration: "", quantity: "1" }]);
    }
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setNotes("");
    setItems([{ medicine_id: "", dosage: "", frequency: "", duration: "", quantity: "1" }]);
    setIsModalOpen(true);
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
            const items = rx.items || [];

            return (
              <div key={rx.id} className={`bg-white border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col h-full ${active ? 'border-primary-100' : 'border-slate-200'}`}>
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
                  {rx.notes && <p className="text-xs text-slate-500 italic max-w-xs text-right bg-slate-50 p-2 rounded-md">{rx.notes}</p>}
                </div>

                <div className="space-y-4">
                   {items.map((item: any, idx: number) => (
                     <div key={item.id || idx} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-400'}`}>
                          <Pill className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <h3 className={`text-sm font-bold ${active ? 'text-slate-900' : 'text-slate-600'}`}>{item.medicine || 'Unknown Medicine'}</h3>
                             <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border shadow-sm">Qty: {item.quantity}</span>
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

      {/* Bulk Prescription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingId(null); }}
        title={editingId ? "Edit Prescription" : "Add Bulk Prescription"}
        description={editingId ? "Update prescription details" : "Add one or more medications for this patient"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group transition-all hover:border-primary-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Medicine *</label>
                    <select 
                      required 
                      value={item.medicine_id} 
                      onChange={(e) => updateItem(index, "medicine_id", e.target.value)} 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
                    >
                      <option value="">Select medicine...</option>
                      {medicines.map((m: any) => (
                        <option key={m.id} value={m.id} disabled={m.stock?.quantity <= 0}>
                          {m.name} {m.size ? `(${m.size})` : ''} ({m.stock?.quantity > 0 ? `${m.stock.quantity} left` : 'Out of Stock'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Dosage *</label>
                    <input 
                      required 
                      type="text" 
                      value={item.dosage} 
                      onChange={(e) => updateItem(index, "dosage", e.target.value)} 
                      placeholder="e.g. 1 tab" 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Duration *</label>
                    <input 
                      required 
                      type="text" 
                      value={item.duration} 
                      onChange={(e) => updateItem(index, "duration", e.target.value)} 
                      placeholder="5d" 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Qty *</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={(e) => updateItem(index, "quantity", e.target.value)} 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                    />
                  </div>
                  
                  <div className="md:col-span-12">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Frequency (Optional)</label>
                    <input 
                      type="text" 
                      value={item.frequency} 
                      onChange={(e) => updateItem(index, "frequency", e.target.value)} 
                      placeholder="e.g. 3 times a day" 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                    />
                  </div>
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="absolute -top-2 -right-2 h-7 w-7 bg-white border border-red-100 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-1.5 border border-primary-200 text-primary-600 text-xs font-bold rounded-lg hover:bg-primary-50 transition-colors"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add More Medicine
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">General Notes</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows={2} 
              placeholder="e.g. Take after meals, watch for allergies..." 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting || items.some(i => !i.medicine_id)} className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-all active:scale-[0.98]">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : editingId ? "Save Changes" : "Save All Prescriptions"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
