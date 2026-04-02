"use client";

import { FileText, Loader2, Search, Calendar, User, Pill, Plus, Trash2, Eye } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { prescriptionAPI, medicineAPI } from "@/lib/api";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import DirectPrescriptionModal from "@/components/prescriptions/DirectPrescriptionModal";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    patient_name: "",
    notes: "",
    items: [{ medicine_id: "", dosage: "", frequency: "", quantity: 1, duration: "" }]
  });

  const fetchPrescriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await prescriptionAPI.listGlobal();
      setPrescriptions(response.data || []);
    } catch (err) {
      console.error("Failed to fetch global prescriptions", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await medicineAPI.list();
      setMedicines(response.data || []);
    } catch (err) {
      console.error("Failed to fetch medicines", err);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchMedicines();
  }, [fetchPrescriptions]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { medicine_id: "", dosage: "", frequency: "", quantity: 1, duration: "" }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
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

  const calculateQty = (dose: any, freq: any, dur: any, med: any, currentQty: number) => {
    const category = getFormCategory(med);
    if (category === "manual") return currentQty || 1; // User decides

    const d = parseFloat(dose) || 0;
    const freqMap: Record<string, number> = {
      "once a day": 1,
      "twice a day": 2,
      "thrice a day": 3,
      "four times a day": 4
    };
    const f = freqMap[freq] || 0;
    const du = parseInt(dur) || 0;
    
    if (category === "volume") {
      const sizeStr = med?.size?.toString() || "1";
      const match = sizeStr.match(/(\d+(\.\d+)?)/);
      const bottleSize = match ? parseFloat(match[0]) : 1;
      
      const totalMl = d * f * du;
      const bottles = Math.ceil(totalMl / bottleSize);
      return bottles > 0 ? bottles : 1;
    }
    
    const result = Math.ceil(d * f * du);
    return result > 0 ? result : 1;
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const updatedItem = { ...newItems[index], [field]: value };
    
    if (field !== "quantity") {
      const selectedMed = medicines.find(m => m.id == updatedItem.medicine_id);
      updatedItem.quantity = calculateQty(updatedItem.dosage, updatedItem.frequency, updatedItem.duration, selectedMed, updatedItem.quantity);
    }
    
    newItems[index] = updatedItem;
    setFormData({ ...formData, items: newItems });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedPrescription(null);
    setFormData({
      patient_name: "",
      notes: "",
      items: [{ medicine_id: "", dosage: "", frequency: "", quantity: 1, duration: "" }]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rx: any) => {
    setIsEditing(true);
    setSelectedPrescription(rx);
    setFormData({
      patient_name: rx.patient_name || "",
      notes: rx.notes || "",
      items: rx.items.map((item: any) => ({
        medicine_id: item.medicine_id.toString(),
        dosage: item.dosage || "",
        quantity: item.quantity,
        frequency: item.frequency || "",
        duration: item.duration || ""
      }))
    });
    setIsModalOpen(true);
  };

  const openViewModal = (rx: any) => {
    setSelectedPrescription(rx);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_name || formData.items.some(item => !item.medicine_id)) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Stock Validation
    const overStockItem = formData.items.find(item => {
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
    // Optimistic UI updates
    setIsModalOpen(false);
    toast.success(isEditing ? "Prescription updated successfully!" : "Prescription saved instantly!");

    try {
      if (isEditing && selectedPrescription) {
        await prescriptionAPI.updateStandalone(selectedPrescription.id, formData);
      } else {
        await prescriptionAPI.storeStandalone(formData);
      }
      fetchPrescriptions();
    } catch (err) {
      console.error("Failed to save prescription", err);
      // Let global interceptor handle error visually, but re-sync
      fetchPrescriptions();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(rx =>
    rx.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rx.items?.some((item: any) => item.medicine?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Prescriptions</h1>
          <p className="text-slate-500 mt-1 text-sm">Global view of all medication prescriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search patient or medicine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Prescription
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 italic">
            No prescriptions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Medicines</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPrescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="text-sm font-medium text-slate-900">{rx.patient_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {rx.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center text-sm text-slate-700">
                            <Pill className="h-3.5 w-3.5 mr-2 text-primary-500" />
                            <span className="font-medium">{item.medicine}</span>
                            <span className="ml-2 text-slate-400 text-xs">{item.dosage}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rx.patient_id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                           In-patient
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                           Walk-in
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-40" />
                        {new Date(rx.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => openViewModal(rx)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!rx.patient_id && (
                          <button
                            onClick={() => openEditModal(rx)}
                            className="text-primary-600 hover:text-primary-700 font-semibold"
                          >
                            Edit
                          </button>
                        )}
                        {rx.patient_id && (
                          <Link href={`/patients/${rx.patient_id}?tab=prescriptions`} className="text-primary-600 hover:text-primary-700 font-semibold">
                            History
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for adding/editing standalone prescription */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Standalone Prescription" : "Add Standalone Prescription"}
        description={isEditing ? "Modify a walk-in prescription record." : "Create a prescription for a walk-in patient. This will generate an invoice."}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name *</label>
            <input
              type="text"
              required
              placeholder="Enter full name"
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-slate-900">Medicines</h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Medication
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Medicine *</label>
                    <select
                      required
                      value={item.medicine_id}
                      onChange={(e) => handleItemChange(index, 'medicine_id', e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                    >
                      <option value="">Select Medicine</option>
                      {medicines.map((m) => (
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
                        onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
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
                      onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
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
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value === "" ? "" : parseInt(e.target.value, 10))}
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
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
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
                      onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
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
          </div>

          <div className="bg-primary-50 p-4 rounded-xl flex justify-between items-center mb-4">
            <span className="font-bold text-primary-900 border-b border-primary-200 pb-1">Grand Total</span>
            <span className="font-bold text-primary-800 text-xl">
              KSh {formData.items.reduce((sum, item) => sum + (item.quantity * (medicines.find((m: any) => m.id == item.medicine_id)?.unit_price || 0)), 0).toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditing ? "Update Prescription" : "Save Prescription")}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Prescription Details"
        maxWidth="max-w-xl"
      >
        {selectedPrescription && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <User className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{selectedPrescription.patient_name}</h4>
                <p className="text-sm text-slate-500 flex items-center mt-0.5">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {new Date(selectedPrescription.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-semibold text-slate-900 flex items-center">
                <Pill className="h-4 w-4 mr-2 text-primary-500" />
                Prescribed Medicines
              </h5>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {selectedPrescription.items.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900">{item.medicine}</span>
                      <span className="text-xs font-medium px-2 py-1 bg-primary-50 text-primary-700 rounded-full">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    {(item.dosage || item.frequency || item.duration) && (
                      <div className="mt-2 text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        {item.dosage && <span>Dosage: <span className="font-semibold text-slate-700">{item.dosage}</span></span>}
                        {item.frequency && <span>Frequency: <span className="font-semibold text-slate-700">{item.frequency}</span></span>}
                        {item.duration && <span>Duration: <span className="font-semibold text-slate-700">{item.duration} days</span></span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedPrescription.notes && (
              <div className="space-y-2">
                <h5 className="font-semibold text-slate-900">Clinical Notes</h5>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 italic">
                  "{selectedPrescription.notes}"
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
