"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Stethoscope, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  ChevronRight,
  Clock,
  History,
  FileText,
  Activity,
  Heart,
  AlertTriangle,
  UserPlus,
  ArrowRight,
  Clipboard,
  ShieldCheck,
  CheckSquare,
  Square,
  Save,
  Users,
  PlusCircle
} from "lucide-react";
import { consultationAPI, patientAPI } from "@/lib/api"; 
import { toast } from "sonner";
import { Pagination } from "@/components/ui/Pagination";

export default function ConsultationsTab({
  patientId,
  patient,
  onPatientUpdate,
  isVisitPaid = false,
  activeVisitId = null,
  onStartNewVisit
}: {
  patientId?: number;
  patient?: any;
  onPatientUpdate?: () => void;
  isVisitPaid?: boolean;
  activeVisitId?: number | null;
  onStartNewVisit?: () => void;
}): React.JSX.Element {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingPatient, setIsUpdatingPatient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [targetVisitId, setTargetVisitId] = useState<number | null>(activeVisitId);
  const [isPermLocked, setIsPermLocked] = useState(true);
  const [isVisitLocked, setIsVisitLocked] = useState(true);

  // Sync targetVisitId with activeVisitId on mount/change if not editing past
  useEffect(() => {
    if (!editingId) {
      setTargetVisitId(activeVisitId);
    }
  }, [activeVisitId, editingId]);

  // Initial locking logic: if we have an active visit consultation, lock by default
  useEffect(() => {
    const hasActiveConsultation = consultations.some(c => c.visit_id === activeVisitId);
    setIsPermLocked(true); // Permanent is always locked by default for safety
    setIsVisitLocked(hasActiveConsultation); // Visit is only locked if it already exists
  }, [consultations, activeVisitId]);

  // States for Consultation Form
  const [formData, setFormData] = useState({
    symptoms: "",
    symptoms_duration: "",
    previous_treatments: "",
    diagnosis: "",
    assessment: "",
    plan: "",
    follow_up_date: ""
  });

  // States for Permanent History (Local buffer before save)
  const [permHistory, setPermHistory] = useState({
    chronic_illnesses: "",
    surgeries: "",
    current_medications: "",
    allergies: "",
    family_history_notes: "",
    family_history_conditions: [] as string[]
  });

  const familyConditionsList = [
    "Heart Disease",
    "Hypertension",
    "Diabetes",
    "Cancer",
    "Asthma",
    "Mental Illness",
    "Tuberculosis"
  ];

  const lastLoadedId = useRef<number | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  // Hook 0: RESET (On Patient Swap)
  useEffect(() => {
    if (patientId) {
      setIsRestored(false); // Re-activate shield immediately
    }
  }, [patientId]);

  // THE FOREVER ENGINE: Manages Restoration, Persistence, and Real-Time DB Sync
  useEffect(() => {
    if (!patientId || !patient) return;

    const storageKey = `emr_forever_${patientId}`;
    
    // 1. INITIAL RESTORE (On Mount or Patient Swap)
    if (lastLoadedId.current !== patientId) {
      const savedSession = localStorage.getItem(storageKey);
      if (savedSession) {
        const { perm, form, locks } = JSON.parse(savedSession);
        if (perm) setPermHistory(perm);
        if (form) setFormData(form);
        if (locks) {
          setIsPermLocked(locks.perm);
          setIsVisitLocked(locks.visit);
        }
      } else {
        const famHistory = patient.family_history || {};
        setPermHistory({
          chronic_illnesses: patient.chronic_illnesses || "",
          surgeries: patient.surgeries || "",
          current_medications: patient.current_medications || "",
          allergies: patient.allergies || "",
          family_history_notes: famHistory.notes || "",
          family_history_conditions: famHistory.conditions || []
        });
      }
      lastLoadedId.current = patientId;
      setIsRestored(true);
      return; 
    }

    // 2. REAL-TIME PERSISTENCE (Every keystroke)
    if (isRestored) {
      const currentSession = {
        perm: permHistory,
        form: formData,
        locks: { perm: isPermLocked, visit: isVisitLocked }
      };
      
      // BLANK GUARD: Don't let an accidental initial-blank-render wipe a good vault
      const hasContent = permHistory.chronic_illnesses || permHistory.allergies || formData.symptoms;
      if (lastLoadedId.current === patientId && hasContent) {
        localStorage.setItem(storageKey, JSON.stringify(currentSession));
      }
    }

    // 3. DATABASE SYNC (When record is locked, pull fresh data from DB)
    if (isPermLocked && isRestored) {
      const dbValue = patient.chronic_illnesses || "";
      if (permHistory.chronic_illnesses !== dbValue) {
        const famHistory = patient.family_history || {};
        setPermHistory({
          chronic_illnesses: patient.chronic_illnesses || "",
          surgeries: patient.surgeries || "",
          current_medications: patient.current_medications || "",
          allergies: patient.allergies || "",
          family_history_notes: famHistory.notes || "",
          family_history_conditions: famHistory.conditions || []
        });
      }
    }
  }, [patient, patientId, permHistory, formData, isPermLocked, isVisitLocked, isRestored]);

  // Removed clearSessionBackup to ensure data stays 'forever' per user request

  const fetchConsultations = useCallback(async (page = 1) => {
    if (!patientId) return;
    setIsLoading(true);
    try {
      const response = await consultationAPI.listGlobal({ 
        'filter[patient_id]': patientId,
        'page': page
      });
      setConsultations(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error("Failed to load consultations", err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchConsultations(currentPage);
  }, [fetchConsultations, currentPage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPermHistory(prev => ({ ...prev, [name]: value }));
  };

  const toggleFamilyCondition = (condition: string) => {
    setPermHistory(prev => {
      const conditions = prev.family_history_conditions.includes(condition)
        ? prev.family_history_conditions.filter(c => c !== condition)
        : [...prev.family_history_conditions, condition];
      return { ...prev, family_history_conditions: conditions };
    });
  };

  const currentVisitConsultation = consultations.find(c => c.visit_id === activeVisitId);

  // Sync consultation form with current visit data (Only if locked/no draft)
  useEffect(() => {
    if (currentVisitConsultation && !isRestored && !editingId) {
      setFormData({
        symptoms: currentVisitConsultation.symptoms || "",
        symptoms_duration: currentVisitConsultation.symptoms_duration || "",
        previous_treatments: currentVisitConsultation.previous_treatments || "",
        diagnosis: currentVisitConsultation.diagnosis || "",
        assessment: currentVisitConsultation.assessment || "",
        plan: currentVisitConsultation.plan || "",
        follow_up_date: currentVisitConsultation.follow_up_date || ""
      });
      setEditingId(currentVisitConsultation.id);
    }
  }, [currentVisitConsultation, isRestored, editingId]);

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVisitId || !patientId) {
      toast.error("No valid visit selected for recording.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update Permanent History ONLY if it was unlocked (intentionally edited)
      if (!isPermLocked) {
        await patientAPI.update(patientId, {
          chronic_illnesses: permHistory.chronic_illnesses,
          surgeries: permHistory.surgeries,
          current_medications: permHistory.current_medications,
          allergies: permHistory.allergies,
          family_history: {
            notes: permHistory.family_history_notes,
            conditions: permHistory.family_history_conditions
          }
        });
        if (onPatientUpdate) onPatientUpdate();
      }
      
      // 2. Save/Update Consultation Snapshot
      const snapshotPayload = {
        ...formData,
        chronic_illnesses: permHistory.chronic_illnesses,
        surgeries: permHistory.surgeries,
        current_medications: permHistory.current_medications,
        allergies: permHistory.allergies,
        family_history: {
          notes: permHistory.family_history_notes,
          conditions: permHistory.family_history_conditions
        }
      };

      if (editingId) {
        await consultationAPI.update(targetVisitId, editingId, snapshotPayload);
        toast.success("Medical record and clinical notes updated");
        
        // PERF: Optimistic UI Update for instant timeline reflection
        setConsultations(prev => prev.map(c => 
          c.id === editingId ? { ...c, ...snapshotPayload, visit_date: c.visit_date, visit_id: c.visit_id, doctor_name: c.doctor_name, vitals: c.vitals } : c
        ));
      } else {
        const response = await consultationAPI.store(targetVisitId, snapshotPayload);
        toast.success("Medical record and clinical notes saved");
        // For new records, we still fetch to get the proper ID from server, 
        // but the manual fetch below handles it.
      }
      fetchConsultations(currentPage);
      
      setIsPermLocked(true);
      setIsVisitLocked(true);
    } catch (err) {
      console.error("Save error", err);
      toast.error("Failed to save full record. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPast = (note: any) => {
    setEditingId(note.id);
    setTargetVisitId(note.visit_id); // Target this specific past visit
    setFormData({
      symptoms: note.symptoms || "",
      symptoms_duration: note.symptoms_duration || "",
      previous_treatments: note.previous_treatments || "",
      diagnosis: note.diagnosis || "",
      assessment: note.assessment || "",
      plan: note.plan || "",
      follow_up_date: note.follow_up_date || ""
    });
    
    // Load snapshot history into the form buffer
    setPermHistory({
      chronic_illnesses: note.chronic_illnesses || "",
      surgeries: note.surgeries || "",
      current_medications: note.current_medications || "",
      allergies: note.allergies || "",
      family_history_notes: note.family_history?.notes || "",
      family_history_conditions: note.family_history?.conditions || []
    });

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPermLocked(false); 
    setIsVisitLocked(false); 
    toast.info(`Editing Clinical Record for Visit #${note.visit_id}`);
  };

  const resetToCurrentVisit = () => {
    const current = consultations.find(c => c.visit_id === activeVisitId);
    setEditingId(current?.id || null);
    setTargetVisitId(activeVisitId);
    if (current) {
      setFormData({
        symptoms: current.symptoms || "",
        symptoms_duration: current.symptoms_duration || "",
        previous_treatments: current.previous_treatments || "",
        diagnosis: current.diagnosis || "",
        assessment: current.assessment || "",
        plan: current.plan || "",
        follow_up_date: current.follow_up_date || ""
      });
    } else {
      setFormData({
        symptoms: "",
        symptoms_duration: "",
        previous_treatments: "",
        diagnosis: "",
        assessment: "",
        plan: "",
        follow_up_date: ""
      });
    }
  };

  const handleUpdatePermanentHistory = async () => {
    if (!patientId) return;
    setIsUpdatingPatient(true);
    try {
      // 1. Update Master Patient Record
      await patientAPI.update(patientId, {
        chronic_illnesses: permHistory.chronic_illnesses,
        surgeries: permHistory.surgeries,
        current_medications: permHistory.current_medications,
        allergies: permHistory.allergies,
        family_history: {
          notes: permHistory.family_history_notes,
          conditions: permHistory.family_history_conditions
        }
      });
      
      // 2. Identify target for Timeline Snapshot (Image 2)
      const activeCons = consultations.find(c => c.visit_id === activeVisitId);
      const targetId = activeCons?.id || editingId;
      const targetVisit = activeVisitId || targetVisitId;

      const snapshotUpdate = {
         chronic_illnesses: permHistory.chronic_illnesses,
         surgeries: permHistory.surgeries,
         current_medications: permHistory.current_medications,
         allergies: permHistory.allergies,
         family_history: {
           notes: permHistory.family_history_notes,
           conditions: permHistory.family_history_conditions
         }
      };

      if (targetVisit) {
        if (targetId) {
           // Update existing snapshot
           await consultationAPI.update(targetVisit, targetId, snapshotUpdate);
        } else {
           // CREATE instant snapshot if none exists so Image 2 reflects data immediately
           const res = await consultationAPI.store(targetVisit, {
             ...formData,
             ...snapshotUpdate
           });
           if (res?.id) setEditingId(res.id);
        }
        
        // REFRESH TIMELINE INSTANTLY (Image 2 reflection)
        fetchConsultations(currentPage);
      }

      toast.success("Medical history updated and synced to timeline");
      if (onPatientUpdate) onPatientUpdate();
      
      // Refresh to ensure absolute data integrity
      
      setIsPermLocked(true); 
    } catch (err) {
      console.error("Update error", err);
      toast.error("Failed to update medical history");
    } finally {
      setIsUpdatingPatient(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* ─── SECTION 1: PERMANENT MEDICAL HISTORY ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Patient Medical History (Permanent)</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lifetime Clinical Records</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPermLocked && !isVisitPaid && (
              <button 
                onClick={() => setIsPermLocked(false)}
                className="inline-flex items-center px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                Unlock to Edit
              </button>
            )}
            <button 
              onClick={handleUpdatePermanentHistory}
              disabled={isUpdatingPatient || isVisitPaid || isPermLocked}
              className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isUpdatingPatient ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
              Update Patient Medical History (Permanent)
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Lifetime Records */}
          <div className="space-y-5">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Clipboard className="h-3 w-3" /> Lifetime Medical Records
            </h4>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Chronic Illnesses</label>
              <textarea 
                name="chronic_illnesses"
                value={permHistory.chronic_illnesses}
                onChange={handlePermChange}
                disabled={isVisitPaid || isPermLocked}
                rows={2}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${
                  isPermLocked ? "bg-slate-100 border-slate-200 text-slate-900 font-bold" : "border-slate-200 bg-slate-50/30 text-slate-700 font-bold"
                }`}
                placeholder="e.g. Hypertension since 2015, Type 2 Diabetes..."
              />
            </div>
            {/* Same logic for other permanent fields... I will apply to all in the next chunk */}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Major Surgeries</label>
              <textarea 
                name="surgeries"
                value={permHistory.surgeries}
                onChange={handlePermChange}
                disabled={isVisitPaid || isPermLocked}
                rows={2}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${
                  isPermLocked ? "bg-slate-100 border-slate-200 text-slate-900 font-bold" : "border-slate-200 bg-slate-50/30 text-slate-700 font-bold"
                }`}
                placeholder="e.g. Appendectomy (2010), C-Section (2018)..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 text-amber-700">Allergies</label>
                <input 
                  type="text"
                  name="allergies"
                  value={permHistory.allergies}
                  onChange={handlePermChange}
                  disabled={isVisitPaid || isPermLocked}
                  className={`w-full px-3 py-2 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 outline-none transition-all ${
                    isPermLocked ? "bg-slate-100 border-slate-200 text-slate-900" : "border-amber-200 bg-amber-50/30 text-amber-900"
                  }`}
                  placeholder="e.g. Penicillin, Peanuts..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Current Medications</label>
                <input 
                  type="text"
                  name="current_medications"
                  value={permHistory.current_medications}
                  onChange={handlePermChange}
                  disabled={isVisitPaid || isPermLocked}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${
                    isPermLocked ? "bg-slate-100 border-slate-200 text-slate-900 font-bold" : "border-slate-200 bg-slate-50/30 text-slate-700 font-bold"
                  }`}
                  placeholder="e.g. Amlodipine 5mg OD..."
                />
              </div>
            </div>
          </div>

          {/* Family History */}
          <div className="space-y-5">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Users className="h-3 w-3" /> Family Medical History
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {familyConditionsList.map(condition => (
                <button
                  key={condition}
                  type="button"
                  disabled={isVisitPaid || isPermLocked}
                  onClick={() => toggleFamilyCondition(condition)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    permHistory.family_history_conditions.some(c => c.toLowerCase() === condition.toLowerCase())
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                      : isPermLocked ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
                  } ${isPermLocked ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                  {permHistory.family_history_conditions.some(c => c.toLowerCase() === condition.toLowerCase()) ? (
                    <CheckSquare className={`h-4 w-4 ${isPermLocked ? "text-white" : "text-white"}`} />
                  ) : (
                    <Square className="h-4 w-4 text-slate-300" />
                  )}
                  {condition}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Additional Family History Notes</label>
              <textarea 
                name="family_history_notes"
                value={permHistory.family_history_notes}
                onChange={handlePermChange}
                disabled={isVisitPaid || isPermLocked}
                rows={3}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${
                  isPermLocked ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed" : "border-slate-200 bg-slate-50/30 text-slate-700"
                }`}
                placeholder="Specific details about family conditions..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: CURRENT VISIT DETAILS ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-200">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                {targetVisitId !== activeVisitId ? `Editing Past Note (Visit #${targetVisitId})` : "Reason for Today's Visit"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {targetVisitId !== activeVisitId ? "Historical record update" : "Current Encounter Details"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isVisitLocked && !isVisitPaid && (
              <button 
                onClick={() => setIsVisitLocked(false)}
                className="inline-flex items-center px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                Unlock to Edit
              </button>
            )}
            {targetVisitId === activeVisitId && activeVisitId && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Visit Active #{activeVisitId}
              </div>
            )}
            {targetVisitId !== activeVisitId && (
              <button 
                onClick={resetToCurrentVisit}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary-100 hover:bg-primary-100 transition-all"
              >
                Back to Current Visit
              </button>
            )}
          </div>
        </div>

        {!activeVisitId ? (
          <div className="p-12 text-center bg-slate-50/50">
            <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mx-auto mb-4 border-4 border-white shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Registration Required</h4>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">Patient has no active visit. You must initiate a visit at triage before recording consultation notes.</p>
            <button 
              onClick={onStartNewVisit}
              className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2 text-primary-400" />
              Initiate Patient Visit
            </button>
          </div>
        ) : isVisitPaid ? (
          <div className="p-12 text-center bg-amber-50/30">
             <div className="inline-flex items-center gap-3 px-6 py-4 bg-amber-50 text-amber-900 rounded-2xl border border-amber-200 shadow-sm max-w-xl mx-auto">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Visit Closed (Fully Paid)</p>
                  <p className="text-xs text-amber-700 mt-1">This visit is already finalized or no active visit exists. To record a new consultation, please <button onClick={onStartNewVisit} className="font-black underline hover:text-amber-950 transition-colors">Start a New Visit</button> first.</p>
                </div>
             </div>
          </div>
        ) : (
          <form onSubmit={handleSaveConsultation} className="p-8 space-y-8">
            
            {/* Vitals Reference Table (Small) */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 grid grid-cols-2 md:grid-cols-6 gap-4">
               {[
                 { label: "BP", value: patient?.vitals?.[0]?.blood_pressure || "N/A", color: "text-red-600" },
                 { label: "Temp", value: (patient?.vitals?.[0]?.temperature || "N/A") + "°C", color: "text-orange-600" },
                 { label: "Pulse", value: (patient?.vitals?.[0]?.pulse_rate || "N/A") + " bpm", color: "text-rose-600" },
                 { label: "SpO2", value: (patient?.vitals?.[0]?.oxygen_saturation || "N/A") + "%", color: "text-blue-600" },
                 { label: "RBS", value: (patient?.vitals?.[0]?.rbs || "N/A") + " mmol", color: "text-emerald-600" },
                 { label: "Weight", value: (patient?.vitals?.[0]?.weight || "N/A") + " kg", color: "text-indigo-600" },
               ].map((v, i) => (
                 <div key={i} className="text-center">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{v.label}</p>
                   <p className={`text-sm font-bold ${v.color}`}>{v.value}</p>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Presentation Section */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-3 w-3 text-primary-500" /> Symptoms / Chief Complaint
                  </label>
                  <textarea 
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    disabled={isVisitPaid || isVisitLocked}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none ${
                      isVisitLocked ? "bg-slate-100 border-slate-200 text-slate-900 font-bold" : "bg-slate-50/30 border-slate-200 text-slate-700 font-bold"
                    }`}
                    placeholder="Patient presentation..."
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-primary-500" /> Duration of Symptoms
                    </label>
                    <input 
                      type="text"
                      name="symptoms_duration"
                      value={formData.symptoms_duration}
                      onChange={handleChange}
                      disabled={isVisitPaid || isVisitLocked}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm ${
                        isVisitLocked ? "bg-slate-100 border-slate-200 text-slate-900 font-bold" : "bg-slate-50/30 border-slate-200 text-slate-700 font-bold"
                      }`}
                      placeholder="e.g. 3 days, 1 week..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <History className="h-3 w-3 text-primary-500" /> Previous Treatments
                    </label>
                    <input 
                      type="text"
                      name="previous_treatments"
                      value={formData.previous_treatments}
                      onChange={handleChange}
                      disabled={isVisitPaid || isVisitLocked}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm ${
                        isVisitLocked ? "bg-slate-100 border-slate-200 text-slate-900 font-bold" : "bg-slate-50/30 border-slate-200 text-slate-700 font-bold"
                      }`}
                      placeholder="Self-medication, herbal..."
                    />
                  </div>
                </div>
              </div>

              {/* Assessment Section */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="h-3 w-3 text-primary-500" /> Clinical Assessment
                  </label>
                  <textarea 
                    name="assessment"
                    value={formData.assessment}
                    onChange={handleChange}
                    disabled={isVisitPaid || isVisitLocked}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none ${
                      isVisitLocked ? "bg-slate-100 border-slate-200 text-slate-900 font-bold" : "bg-slate-50/30 border-slate-200 text-slate-700 font-bold"
                    }`}
                    placeholder="Physical findings, systemic review..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Heart className="h-3 w-3 text-primary-500" /> Working Diagnosis
                  </label>
                  <input 
                    type="text"
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    disabled={isVisitPaid || isVisitLocked}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold ${
                      isVisitLocked ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-slate-50/30 border-slate-200 text-slate-700"
                    }`}
                    placeholder="Final diagnostic code or name..."
                  />
                </div>
              </div>

              {/* Management Plan */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   Medical Management Plan
                </label>
                <textarea 
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  disabled={isVisitPaid || isVisitLocked}
                  rows={2}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-slate-700 ${
                    isVisitLocked ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed" : "bg-slate-50/30 border-slate-200"
                  }`}
                  placeholder="Medication plan, lab requests, lifestyle advice..."
                />
              </div>

              <div className="md:col-span-1 space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-primary-500" /> Planned Follow-up Date
                </label>
                <input 
                  type="date"
                  name="follow_up_date"
                  value={formData.follow_up_date}
                  onChange={handleChange}
                  disabled={isVisitPaid || isVisitLocked}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-slate-700 ${
                    isVisitLocked ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed" : "bg-slate-50/30 border-slate-200"
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-50">
              <button 
                type="submit"
                disabled={isSubmitting || isVisitLocked}
                className="inline-flex items-center px-10 py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-2xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Digitizing Record...</>
                ) : isVisitLocked ? (
                  <><ShieldCheck className="h-5 w-5 mr-3" /> Record Locked</>
                ) : (
                  <><CheckCircle2 className="h-5 w-5 mr-3" /> {editingId ? "Update Medical Record" : "Save Clinical Record"}</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── SECTION 3: HISTORY TIMELINE ─── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Clinical History Timeline</h3>
              <p className="text-xs font-medium text-slate-500">Chronological list of all past consultations</p>
            </div>
          </div>
        </div>

        {isLoading && consultations.length === 0 ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : consultations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
             <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-4 border-4 border-white">
                <FileText className="h-8 w-8" />
             </div>
             <p className="text-slate-500 font-medium">No previous electronic medical records (EMRs) found.</p>
          </div>
        ) : (
          <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {consultations.map((note) => (
              <div key={note.id} className="relative pl-12 group">
                {/* Timeline Dot */}
                <div className="absolute left-0 top-3 h-10 w-10 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:border-primary-50 group-hover:text-primary-500 transition-all z-10 shadow-sm">
                  <User className="h-5 w-5" />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm group-hover:shadow-md group-hover:border-primary-100 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900 px-3 py-1.5 bg-slate-50 rounded-xl">
                        {new Date(note.visit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Visit Reg #{note.visit_id}
                      </span>
                    </div>
                    {note.doctor_name && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                         <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
                         Dr. {note.doctor_name}
                      </div>
                    )}

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Vitals Snapshot */}
                    <div className="md:col-span-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex flex-wrap gap-6 items-center">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                          <Activity className="h-3 w-3" /> Visit Vitals
                       </div>
                       {[
                         { label: "BP", value: note.vitals?.blood_pressure || "N/A" },
                         { label: "Temp", value: (note.vitals?.temperature || "N/A") + "°C" },
                         { label: "Pulse", value: (note.vitals?.pulse_rate || "N/A") + " bpm" },
                         { label: "SpO2", value: (note.vitals?.oxygen_saturation || "N/A") + "%" },
                         { label: "RBS", value: (note.vitals?.rbs || "N/A") + " mmol" },
                         { label: "Weight", value: (note.vitals?.weight || "N/A") + " kg" },
                       ].map((v, i) => (
                         <div key={i} className="flex items-center gap-1.5 border-l-2 border-slate-200 pl-3 first:border-l-0 first:pl-0">
                           <span className="text-[10px] font-bold text-slate-500">{v.label}:</span>
                           <span className="text-xs font-black text-slate-900">{v.value}</span>
                         </div>
                       ))}
                    </div>

                    {/* Patient Medical Snapshot */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50 gap-6">
                       <div>
                          <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3" /> Permanent Medical History (Snapshot)
                          </h4>
                          <div className="space-y-1.5">
                             <p className="text-[11px]"><span className="font-bold text-slate-700">Chronic Illnesses:</span> <span className="text-slate-600 italic">{note.chronic_illnesses || "None"}</span></p>
                             <p className="text-[11px]"><span className="font-bold text-slate-700">Surgeries:</span> <span className="text-slate-600 italic">{note.surgeries || "None"}</span></p>
                             <p className="text-[11px]"><span className="font-bold text-slate-700">Current Meds:</span> <span className="text-slate-600 italic">{note.current_medications || "None"}</span></p>
                             <p className="text-[11px]"><span className="font-bold text-slate-700 text-amber-700">Allergies:</span> <span className="text-amber-800 font-bold">{note.allergies || "None"}</span></p>
                          </div>
                       </div>
                       <div>
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Users className="h-3 w-3" /> Family History (Snapshot)
                          </h4>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                             {note.family_history?.conditions?.length > 0 ? (
                               note.family_history.conditions.map((c: string) => (
                                 <span key={c} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[9px] font-black uppercase tracking-tight">{c}</span>
                               ))
                             ) : (
                               <span className="text-[10px] text-slate-500 italic">No family history recorded.</span>
                             )}
                          </div>
                          {note.family_history?.notes && (
                            <p className="text-[10px] text-slate-500 bg-white/50 p-2 rounded-lg italic">"{note.family_history.notes}"</p>
                          )}
                       </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> Presentation
                        </h4>
                        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                          <p className="text-sm text-slate-900 font-bold mb-1">Duration: {note.symptoms_duration || "N/A"}</p>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap italic">
                            "{note.symptoms || "No symptoms recorded."}"
                          </p>
                        </div>
                      </div>
                      
                      {note.previous_treatments && (
                         <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prior Management</h4>
                            <p className="text-xs text-slate-600">{note.previous_treatments}</p>
                         </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <FileText className="h-3 w-3" /> Assessment &amp; Diagnosis
                      </h4>
                      <div className="space-y-3">
                        {note.diagnosis && (
                           <div className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 rounded-md text-[11px] font-black border border-red-100 uppercase tracking-wider">
                               Dx: {note.diagnosis}
                           </div>
                        )}
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {note.assessment || "No assessment notes recorded."}
                        </p>
                      </div>
                    </div>

                    {note.plan && (
                      <div className="md:col-span-2">
                         <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                           Management Plan
                         </h4>
                         <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {note.plan}
                            </p>
                         </div>
                      </div>
                    )}
                  </div>

                  {note.follow_up_date && (
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          <Calendar className="h-3.5 w-3.5" />
                          Next Review: {new Date(note.follow_up_date).toLocaleDateString()}
                       </div>
                       <div className="text-[10px] font-black text-slate-300 flex items-center gap-1 uppercase tracking-widest">
                          Secured EMR Record
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination 
          meta={meta}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
