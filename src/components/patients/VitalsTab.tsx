"use client";

import { useState, useEffect } from "react";
import { Activity, Plus, TrendingUp, Loader2, X, Edit2 } from "lucide-react";
import { useVitals } from "@/hooks/useVitals";
import toast from "react-hot-toast";

export default function VitalsTab({ patientId }: { patientId: number }) {
  const { vitals, isLoading, addVital, updateVital, fetchVitals } = useVitals(patientId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    vital_type: "routine",
    blood_pressure: "",
    pulse_rate: "",
    temperature: "",
    respiratory_rate: "",
    oxygen_saturation: "",
    weight: "",
    height: "",
    bmi: "",
    notes: ""
  });

  useEffect(() => {
    fetchVitals();
  }, [fetchVitals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateBmi = () => {
    if (formData.weight && formData.height) {
      const w = parseFloat(formData.weight);
      const h = parseFloat(formData.height) / 100; // if cm to m
      if (h > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        setFormData(prev => ({ ...prev, bmi }));
      }
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      vital_type: "routine", blood_pressure: "", pulse_rate: "", temperature: "",
      respiratory_rate: "", oxygen_saturation: "", weight: "", height: "", bmi: "", notes: ""
    });
    setIsModalOpen(true);
  };

  const handleEdit = (vital: any) => {
    setEditingId(vital.id);
    setFormData({
      vital_type: vital.vital_type || "routine",
      blood_pressure: vital.blood_pressure || "",
      pulse_rate: vital.pulse_rate || "",
      temperature: vital.temperature || "",
      respiratory_rate: vital.respiratory_rate || "",
      oxygen_saturation: vital.oxygen_saturation || "",
      weight: vital.weight || "",
      height: vital.height || "",
      bmi: vital.bmi || "",
      notes: vital.notes || ""
    });
    setIsModalOpen(true);
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dataToSave = { ...formData };
    const currentEditingId = editingId;
    
    // Optimistic close
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      vital_type: "routine", blood_pressure: "", pulse_rate: "", temperature: "",
      respiratory_rate: "", oxygen_saturation: "", weight: "", height: "", bmi: "", notes: ""
    });

    try {
      if (currentEditingId) {
        const vitalToEdit = vitals.find(v => v.id === currentEditingId);
        if (!vitalToEdit) throw new Error("Vital record not found");
        await updateVital(vitalToEdit.visit_id, currentEditingId, dataToSave);
        toast.success("Vitals updated successfully");
      } else {
        await addVital(dataToSave);
        toast.success("Vitals recorded successfully");
      }
    } catch (err: any) {
      alert(err.message || "Failed to record vitals");
      setIsModalOpen(true);
      if (currentEditingId) setEditingId(currentEditingId);
      setFormData(dataToSave);
    } finally {
      setIsSubmitting(false);
    }
  };

  const latestVital = vitals?.[0] || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-bold text-slate-900">Vitals History</h2>
        <button 
          onClick={handleAdd}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-9 px-4 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Record Vitals
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
           <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Blood Pressure", value: latestVital.blood_pressure || "-", unit: "mmHg", icon: Activity, color: "text-red-500", bg: "bg-red-50" },
              { label: "Heart Rate", value: latestVital.pulse_rate || "-", unit: "bpm", icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-50" },
              { label: "Temperature", value: latestVital.temperature || "-", unit: "°F", icon: Activity, color: "text-amber-500", bg: "bg-amber-50" },
              { label: "Resp. Rate", value: latestVital.respiratory_rate || "-", unit: "/min", icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "SpO2 (Oxygen)", value: latestVital.oxygen_saturation || "-", unit: "%", icon: Activity, color: "text-sky-500", bg: "bg-sky-50" },
            ].map((vital, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${vital.bg} flex items-center justify-center mb-3`}>
                  <vital.icon className={`h-4 w-4 ${vital.color}`} />
                </div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{vital.label}</p>
                <div className="mt-1 flex items-baseline gap-1 break-all">
                  <span className="text-2xl font-bold text-slate-900">{vital.value}</span>
                  <span className="text-sm font-medium text-slate-500">{vital.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[200px]">
              {vitals.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No vital signs recorded yet.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">BP / HR</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Temp / SpO2 / RR</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Wt / Ht / BMI</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 text-sm">
                    {vitals.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">
                          {new Date(row.created_at).toLocaleDateString()} <span className="text-slate-500 text-xs ml-1">{new Date(row.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 capitalize">
                          {row.vital_type || 'Routine'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {row.blood_pressure || '-'} mmHg <br/> <span className="text-xs text-slate-500">{row.pulse_rate || '-'} bpm</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {row.temperature || '-'}° <br/> <span className="text-xs text-slate-500">{row.oxygen_saturation || '-'}% &bull; {row.respiratory_rate || '-'}/m</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {row.weight ? row.weight+'kg' : '-'} &bull; {row.height ? row.height+'cm' : '-'} <br/>
                          <span className="text-xs text-slate-500">BMI: {row.bmi || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleEdit(row)} 
                            className="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 p-1.5 rounded-md inline-flex items-center justify-center transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Record Vitals Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden mt-10 md:mt-0">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{editingId ? "Edit Vitals Record" : "Record New Vitals"}</h3>
                <p className="text-sm text-slate-500">{editingId ? "Update existing measurement data" : "Add measurement data for this patient"}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleRecord} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vital Type</label>
                  <select name="vital_type" value={formData.vital_type} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="routine">Routine</option>
                    <option value="emergency">Emergency / Triage</option>
                    <option value="post-op">Post-Op</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 mt-2"><h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Cardiovascular & Respiratory</h4></div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure (mmHg)</label>
                  <input type="text" name="blood_pressure" placeholder="e.g. 120/80" value={formData.blood_pressure} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pulse Rate (bpm)</label>
                  <input type="number" name="pulse_rate" placeholder="e.g. 72" min="0" value={formData.pulse_rate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Respiratory Rate (/min)</label>
                  <input type="number" name="respiratory_rate" placeholder="e.g. 16" min="0" value={formData.respiratory_rate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SpO2 Oxygen (%)</label>
                  <input type="number" name="oxygen_saturation" placeholder="e.g. 98" min="0" max="100" value={formData.oxygen_saturation} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>

                <div className="md:col-span-2 mt-2"><h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Physical Measurements</h4></div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Temperature (°C or °F)</label>
                  <input type="text" name="temperature" placeholder="e.g. 37.0" value={formData.temperature} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" name="weight" placeholder="e.g. 70" value={formData.weight} onChange={handleChange} onBlur={calculateBmi} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                  <input type="number" name="height" placeholder="e.g. 175" value={formData.height} onChange={handleChange} onBlur={calculateBmi} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">BMI</label>
                  <input type="number" step="0.1" name="bmi" placeholder="Auto-calculated" value={formData.bmi} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-500 sm:text-sm" />
                </div>

                <div className="md:col-span-2 mt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes</label>
                  <textarea name="notes" rows={2} value={formData.notes} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Any additional observations..."></textarea>
                </div>

              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Save Vitals"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
