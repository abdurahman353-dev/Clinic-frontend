"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Printer, Loader2, ClipboardList, Activity, Users, HeartPulse, Stethoscope, AlertCircle } from "lucide-react";
import Link from "next/link";
import { patientAPI, visitAPI } from "@/lib/api";
import { toast } from "sonner";
import { printHtml } from "@/lib/print";

export default function HistoryFormPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const patientId = unwrappedParams.id;
  const router = useRouter();

  const [patient, setPatient] = useState<any>(null);
  const [activeVisit, setActiveVisit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Patient History
    chronic_illnesses: "",
    major_surgeries: "",
    current_medications: "",
    allergies: "",
    // Family History (JSON-ready object)
    family_history: {
      heart_disease: false,
      high_bp: false,
      diabetes: false,
      cancer: false,
      other: ""
    },
    // Visit-specific
    symptoms: "",
    symptoms_duration: "",
    previous_treatments: "",
    initial_assessment: "",
    recommended_treatment: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await patientAPI.get(patientId, { include: 'visits,vitalSigns' });
        const p = res.data;
        setPatient(p);

        // Find the most recent open/unpaid visit to attach clinical notes to
        const sortedVisits = [...(p.visits || [])].sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latestVisit = sortedVisits[0];
        setActiveVisit(latestVisit);

        // Parse family history if it exists
        let famHistory = { heart_disease: false, high_bp: false, diabetes: false, cancer: false, other: "" };
        if (p.family_history) {
          const raw = p.family_history;
          // Handle modern object structure
          if (typeof raw === 'object' && raw !== null) {
            const conditions = raw.conditions || [];
            famHistory = {
               heart_disease: conditions.includes("Heart Disease"),
               high_bp: conditions.includes("Hypertension"),
               diabetes: conditions.includes("Diabetes"),
               cancer: conditions.includes("Cancer"),
               other: raw.notes || ""
            };
          } else {
            // Handle legacy string parsing
            try {
              famHistory = JSON.parse(raw);
            } catch (e) {
              famHistory.other = raw;
            }
          }
        }

        setFormData({
          chronic_illnesses: p.chronic_illnesses || "",
          major_surgeries: p.major_surgeries || "",
          current_medications: p.current_medications || "",
          allergies: p.allergies || "",
          family_history: famHistory,
          symptoms: latestVisit?.symptoms || "",
          symptoms_duration: latestVisit?.symptoms_duration || "",
          previous_treatments: latestVisit?.previous_treatments || "",
          initial_assessment: latestVisit?.initial_assessment || "",
          recommended_treatment: latestVisit?.recommended_treatment || ""
        });
      } catch (err: any) {
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      family_history: {
        ...prev.family_history,
        [name]: !((prev.family_history as any)[name])
      }
    }));
  };

  const handleFamilyOtherChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      family_history: {
        ...prev.family_history,
        other: e.target.value
      }
    }));
  };

  const handleSave = async (shouldPrint = false) => {
    setIsSaving(true);
    try {
      // 1. Update Patient Level History
      await patientAPI.update(patient.db_id, {
        chronic_illnesses: formData.chronic_illnesses,
        major_surgeries: formData.major_surgeries,
        current_medications: formData.current_medications,
        allergies: formData.allergies,
        family_history: {
          notes: formData.family_history.other,
          conditions: [
            ...(formData.family_history.heart_disease ? ["Heart Disease"] : []),
            ...(formData.family_history.high_bp ? ["Hypertension"] : []),
            ...(formData.family_history.diabetes ? ["Diabetes"] : []),
            ...(formData.family_history.cancer ? ["Cancer"] : []),
          ]
        }
      });

      // 2. Update Visit Level Clinic Data (if a visit exists)
      if (activeVisit) {
        await visitAPI.update(activeVisit.id, {
          symptoms: formData.symptoms,
          symptoms_duration: formData.symptoms_duration,
          previous_treatments: formData.previous_treatments,
          initial_assessment: formData.initial_assessment,
          recommended_treatment: formData.recommended_treatment
        });
      }

      toast.success("Medical history saved successfully");

      if (shouldPrint) {
        generatePrintout();
      } else {
        router.push(`/patients/${patientId}`);
      }
    } catch (err: any) {
      // Error handled by api.js
    } finally {
      setIsSaving(false);
    }
  };

  const generatePrintout = () => {
    const today = new Date().toLocaleDateString("en-GB");
    const latestVital = patient?.vitals?.[0] || {};

    const html = `
      <div style="padding: 2.5rem; color: #1e293b; max-width: 850px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 2px solid #1e40af; padding-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 1.25rem;">
            <img src="/wafaa_logo.jpeg" alt="Logo" style="height: 70px; width: 70px; object-fit: contain;" />
            <div>
              <h1 style="font-size: 28px; font-weight: 900; color: #1e40af; margin: 0; letter-spacing: -1px;">WAFAA</h1>
              <p style="font-size: 16px; font-weight: 700; color: #64748b; margin: 0; text-transform: uppercase;">Medical Clinic</p>
              <p style="font-size: 12px; color: #94a3b8; margin: 0; font-weight: 600;">MAJENGO, MOMBASA</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: 800; color: #1e40af; margin-bottom: 4px;">#MED-HIST-${patient?.id}</div>
            <p style="font-size: 12px; font-weight: 700; color: #64748b;">DATE: <span style="color: #0f172a;">${today}</span></p>
          </div>
        </div>

        <h2 style="text-align: center; font-size: 22px; font-weight: 950; color: #0f172a; text-transform: uppercase; margin-bottom: 2.5rem; letter-spacing: 2px;">Patient Medical History</h2>

        <!-- Patient Demographics Section -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid #e2e8f0;">
          <h3 style="font-size: 13px; font-weight: 900; color: #1e40af; text-transform: uppercase; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
            <span style="background: #1e40af; width: 6px; height: 18px; border-radius: 2px;"></span>
            Patient Identification
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; font-size: 13px;">
            <div>
              <p style="margin-bottom: 8px;"><strong style="color: #64748b;">Full Name:</strong> <span style="color: #0f172a; font-weight: 700;">${patient?.name}</span></p>
              <p style="margin-bottom: 8px;"><strong style="color: #64748b;">Date of Birth:</strong> <span style="color: #0f172a;">${patient?.dob || "N/A"} (${patient?.age} yrs)</span></p>
              <p style="margin-bottom: 0;"><strong style="color: #64748b;">Gender:</strong> <span style="color: #0f172a; text-transform: capitalize;">${patient?.gender}</span></p>
            </div>
            <div>
              <p style="margin-bottom: 8px;"><strong style="color: #64748b;">Phone:</strong> <span style="color: #0f172a;">${patient?.phone}</span></p>
              <p style="margin-bottom: 8px;"><strong style="color: #64748b;">Emergency Contact:</strong> <span style="color: #0f172a;">${patient?.next_of_kin || "N/A"}</span></p>
              <p style="margin-bottom: 0;"><strong style="color: #64748b;">Contact Relation:</strong> <span style="color: #0f172a;">${patient?.next_of_kin_phone || "N/A"}</span></p>
            </div>
          </div>
        </div>

        <!-- Latest Vitals Grid -->
        <div style="margin-bottom: 2.5rem;">
          <h3 style="font-size: 13px; font-weight: 900; color: #1e40af; text-transform: uppercase; margin-bottom: 1rem;">Primary Vital Signs</h3>
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; text-align: center;">
            <div style="background: #fffafa; border: 1px solid #fee2e2; padding: 10px; border-radius: 8px;">
              <div style="font-size: 10px; font-weight: 800; color: #ef4444; text-transform: uppercase;">BP</div>
              <div style="font-size: 14px; font-weight: 800;">${latestVital.blood_pressure || "—"}</div>
              <div style="font-size: 8px; color: #94a3b8;">mmHg</div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #dcfce7; padding: 10px; border-radius: 8px;">
              <div style="font-size: 10px; font-weight: 800; color: #22c55e; text-transform: uppercase;">PR</div>
              <div style="font-size: 14px; font-weight: 800;">${latestVital.pulse_rate || "—"}</div>
              <div style="font-size: 8px; color: #94a3b8;">BPM</div>
            </div>
            <div style="background: #eff6ff; border: 1px solid #dbeafe; padding: 10px; border-radius: 8px;">
              <div style="font-size: 10px; font-weight: 800; color: #3b82f6; text-transform: uppercase;">TEMP</div>
              <div style="font-size: 14px; font-weight: 800;">${latestVital.temperature || "—"}</div>
              <div style="font-size: 8px; color: #94a3b8;">°C</div>
            </div>
            <div style="background: #fdfaf1; border: 1px solid #fef3c7; padding: 10px; border-radius: 8px;">
              <div style="font-size: 10px; font-weight: 800; color: #d97706; text-transform: uppercase;">RR</div>
              <div style="font-size: 14px; font-weight: 800;">${latestVital.respiratory_rate || "—"}</div>
              <div style="font-size: 8px; color: #94a3b8;">/min</div>
            </div>
            <div style="background: #f5f3ff; border: 1px solid #ede9fe; padding: 10px; border-radius: 8px;">
              <div style="font-size: 10px; font-weight: 800; color: #8b5cf6; text-transform: uppercase;">SpO2</div>
              <div style="font-size: 14px; font-weight: 800;">${latestVital.oxygen_saturation || "—"}</div>
              <div style="font-size: 8px; color: #94a3b8;">%</div>
            </div>
             <div style="background: #ecfeff; border: 1px solid #cffafe; padding: 10px; border-radius: 8px;">
              <div style="font-size: 10px; font-weight: 800; color: #0891b2; text-transform: uppercase;">RBS</div>
              <div style="font-size: 14px; font-weight: 800;">${latestVital.rbs || "—"}</div>
              <div style="font-size: 8px; color: #94a3b8;">mmol/L</div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 2.5rem;">
          <!-- Left Column (Visit & History) -->
          <div>
            <div style="margin-bottom: 2rem;">
              <h4 style="font-size: 12px; font-weight: 900; color: #1e40af; margin-bottom: 0.75rem; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">PRESENTING CONCERNS</h4>
              <p style="font-size: 13px; margin: 0; line-height: 1.6; font-weight: 700;">${formData.symptoms || "No symptoms recorded"}</p>
              <p style="font-size: 11px; color: #64748b; margin-top: 4px;">Duration: ${formData.symptoms_duration || "Not specified"}</p>
            </div>

            <div style="margin-bottom: 2rem;">
              <h4 style="font-size: 12px; font-weight: 900; color: #1e40af; margin-bottom: 0.75rem; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">PAST MEDICAL HISTORY</h4>
              <div style="font-size: 12px; line-height: 1.8;">
                <p><strong>Chronic Illnesses:</strong> ${formData.chronic_illnesses || "None"}</p>
                <p><strong>Past Surgeries:</strong> ${formData.major_surgeries || "None"}</p>
                <p><strong>Current Meds:</strong> ${formData.current_medications || "None"}</p>
                <p style="color: #ef4444; font-weight: 700;"><strong>Allergies:</strong> ${formData.allergies || "None"}</p>
              </div>
            </div>

            <div style="margin-bottom: 2rem;">
              <h4 style="font-size: 12px; font-weight: 900; color: #1e40af; margin-bottom: 0.75rem; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">CLINICAL ASSESSMENT</h4>
              <p style="font-size: 13px; line-height: 1.6; font-weight: 700;">${formData.initial_assessment || "Pending doctor evaluation"}</p>
            </div>
          </div>

          <!-- Right Column (Family & Family) -->
          <div>
            <div style="margin-bottom: 2rem;">
              <h4 style="font-size: 12px; font-weight: 900; color: #1e40af; margin-bottom: 0.75rem; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">FAMILY GENETIC HISTORY</h4>
              <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="border: 1.5px solid #cbd5e1; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; border-radius: 3px; font-size: 10px; font-weight: 950; color: #1e40af;">${formData.family_history.heart_disease ? "✓" : ""}</span>
                  <span>Cardiovascular Disease</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="border: 1.5px solid #cbd5e1; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; border-radius: 3px; font-size: 10px; font-weight: 950; color: #1e40af;">${formData.family_history.high_bp ? "✓" : ""}</span>
                  <span>Hypertension</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="border: 1.5px solid #cbd5e1; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; border-radius: 3px; font-size: 10px; font-weight: 950; color: #1e40af;">${formData.family_history.diabetes ? "✓" : ""}</span>
                  <span>Diabetes Mellitus</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="border: 1.5px solid #cbd5e1; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; border-radius: 3px; font-size: 10px; font-weight: 950; color: #1e40af;">${formData.family_history.cancer ? "✓" : ""}</span>
                  <span>Oncology (Cancer)</span>
                </div>
                ${formData.family_history.other ? `<p style="margin-top: 5px; font-size: 11px; font-style: italic;">Note: ${formData.family_history.other}</p>` : ""}
              </div>
            </div>

            <div style="margin-bottom: 2rem;">
              <h4 style="font-size: 12px; font-weight: 900; color: #1e40af; margin-bottom: 0.75rem; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">MANAGEMENT PLAN</h4>
              <p style="font-size: 13px; line-height: 1.6; font-weight: 700;">${formData.recommended_treatment || "Follow standard protocols"}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 4rem; text-align: center; border-top: 1.5px solid #e2e8f0; padding-top: 2rem; position: absolute; bottom: 3rem; left: 2.5rem; right: 2.5rem;">
          <div style="display: flex; justify-content: center; gap: 2rem; font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 12px;">
            <span style="display: flex; align-items: center; gap: 6px;">📧 wafaamedicalclinic@gmail.com</span>
            <span style="display: flex; align-items: center; gap: 6px;">📞 0710523777 | 0799032632</span>
          </div>
          <p style="font-size: 9px; color: #94a3b8; font-weight: 950; letter-spacing: 3px; text-transform: uppercase;">Authenticated Medical Record &bull; Wafaa Med-Cloud Systems</p>
        </div>
      </div>
    `;

    printHtml(html, "A4");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/patients/${patientId}`}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 shadow-sm transition-all active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical History Form</h1>
              <p className="text-sm text-slate-500">Patient: <span className="font-semibold text-slate-700">{patient?.name}</span> • ID: {patient?.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              <Save className="h-4 w-4 mr-2 text-slate-400" />
              Save Record
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="inline-flex items-center px-6 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-100 transition-all active:scale-95"
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
              Save &amp; Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section: Visit Details */}
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary-600" />
                <h2 className="font-bold text-slate-900">Current Visit Details</h2>
              </div>
              <div className="p-6 space-y-4">
                {!activeVisit && (
                   <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800 text-sm mb-4">
                     <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                     <p>There is no <strong>active/open visit</strong> for this patient. Any clinical notes entered here will be attached to their most recent visit record.</p>
                   </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Symptoms &amp; Chief Complaint</label>
                    <textarea 
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleChange}
                      placeholder="What is the patient experiencing?"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Duration of Symptoms</label>
                    <input 
                      type="text"
                      name="symptoms_duration"
                      value={formData.symptoms_duration}
                      onChange={handleChange}
                      placeholder="e.g. 3 days"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Previous Treatments</label>
                    <input 
                      type="text"
                      name="previous_treatments"
                      value={formData.previous_treatments}
                      onChange={handleChange}
                      placeholder="Any self-medication?"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Initial Assessment / Impression</label>
                    <textarea 
                      name="initial_assessment"
                      value={formData.initial_assessment}
                      onChange={handleChange}
                      placeholder="Doctor's preliminary findings..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[80px]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Recommended Plan / Tests</label>
                    <textarea 
                      name="recommended_treatment"
                      value={formData.recommended_treatment}
                      onChange={handleChange}
                      placeholder="Next steps..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Medical History */}
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary-600" />
                <h2 className="font-bold text-slate-900">Patient Medical History (Permanent)</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 text-red-600">Known Allergies</label>
                    <textarea 
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="List all allergies (drug, food, environment)..."
                      className="w-full px-4 py-2 border border-red-100 bg-red-50/30 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Chronic Illnesses</label>
                    <textarea 
                      name="chronic_illnesses"
                      value={formData.chronic_illnesses}
                      onChange={handleChange}
                      placeholder="Asthma, Diabetes, HTN, etc."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Major Surgeries</label>
                    <textarea 
                      name="major_surgeries"
                      value={formData.major_surgeries}
                      onChange={handleChange}
                      placeholder="Type and date of procedure"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[80px]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Current Medications</label>
                    <textarea 
                      name="current_medications"
                      value={formData.current_medications}
                      onChange={handleChange}
                      placeholder="Any drugs currently being taken?"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Section: Family History */}
          <div className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-600" />
                <h2 className="font-bold text-slate-900">Family History</h2>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500 mb-4 font-medium italic">Check any conditions present in immediate family:</p>
                <div className="space-y-3">
                  {[
                    { id: "heart_disease", label: "Heart Disease" },
                    { id: "high_bp", label: "High Blood Pressure" },
                    { id: "diabetes", label: "Diabetes Mellitus" },
                    { id: "cancer", label: "Cancer (Oncology)" },
                  ].map(item => (
                    <label key={item.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox"
                          checked={(formData.family_history as any)[item.id]}
                          onChange={() => handleCheckboxChange(item.id)}
                          className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition-all"
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{item.label}</span>
                    </label>
                  ))}
                  <div className="pt-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Other Conditions</label>
                    <textarea 
                      value={formData.family_history.other}
                      onChange={handleFamilyOtherChange}
                      placeholder="List other hereditary conditions..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[100px] text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Refernce: Latest Vitals */}
            <section className="bg-primary-900 text-white rounded-xl shadow-lg shadow-primary-900/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-primary-300" />
                <h3 className="font-bold text-lg">Latest Vitals</h3>
              </div>
              <div className="space-y-4">
                {patient?.vitals?.[0] ? (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-primary-800">
                      <span className="text-primary-300 text-sm">Blood Pressure</span>
                      <span className="font-bold">{patient.vitals[0].blood_pressure || "—"} <span className="text-[10px] text-primary-400">mmHg</span></span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary-800">
                      <span className="text-primary-300 text-sm">Pulse Rate</span>
                      <span className="font-bold">{patient.vitals[0].pulse_rate || "—"} <span className="text-[10px] text-primary-400">BPM</span></span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary-800">
                      <span className="text-primary-300 text-sm">Temperature</span>
                      <span className="font-bold">{patient.vitals[0].temperature || "—"} <span className="text-[10px] text-primary-400">°C</span></span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary-800">
                      <span className="text-primary-300 text-sm">RBS</span>
                      <span className="font-bold">{patient.vitals[0].rbs || "—"} <span className="text-[10px] text-primary-400">mmol/L</span></span>
                    </div>
                    <p className="text-[10px] text-primary-400 mt-4 text-center italic font-medium uppercase tracking-widest">Recorded on {new Date(patient.vitals[0].created_at).toLocaleDateString()}</p>
                  </>
                ) : (
                  <p className="text-primary-400 text-sm italic">No vitals recorded yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
