"use client";

import { useState, useEffect, use, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, User as UserIcon, Calendar, Phone, Mail, Droplet, AlertTriangle, FileText, Activity, ClipboardList, PlusCircle, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { patientAPI, visitAPI, settingsAPI } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import VitalsTab from "@/components/patients/VitalsTab";
import InvestigationsTab from "@/components/patients/InvestigationsTab";
import PrescriptionsTab from "@/components/patients/PrescriptionsTab";
import ConsultationsTab from "@/components/patients/ConsultationsTab";
import BillingTab from "@/components/patients/BillingTab";
import { printHtml } from "@/lib/print";

function PatientDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const unwrappedId = unwrappedParams.id;

  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "vitals";

  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // New Visit State
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [globalFee, setGlobalFee] = useState<number | null>(null);
  const [isStartingVisit, setIsStartingVisit] = useState(false);

  // Centralized state for tabs to avoid re-fetching on switch
  const [vitalsTotal, setVitalsTotal] = useState(0);
  const [investigationsTotal, setInvestigationsTotal] = useState(0);
  const [prescriptionsTotal, setPrescriptionsTotal] = useState(0);
  const [isVitalsLoaded, setIsVitalsLoaded] = useState(false);
  const [isInvestigationsLoaded, setIsInvestigationsLoaded] = useState(false);
  const [isPrescriptionsLoaded, setIsPrescriptionsLoaded] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["vitals", "consultations", "investigations", "prescriptions"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // New state for pre-loaded data
  const [vitalsData, setVitalsData] = useState<any[]>([]);
  const [investigationsData, setInvestigationsData] = useState<any[]>([]);
  const [prescriptionsData, setPrescriptionsData] = useState<any[]>([]);

  // New state for visit status
  const [isVisitPaid, setIsVisitPaid] = useState(false);
  const [activeVisitId, setActiveVisitId] = useState<number | null>(null);

  const fetchPatient = useCallback(async () => {
    try {
      // Fetch patient and all historical data in parallel for instant tab switching
      // We now include 'visits' to check if the latest one is already paid
      const [patientRes] = await Promise.all([
        patientAPI.get(unwrappedId, { include: 'vitalSigns,investigations,prescriptions.items,visits' })
      ]);
      
      const p = patientRes.data;
      setPatient(p);
      
      // Determine if the MOST RECENT visit is paid, or if they have no visits at all (force start visit)
      if (p.visits && p.visits.length > 0) {
        // Sort by creation date descending to get the latest visit
        const sortedVisits = [...p.visits].sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latestVisit = sortedVisits[0];
        setIsVisitPaid(latestVisit.status === 'paid');
        setActiveVisitId(latestVisit.status !== 'paid' ? latestVisit.id : null);
      } else {
        setIsVisitPaid(true); // Force start visit for new patients too
        setActiveVisitId(null);
      }

      // Populate individual tab states from the 'deep-loaded' patient object
      if (p.vitals) {
         setVitalsData(p.vitals);
         setVitalsTotal(p.vitals.length);
         setIsVitalsLoaded(true);
      }
      if (p.investigations) {
         setInvestigationsData(p.investigations);
         setInvestigationsTotal(p.investigations.length);
         setIsInvestigationsLoaded(true);
      }
      if (p.prescriptions) {
         setPrescriptionsData(p.prescriptions);
         setPrescriptionsTotal(p.prescriptions.length);
         setIsPrescriptionsLoaded(true);
      }

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load patient data");
    } finally {
      setIsLoading(false);
    }
  }, [unwrappedId]);

  useEffect(() => {
    fetchPatient();

    // Load the global clinic consultation fee
    settingsAPI.get().then((res: any) => {
      const fee = res?.data?.consultation_fee ?? res?.consultation_fee;
      setGlobalFee(fee !== undefined && fee !== null ? parseFloat(String(fee)) : 500);
    }).catch(() => setGlobalFee(500));
  }, [fetchPatient]);

  const handleStartVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const visitData = { 
      patient_id: patient.db_id, 
      doctor_id: (typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem("admin_user") || localStorage.getItem("admin_user") || "{}") : {})?.id,
      reason: "General Consultation",
      // consultation_fee is ignored by backend — it always uses the global setting
    };

    setIsVisitModalOpen(false);
    toast.success("Starting new visit... A consultation bill is being generated.");
    
    setIsStartingVisit(true);
    try {
      const res = await visitAPI.store(visitData);
      toast.success("Visit started! Consultation fee of KSh " + (globalFee ?? 0).toLocaleString() + " has been billed.");
      setIsVisitPaid(false); // Instantly unlock tabs!
      setActiveVisitId(res.data?.id || res.data?.visit?.id || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to start visit. Please try again.");
      setIsVisitModalOpen(true);
    } finally {
      setIsStartingVisit(false);
    }
  };

  const handlePrintHistoryForm = () => {
    if (!patient) return;

    const latestVital = vitalsData?.[0] || {};
    const today = new Date().toLocaleDateString("en-GB");

    const html = `
      <div style="padding: 20px; color: #1e293b; max-width: 800px; margin: 0 auto;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="/wafaa_logo.jpeg" alt="Clinic Logo" style="height: 60px; width: 60px; object-fit: contain;" />
            <div>
              <h1 style="font-size: 22px; font-weight: 900; color: #1e40af; margin: 0; letter-spacing: -0.5px;">WAFAA</h1>
              <p style="font-size: 14px; font-weight: 700; color: #64748b; margin: 0; text-transform: uppercase;">Medical Clinic</p>
              <p style="font-size: 10px; color: #94a3b8; margin: 0; font-weight: 600;">MAJENGO, MOMBASA</p>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 11px; font-weight: 700; color: #64748b;">DATE: <span style="border-bottom: 1px dotted #cbd5e1; min-width: 120px; display: inline-block;">${today}</span></p>
          </div>
        </div>

        <h2 style="text-align: center; font-size: 18px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin-bottom: 25px; letter-spacing: 1px;">Patient Medical History Form</h2>

        <!-- Patient Info Section -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: 900; color: #1e40af; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Patient Information</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; width: 50%;">
                <span style="font-weight: 600; color: #64748b;">Full Name:</span> 
                <span style="margin-left: 5px; font-weight: 700;">${patient.name}</span>
              </td>
              <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #64748b;">Phone Number:</span> 
                <span style="margin-left: 5px; font-weight: 700;">${patient.phone}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #64748b;">Date of Birth:</span> 
                <span style="margin-left: 5px; font-weight: 700;">${patient.dob || "N/A"}</span>
              </td>
              <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #64748b;">Email:</span> 
                <span style="margin-left: 5px; font-weight: 700;">${patient.email || "N/A"}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #64748b;">Gender:</span> 
                <span style="margin-left: 10px;">
                  [${patient.gender === 'male' ? '✓' : ' '}] Male &nbsp; 
                  [${patient.gender === 'female' ? '✓' : ' '}] Female &nbsp; 
                  [${patient.gender !== 'male' && patient.gender !== 'female' ? '✓' : ' '}] Other
                </span>
              </td>
              <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #64748b;">Emergency Contact:</span> 
                <span style="margin-left: 5px; font-weight: 700;">${patient.next_of_kin || "N/A"} (${patient.next_of_kin_phone || ""})</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Vitals Section -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: 900; color: #1e40af; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Vitals:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px;">
            <div style="line-height: 2;">
              <div>B.P: <span style="border-bottom: 1px solid #cbd5e1; min-width: 100px; display: inline-block; font-weight: 700;">${latestVital.blood_pressure || ""}</span> mmHg</div>
              <div>P.R: <span style="border-bottom: 1px solid #cbd5e1; min-width: 100px; display: inline-block; font-weight: 700;">${latestVital.pulse_rate || ""}</span> bpm</div>
              <div>RR: <span style="border-bottom: 1px solid #cbd5e1; min-width: 100px; display: inline-block; font-weight: 700;">${latestVital.respiratory_rate || ""}</span> /min</div>
            </div>
            <div style="line-height: 2;">
              <div>TEMP: <span style="border-bottom: 1px solid #cbd5e1; min-width: 100px; display: inline-block; font-weight: 700;">${latestVital.temperature || ""}</span> °C</div>
              <div>SPO2: <span style="border-bottom: 1px solid #cbd5e1; min-width: 100px; display: inline-block; font-weight: 700;">${latestVital.oxygen_saturation || ""}</span> %</div>
              <div>RBS: <span style="border-bottom: 1px solid #cbd5e1; min-width: 100px; display: inline-block; font-weight: 700;">${latestVital.rbs || ""}</span> mmol/L</div>
            </div>
          </div>
        </div>

        <!-- Medical History Section (Manual) -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: 900; color: #1e40af; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Medical History</h3>
          <div style="font-size: 11px; line-height: 1.8;">
            <div style="margin-bottom: 10px;">
              <div style="display: flex; gap: 20px;">
                <span>• Do you have any chronic illnesses?</span>
                <span>[ ] Yes &nbsp; [ ] No</span>
              </div>
              <div style="border-bottom: 1px solid #f1f5f9; min-height: 20px; color: #94a3b8; font-style: italic; font-size: 9px;">(if yes, please specify)</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="display: flex; gap: 20px;">
                <span>• Have you had any major surgeries?</span>
                <span>[ ] Yes &nbsp; [ ] No</span>
              </div>
              <div style="border-bottom: 1px solid #f1f5f9; min-height: 20px; color: #94a3b8; font-style: italic; font-size: 9px;">(if yes, please specify)</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="display: flex; gap: 20px;">
                <span>• Are you currently taking any medications?</span>
                <span>[ ] Yes &nbsp; [ ] No</span>
              </div>
              <div style="border-bottom: 1px solid #f1f5f9; min-height: 20px; color: #94a3b8; font-style: italic; font-size: 9px;">Medication Name:</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="display: flex; gap: 20px;">
                <span>• Do you have any allergies?</span>
                <span>[ ] Yes &nbsp; [ ] No</span>
                <span style="font-weight: 700; color: #ef4444; margin-left: 20px;">${patient.allergies ? `Current: ${patient.allergies}` : ""}</span>
              </div>
              <div style="border-bottom: 1px solid #f1f5f9; min-height: 20px; color: #94a3b8; font-style: italic; font-size: 9px;">(if yes, please specify)</div>
            </div>
          </div>
        </div>

        <!-- Family Medical History row -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: 900; color: #1e40af; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Family Medical History</h3>
          <p style="font-size: 10px; margin-bottom: 8px; font-weight: 600; color: #64748b;">Do any of your immediate family members have a history of the following?</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 11px;">
            <span>[ ] Heart disease</span>
            <span>[ ] High blood pressure</span>
            <span>[ ] Other: ________________</span>
            <span>[ ] Diabetes</span>
            <span>[ ] Cancer</span>
          </div>
        </div>

        <!-- Reason for Today's Visit Section (Manual) -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: 900; color: #1e40af; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Reason for Today's Visit</h3>
          <div style="font-size: 11px; line-height: 2.5;">
            <div style="border-bottom: 1px solid #cbd5e1;">• Symptoms/Concerns: </div>
            <div style="border-bottom: 1px solid #cbd5e1;">• Duration of Symptoms: </div>
            <div style="border-bottom: 1px solid #cbd5e1;">• Previous Treatments (if any): </div>
          </div>
        </div>

        <!-- Doctor's Notes Section (Manual) -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: 900; color: #1e40af; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Doctor's Notes</h3>
          <div style="font-size: 11px; line-height: 2.5;">
            <div style="border-bottom: 1px solid #cbd5e1;">• Initial Assessment: </div>
            <div style="border-bottom: 1px solid #cbd5e1;">• Recommended Tests/Treatments: </div>
            <div style="display: flex; align-items: baseline; gap: 10px; border-bottom: 1px solid #cbd5e1;">
              <span>• Follow-up Appointment:</span>
              <span style="font-size: 10px;">[ ] Yes &nbsp; [ ] No &nbsp; Date: ________________</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; pt-20px;">
          <div style="display: flex; justify-content: center; gap: 30px; font-size: 10px; font-weight: 700; color: #64748b;">
            <span>📧 wafaamedicalclinic@gmail.com</span>
            <span>📞 Telephone: 071052377 / 0799032632</span>
          </div>
          <p style="font-size: 8px; color: #94a3b8; margin-top: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 900;">Official Medical Documentation - Wafaa Med-Cloud</p>
        </div>
      </div>
    `;

    printHtml(html, "A4");
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (errorMsg || !patient) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <Link href="/patients" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
        </Link>
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-red-800">Error Loading Patient</h3>
          <p className="text-red-600 mt-1">{errorMsg || "Patient not found."}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "vitals", label: "Vitals", icon: Activity, count: vitalsTotal },
    { id: "consultations", label: "Consultations", icon: Stethoscope },
    { id: "investigations", label: "Investigations", icon: FileText, count: investigationsTotal },
    { id: "prescriptions", label: "Prescriptions", icon: Droplet, count: prescriptionsTotal },
    { id: "billing", label: "Billing & Invoices", icon: FileText },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/patients" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/patients/${unwrappedId}/record`)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none transition-all active:scale-95"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Patient Record
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Patient Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-primary-100 flexitems-center justify-center text-primary-700 font-bold text-xl flex-shrink-0 flex items-center">
                {patient.name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  {patient.name}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${patient.patient_type === 'inpatient' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {patient.patient_type || 'outpatient'}
                  </span>
                </h1>
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                  <span className="font-medium text-slate-700">{patient.id}</span>
                  <span>&bull;</span>
                  <span>{patient.age || "?"} yrs</span>
                  <span>&bull;</span>
                  <span className="capitalize">{patient.gender}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex items-center text-slate-600">
                <Phone className="h-4 w-4 mr-2 text-slate-400" />
                {patient.phone}
              </div>
              {patient.email && (
                <div className="flex items-center text-slate-600">
                  <Mail className="h-4 w-4 mr-2 text-slate-400" />
                  {patient.email}
                </div>
              )}
              {patient.dob && (
                <div className="flex items-center text-slate-600">
                  <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                  DOB: {patient.dob}
                </div>
              )}
              {patient.blood_group && (
                <div className="flex items-center text-slate-600">
                  <Droplet className="h-4 w-4 mr-2 text-red-400" />
                  Blood: <span className="font-semibold ml-1">{patient.blood_group}</span>
                </div>
              )}
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Emergency Contact</h3>
              <div className="flex items-center text-sm text-slate-600">
                <UserIcon className="h-4 w-4 mr-2 text-slate-400" />
                <span className="font-medium text-slate-700">{patient.next_of_kin || "Not listed"}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Phone className="h-4 w-4 mr-2 text-slate-400" />
                <span>{patient.next_of_kin_phone || "No contact"}</span>
              </div>
            </div>
          </div>

          {patient.allergies && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl flex items-start text-red-800 border border-red-100 shadow-sm">
              <AlertTriangle className="h-5 w-5 mr-3 shrink-0 text-red-500" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-1">Critical Allergy Alert:</p>
                <p className="text-sm font-bold leading-relaxed">{patient.allergies}</p>
              </div>
            </div>
          )}

          {/* Clinical History Banner */}
          {(patient.chronic_illnesses || patient.family_history) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.chronic_illnesses && (
                <div className="p-4 bg-blue-50/50 rounded-xl flex items-start text-blue-900 border border-blue-100 shadow-sm hover:bg-blue-50 transition-colors">
                  <Activity className="h-5 w-5 mr-3 shrink-0 text-blue-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Past Medical History:</p>
                    <p className="text-sm font-semibold leading-relaxed line-clamp-2">{patient.chronic_illnesses}</p>
                  </div>
                </div>
              )}
              {patient.family_history && (
                <div className="p-4 bg-indigo-50/50 rounded-xl flex items-start text-indigo-900 border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-colors">
                  <Users className="h-5 w-5 mr-3 shrink-0 text-indigo-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Family Medical History:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(() => {
                        try {
                          const fh = JSON.parse(patient.family_history);
                          const flags = [];
                          if (fh.heart_disease) flags.push("Heart Disease");
                          if (fh.high_bp) flags.push("Hypertension");
                          if (fh.diabetes) flags.push("Diabetes");
                          if (fh.cancer) flags.push("Cancer");
                          
                          return flags.length > 0 ? flags.map(f => (
                            <span key={f} className="text-[9px] px-2 py-0.5 bg-indigo-200/50 text-indigo-700 rounded-full font-bold uppercase">{f}</span>
                          )) : <span className="text-sm font-semibold italic text-slate-400">Recorded</span>;
                        } catch (e) {
                          return <p className="text-sm font-semibold leading-relaxed line-clamp-2">{patient.family_history}</p>;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center
                  ${activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }
                `}
              >
                <tab.icon className={`mr-2 h-4 w-4 ${activeTab === tab.id ? "text-primary-500" : "text-slate-400"}`} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content Placeholder */}
        <div className="p-6 bg-slate-50 min-h-[400px]">
           {activeTab === "vitals" && (
            <VitalsTab
              patientId={patient.db_id}
              initialData={vitalsData}
              onTotalChange={setVitalsTotal}
              isInitialLoaded={isVitalsLoaded}
              onLoadComplete={() => setIsVitalsLoaded(true)}
              isVisitPaid={isVisitPaid}
              activeVisitId={activeVisitId}
              onStartNewVisit={() => setIsVisitModalOpen(true)}
            />
          )}
          {activeTab === "consultations" && (
            <ConsultationsTab 
              patientId={patient.db_id}
              patient={patient}
              onPatientUpdate={fetchPatient}
              isVisitPaid={isVisitPaid}
              activeVisitId={activeVisitId}
              onStartNewVisit={() => setIsVisitModalOpen(true)}
            />
          )}
          {activeTab === "investigations" && (
            <InvestigationsTab
              patientId={patient.db_id}
              initialData={investigationsData}
              onTotalChange={setInvestigationsTotal}
              isInitialLoaded={isInvestigationsLoaded}
              onLoadComplete={() => setIsInvestigationsLoaded(true)}
              isVisitPaid={isVisitPaid}
              activeVisitId={activeVisitId}
              onStartNewVisit={() => setIsVisitModalOpen(true)}
            />
          )}
          {activeTab === "prescriptions" && (
            <PrescriptionsTab
              patientId={patient.db_id}
              initialData={prescriptionsData}
              onTotalChange={setPrescriptionsTotal}
              isInitialLoaded={isPrescriptionsLoaded}
              onLoadComplete={() => setIsPrescriptionsLoaded(true)}
              isVisitPaid={isVisitPaid}
              activeVisitId={activeVisitId}
              onStartNewVisit={() => setIsVisitModalOpen(true)}
            />
          )}
          {activeTab === "billing" && (
            <BillingTab patientId={patient.db_id} />
          )}
        </div>
      </div>

      <Modal
        isOpen={isVisitModalOpen}
        onClose={() => !isStartingVisit && setIsVisitModalOpen(false)}
        title="Start New Visit"
        description={`Check-in ${patient?.name} for a new consultation.`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleStartVisit} className="space-y-4">
          <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Consultation Fee</p>
              <p className="text-xs text-slate-500 mt-0.5">Set globally by Super Admin · Auto-billed on confirmation</p>
            </div>
            <div className="text-right">
              {globalFee !== null ? (
                <span className="text-2xl font-black text-primary-700">KSh {globalFee.toLocaleString()}</span>
              ) : (
                <span className="text-slate-400 text-sm italic">Loading...</span>
              )}
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Auto-Billed</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsVisitModalOpen(false)}
              disabled={isStartingVisit}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isStartingVisit || globalFee === null}
              className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isStartingVisit ? "Starting..." : "Confirm & Start Visit"}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

export default function PatientDetailPage(props: any) {
  return (
    <Suspense fallback={
       <div className="p-6 md:p-8 max-w-7xl mx-auto flex justify-center items-center min-h-[50vh]">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
       </div>
    }>
      <PatientDetailContent {...props} />
    </Suspense>
  );
}
