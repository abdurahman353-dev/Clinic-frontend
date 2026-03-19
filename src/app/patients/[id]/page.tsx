"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, User as UserIcon, Calendar, Phone, Mail, Droplet, AlertTriangle, FileText, Activity } from "lucide-react";
import Link from "next/link";
import { patientAPI } from "@/lib/api";
import VitalsTab from "@/components/patients/VitalsTab";
import InvestigationsTab from "@/components/patients/InvestigationsTab";
import PrescriptionsTab from "@/components/patients/PrescriptionsTab";

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const unwrappedId = unwrappedParams.id;
  
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "vitals";
  
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);

  // Centralized state for tabs to avoid re-fetching on switch
  const [vitalsData, setVitalsData ] = useState<any[]>([]);
  const [investigationsData, setInvestigationsData] = useState<any[]>([]);
  const [prescriptionsData, setPrescriptionsData] = useState<any[]>([]);
  const [isVitalsLoaded, setIsVitalsLoaded] = useState(false);
  const [isInvestigationsLoaded, setIsInvestigationsLoaded] = useState(false);
  const [isPrescriptionsLoaded, setIsPrescriptionsLoaded] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["vitals", "investigations", "prescriptions"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const data = await patientAPI.get(unwrappedId); // Changed apiFetch to patientAPI.get and removed endpoint string
        setPatient(data.data); // Changed response.data to data.data
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load patient");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, [unwrappedId]);

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
    { id: "vitals", label: "Vitals", icon: Activity },
    { id: "investigations", label: "Investigations", icon: FileText },
    { id: "prescriptions", label: "Prescriptions", icon: Droplet },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Link href="/patients" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
      </Link>

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
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    patient.patient_type === 'inpatient' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
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
              onDataChange={setVitalsData} 
              isInitialLoaded={isVitalsLoaded}
              onLoadComplete={() => setIsVitalsLoaded(true)}
            />
          )}
          {activeTab === "investigations" && (
            <InvestigationsTab 
              patientId={patient.db_id} 
              initialData={investigationsData} 
              onDataChange={setInvestigationsData} 
              isInitialLoaded={isInvestigationsLoaded}
              onLoadComplete={() => setIsInvestigationsLoaded(true)}
            />
          )}
          {activeTab === "prescriptions" && (
            <PrescriptionsTab 
              patientId={patient.db_id} 
              initialData={prescriptionsData} 
              onDataChange={setPrescriptionsData} 
              isInitialLoaded={isPrescriptionsLoaded}
              onLoadComplete={() => setIsPrescriptionsLoaded(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
