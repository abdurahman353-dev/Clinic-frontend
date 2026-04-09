"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, User as UserIcon, Calendar, Phone, Mail, Droplet, AlertTriangle, FileText, Activity, ClipboardList, PlusCircle } from "lucide-react";
import Link from "next/link";
import { patientAPI, visitAPI, settingsAPI } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import VitalsTab from "@/components/patients/VitalsTab";
import InvestigationsTab from "@/components/patients/InvestigationsTab";
import PrescriptionsTab from "@/components/patients/PrescriptionsTab";
import BillingTab from "@/components/patients/BillingTab";
import { Suspense } from "react";

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
    if (tab && ["vitals", "investigations", "prescriptions"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // New state for pre-loaded data
  const [vitalsData, setVitalsData] = useState<any[]>([]);
  const [investigationsData, setInvestigationsData] = useState<any[]>([]);
  const [prescriptionsData, setPrescriptionsData] = useState<any[]>([]);

  // New state for visit status
  const [isVisitPaid, setIsVisitPaid] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch patient and all historical data in parallel for instant tab switching
        // We now include 'visits' to check if the latest one is already paid
        const [patientRes] = await Promise.all([
          patientAPI.get(unwrappedId, { include: 'vitalSigns,investigations,prescriptions.items,visits' })
        ]);
        
        const p = patientRes.data;
        setPatient(p);
        
        // Determine if the MOST RECENT visit is paid
        if (p.visits && p.visits.length > 0) {
          // Sort by creation date descending to get the latest visit
          const sortedVisits = [...p.visits].sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const latestVisit = sortedVisits[0];
          setIsVisitPaid(latestVisit.status === 'paid');
        } else {
          setIsVisitPaid(false);
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
    };
    fetchAllData();

    // Load the global clinic consultation fee
    settingsAPI.get().then((res: any) => {
      const fee = res?.data?.consultation_fee ?? res?.consultation_fee;
      setGlobalFee(fee !== undefined && fee !== null ? parseFloat(String(fee)) : 500);
    }).catch(() => setGlobalFee(500));
  }, [unwrappedId]);

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
      await visitAPI.store(visitData);
      toast.success("Visit started! Consultation fee of KSh " + (globalFee ?? 0).toLocaleString() + " has been billed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to start visit. Please try again.");
      setIsVisitModalOpen(true);
    } finally {
      setIsStartingVisit(false);
    }
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
            onClick={() => setIsVisitModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Start New Visit
          </button>
          <button
            onClick={() => router.push(`/patients/${unwrappedId}/record`)}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-all active:scale-95"
          >
            <ClipboardList className="h-4 w-4 mr-2 text-slate-500" />
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
            <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start text-red-800 border-l-4 border-red-500">
              <AlertTriangle className="h-5 w-5 mr-2 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold">Known Allergies:</p>
                <p className="text-sm mt-0.5">{patient.allergies}</p>
              </div>
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
                  w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center
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
