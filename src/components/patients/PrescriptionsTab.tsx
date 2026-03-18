"use client";

import { useState, useEffect } from "react";
<<<<<<< Updated upstream
import { Plus, Pill, Loader2, Edit2 } from "lucide-react";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import toast from "react-hot-toast";
=======
import { Plus, Pill, Loader2 } from "lucide-react";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
>>>>>>> Stashed changes
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

export function PrescriptionsTab({ patientId }: { patientId?: number }) {
  const { prescriptions, medicines, isLoading, fetchPrescriptions, fetchMedicines, addPrescription, updatePrescription } = usePrescriptions(patientId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    medicine_id: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: "1",
    notes: ""
  });

  useEffect(() => {
    fetchPrescriptions();
    fetchMedicines();
  }, [fetchPrescriptions, fetchMedicines]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const selectedMed = medicines.find(m => m.id == formData.medicine_id);
    const dataToSave = {
      notes: formData.notes,
      items: [{
        medicine_id: formData.medicine_id,
        medicine: selectedMed ? selectedMed.name : "Unknown Medicine",
        dosage: formData.dosage,
        frequency: formData.frequency,
        duration: formData.duration,
        quantity: parseInt(formData.quantity, 10) || 1
      }]
    };

    const currentEditingId = editingId;

    // Optimistic close
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ medicine_id: "", dosage: "", frequency: "", duration: "", quantity: "1", notes: "" });

    try {
<<<<<<< Updated upstream
      if (currentEditingId) {
        await updatePrescription(currentEditingId, dataToSave);
        toast.success("Prescription updated successfully");
      } else {
        await addPrescription(dataToSave);
        toast.success("Prescription added successfully");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save prescription");
      setIsModalOpen(true);
      if (currentEditingId) setEditingId(currentEditingId);
      setFormData(formData); // Use original flat formData
=======
      await addPrescription(formData);
      setIsModalOpen(false);
      setFormData({ medicine_id: "", dosage: "", frequency: "", duration: "", notes: "" });
      toast.success("Prescription added successfully");
      toast.success("Prescription added successfully");
    } catch (err: any) {
      // toast.error is handled by api.js interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (rx: any) => {
    setEditingId(rx.id);
    const item = rx.items?.[0] || {};
    setFormData({
      medicine_id: item.medicine_id?.toString() || "",
      dosage: item.dosage || "",
      frequency: item.frequency || "",
      duration: item.duration || "",
      quantity: item.quantity?.toString() || "1",
      notes: rx.notes || ""
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ medicine_id: "", dosage: "", frequency: "", duration: "", quantity: "1", notes: "" });
    setIsModalOpen(true);
  };

  // Helper to determine if prescription is still active based on duration and created_at
  const isActive = (rx: any) => {
    if (!rx.duration || !rx.created_at) return false;
    // VERY simple heuristic: if duration contains "days", check if current date is within that range
    const daysMatch = rx.duration.match(/(\d+)\s*day/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      const created = new Date(rx.created_at);
      const expires = new Date(created.setDate(created.getDate() + days));
      return new Date() <= expires;
    }
    return true; // Assume active if we can't parse
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
        <div className="grid grid-cols-1 gap-4">
          {prescriptions.map((rx) => {
            const active = isActive(rx);
            // The backend returns an 'items' array for each prescription
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
                       <button
                         onClick={() => handleEdit(rx)}
                         className="text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 p-1 rounded-md transition-colors"
                         title="Edit Prescription"
                       >
                         <Edit2 className="h-3 w-3" />
                       </button>
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

      {/* New Prescription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Prescription"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Medicine *</label>
            <select required name="medicine_id" value={formData.medicine_id} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <option value="">Select a medicine...</option>
              {medicines.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.size ? `(${m.size})` : ''} - {m.stock?.quantity > 0 ? `In Stock: ${m.stock.quantity}` : 'Out of Stock'}
                </option>
              ))}
            </select>
            {formData.medicine_id && medicines.find(m => m.id == formData.medicine_id)?.stock?.quantity === 0 && (
               <p className="mt-1 text-xs text-red-600 font-medium">Warning: Selected medicine is out of stock.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosage *</label>
              <input required type="text" name="dosage" value={formData.dosage} onChange={handleChange} placeholder="e.g. 1 Tablet, 5ml" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frequency *</label>
              <input required type="text" name="frequency" value={formData.frequency} onChange={handleChange} placeholder="e.g. 3 times a day" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>

              <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration *</label>
              <input required type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 7 days, 1 month" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to Dispense *</label>
                  <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Additional Instructions</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="e.g. Take after meals" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting || !formData.medicine_id} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Add Prescription"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
