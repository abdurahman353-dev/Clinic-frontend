"use client";

import { useState, useEffect } from "react";
import { Plus, Pill, Loader2, X } from "lucide-react";
import { usePrescriptions } from "@/hooks/usePrescriptions";

export function PrescriptionsTab({ patientId }: { patientId?: number }) {
  const { prescriptions, medicines, isLoading, fetchPrescriptions, fetchMedicines, addPrescription } = usePrescriptions(patientId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    medicine_id: "",
    dosage: "",
    frequency: "",
    duration: "",
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
    try {
      await addPrescription(formData);
      setIsModalOpen(false);
      setFormData({ medicine_id: "", dosage: "", frequency: "", duration: "", notes: "" });
    } catch (err: any) {
      alert(err.message || "Failed to add prescription");
    } finally {
      setIsSubmitting(false);
    }
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
          onClick={() => setIsModalOpen(true)}
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
            // Medicine could be an object if eager loaded, or we just rely on medicine_id mapping
            // In API resources, we might have `medicine` object inside rx.
            const medName = rx.medicine?.name || medicines.find(m => m.id === rx.medicine_id)?.name || "Unknown Medicine";
            
            return (
              <div key={rx.id} className={`bg-white border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col h-full ${active ? 'border-primary-100' : 'border-slate-200'}`}>
                {active && (
                  <div className="absolute top-0 right-0 shadow-sm z-10">
                    <div className="bg-green-500 text-white text-[10px] uppercase font-bold tracking-wider py-1 px-3 rounded-bl-lg">Active</div>
                  </div>
                )}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Pill className="h-6 w-6" />
                  </div>
                  <div className="pr-12">
                    <h3 className={`text-base font-bold ${active ? 'text-slate-900' : 'text-slate-600'}`}>{medName}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Prescribed {new Date(rx.created_at).toLocaleDateString()}
                    </p>
                    {rx.notes && <p className="text-xs text-slate-400 mt-1 italic">{rx.notes}</p>}
                  </div>
                </div>
                
                <div className="mt-auto bg-slate-50 rounded-lg p-3 grid grid-cols-3 gap-2 divide-x divide-slate-200 border border-slate-100">
                  <div className="px-1 text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Dosage</span>
                    <span className="block text-sm font-medium text-slate-900 truncate" title={rx.dosage}>{rx.dosage}</span>
                  </div>
                  <div className="px-1 text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Frequency</span>
                    <span className="block text-sm font-medium text-slate-900 truncate" title={rx.frequency}>{rx.frequency}</span>
                  </div>
                  <div className="px-1 text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Duration</span>
                    <span className="block text-sm font-medium text-slate-900 truncate" title={rx.duration}>{rx.duration}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
             <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add Prescription</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration *</label>
                <input required type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 7 days, 1 month" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
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
          </div>
        </div>
      )}
    </div>
  );
}
