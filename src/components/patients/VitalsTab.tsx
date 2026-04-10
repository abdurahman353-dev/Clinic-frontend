"use client";

import { useState, useEffect } from "react";
import { Activity, Plus, TrendingUp, Loader2, Edit2, CheckCircle2, ArrowLeft, AlertTriangle } from "lucide-react";
import { useVitals } from "@/hooks/useVitals";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/Pagination";

export default function VitalsTab({
  patientId,
  onTotalChange,
  isInitialLoaded,
  onLoadComplete,
  initialData = [],
  isVisitPaid = false,
  activeVisitId = null,
  onStartNewVisit
}: {
  patientId?: number;
  onTotalChange: (total: number) => void;
  isInitialLoaded: boolean;
  onLoadComplete: () => void;
  initialData?: any[];
  isVisitPaid?: boolean;
  activeVisitId?: number | null;
  onStartNewVisit?: () => void;
}): React.JSX.Element {
  const { vitals, meta, isLoading, addVital, updateVital, fetchVitals, setVitals } = useVitals(patientId, initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
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
    notes: "",
    cost: ""
  });

  useEffect(() => {
    fetchVitals({ page: currentPage }).then(() => {
      if (!isInitialLoaded) onLoadComplete();
    });
  }, [fetchVitals, currentPage, isInitialLoaded, onLoadComplete]);

  useEffect(() => {
    if (meta?.total !== undefined) {
      onTotalChange(meta.total);
    }
  }, [meta, onTotalChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateBmi = () => {
    if (formData.weight && formData.height) {
      const w = parseFloat(formData.weight);
      const h = parseFloat(formData.height) / 100;
      if (h > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        setFormData(prev => ({ ...prev, bmi }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      vital_type: "routine", blood_pressure: "", pulse_rate: "", temperature: "",
      respiratory_rate: "", oxygen_saturation: "", weight: "", height: "", bmi: "", notes: "", cost: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      vital_type: "routine", blood_pressure: "", pulse_rate: "", temperature: "",
      respiratory_rate: "", oxygen_saturation: "", weight: "", height: "", bmi: "", notes: "", cost: ""
    });
    setShowForm(true);
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
      notes: vital.notes || "",
      cost: vital.cost || ""
    });
    setShowForm(true);
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const originalFormData = { ...formData };
    resetForm();

    try {
      if (editingId) {
        const vitalToEdit = vitals.find(v => v.id === editingId);
        if (!vitalToEdit) throw new Error("Vital record not found");
        await updateVital(vitalToEdit.visit_id, editingId, originalFormData);
        toast.success("Vitals updated successfully");
      } else {
        await addVital(originalFormData);
        toast.success("Vitals recorded successfully");
      }
    } catch (err: any) {
      // handled by api.js interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const latestVital = vitals?.[0] || {};

  // ── INLINE FORM VIEW ──────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className="space-y-6">
        {/* Form Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={resetForm}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Vitals
          </button>
          <span className="text-slate-300">/</span>
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? "Edit Vitals" : "Record New Vitals"}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-6 py-4 border-b border-slate-200">
            <p className="text-sm text-slate-600">
              {editingId ? "Update measurement data for this patient." : "Add measurement data for this patient."}
            </p>
          </div>

          <form onSubmit={handleRecord} className="p-6 space-y-6">
            {/* Vital Type */}
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Vital Type</label>
              <select
                name="vital_type"
                value={formData.vital_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="routine">Routine</option>
                <option value="emergency">Emergency / Triage</option>
                <option value="post-op">Post-Op</option>
              </select>
            </div>

            {/* Cardiovascular & Respiratory */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                  <Activity className="h-3 w-3 text-red-500" />
                </span>
                Cardiovascular &amp; Respiratory
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    name="blood_pressure"
                    placeholder="e.g. 120/80"
                    value={formData.blood_pressure}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="number"
                    name="pulse_rate"
                    placeholder="e.g. 72"
                    min="0"
                    value={formData.pulse_rate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Respiratory Rate (/min)</label>
                  <input
                    type="number"
                    name="respiratory_rate"
                    placeholder="e.g. 16"
                    min="0"
                    value={formData.respiratory_rate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    name="oxygen_saturation"
                    placeholder="e.g. 98"
                    min="0"
                    max="100"
                    value={formData.oxygen_saturation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Physical Measurements */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                </span>
                Physical Measurements
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Temperature (°C or °F)</label>
                  <input
                    type="text"
                    name="temperature"
                    placeholder="e.g. 37.0"
                    value={formData.temperature}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    placeholder="e.g. 70"
                    value={formData.weight}
                    onChange={handleChange}
                    onBlur={calculateBmi}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    placeholder="e.g. 175"
                    value={formData.height}
                    onChange={handleChange}
                    onBlur={calculateBmi}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    name="bmi"
                    placeholder="Auto-calculated"
                    value={formData.bmi}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm bg-slate-50 text-slate-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Notes & Billing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Any additional observations..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vitals Service Charge (KES)</label>
                <div className="relative mt-1 rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-500 sm:text-sm font-medium">KSh</span>
                  </div>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-slate-300 py-2 pl-12 pr-3 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500 italic">Fee to be billed for this patient encounter.</p>
              </div>
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
                disabled={isSubmitting}
                className="inline-flex items-center px-5 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors active:scale-[0.98]"
              >
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  : editingId ? "Save Changes" : "Save Vitals"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── TABLE VIEW ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {isVisitPaid && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900 leading-tight">Visit Closed (Fully Paid)</h3>
            <p className="text-xs text-amber-800 mt-1">
              This visit is already finalized or no active visit exists. To record new vitals, please <button 
                onClick={onStartNewVisit}
                className="font-black underline decoration-amber-300 hover:text-amber-950 transition-colors"
              >Start a New Visit</button> first.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-bold text-slate-900">Vitals History</h2>
        <button
          onClick={handleAdd}
          disabled={isVisitPaid}
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 h-9 px-4 shadow-sm
            ${isVisitPaid ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-primary-600 text-white hover:bg-primary-700'}
          `}
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
              { label: "Blood Pressure", value: latestVital.blood_pressure || "-", unit: "mmHg", color: "text-red-500", bg: "bg-red-50" },
              { label: "Heart Rate", value: latestVital.pulse_rate || "-", unit: "bpm", color: "text-rose-500", bg: "bg-rose-50" },
              { label: "Temperature", value: latestVital.temperature || "-", unit: "°", color: "text-amber-500", bg: "bg-amber-50" },
              { label: "Resp. Rate", value: latestVital.respiratory_rate || "-", unit: "/min", color: "text-blue-500", bg: "bg-blue-50" },
              { label: "SpO2 (Oxygen)", value: latestVital.oxygen_saturation || "-", unit: "%", color: "text-sky-500", bg: "bg-sky-50" },
            ].map((vital, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 truncate">{vital.label}</p>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">BP / HR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Temp / SpO2 / RR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Wt / Ht / BMI</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vitals Charge (KES)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Clinical Notes</th>
                      <th className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 text-sm">
                    {vitals.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">
                          {new Date(row.created_at).toLocaleDateString()}
                          <span className="text-slate-500 text-xs ml-1">
                            {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 capitalize">{row.vital_type || 'Routine'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {row.blood_pressure || '-'} mmHg<br />
                          <span className="text-xs text-slate-500">{row.pulse_rate || '-'} bpm</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {row.temperature || '-'}°<br />
                          <span className="text-xs text-slate-500">{row.oxygen_saturation || '-'}% &bull; {row.respiratory_rate || '-'}/m</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {row.weight ? row.weight + 'kg' : '-'} &bull; {row.height ? row.height + 'cm' : '-'}<br />
                          <span className="text-xs text-slate-500">BMI: {row.bmi || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-bold">
                          {row.cost ? `KSh ${row.cost}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={row.notes}>
                          {row.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!(row.is_cleared || isVisitPaid || (activeVisitId && row.visit_id && row.visit_id !== activeVisitId)) ? (
                            <button
                              onClick={() => handleEdit(row)}
                              className="text-slate-400 hover:text-primary-600 transition-colors p-1"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <div className="flex items-center justify-end text-slate-400 gap-1 opacity-60 pointer-events-none px-2 py-1" title="Locked by previous visit or payment">
                              <CheckCircle2 className="h-3 w-3" />
                              <span className="text-[10px] font-bold uppercase">Locked</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <Pagination
            meta={meta}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}
    </div>
  );
}