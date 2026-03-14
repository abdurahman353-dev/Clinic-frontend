"use client";

import { useState } from "react";
import { ArrowLeft, Edit, Activity, NotepadText, FileText, Clock, User, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { VitalsTab } from "../../../components/patients/VitalsTab";
import { InvestigationsTab } from "../../../components/patients/InvestigationsTab";
import { PrescriptionsTab } from "../../../components/patients/PrescriptionsTab";

// Main patient profile view component
export default function PatientProfile() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const patient = {
    id: id || "P-10024",
    name: "Sarah Johnson",
    age: 34,
    gender: "Female",
    bloodGroup: "O+",
    phone: "+1 (555) 123-4567",
    email: "sarah.j@example.com",
    address: "123 Maple Street, Anytown, CA 90210",
    allergies: "Penicillin, Peanuts",
    status: "Active"
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: User },
    { id: "vitals", name: "Vitals", icon: Activity },
    { id: "investigations", name: "Investigations", icon: NotepadText },
    { id: "prescriptions", name: "Prescriptions", icon: FileText },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Back Navigation */}
      <div className="flex flex-col space-y-4">
        <Link href="/patients" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 w-fit transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Patients
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl border-2 border-white shadow-sm">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {patient.name}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {patient.status}
                </span>
              </h1>
              <p className="text-slate-500 mt-1">{patient.id} &bull; {patient.age} yrs, {patient.gender} &bull; Blood Group {patient.bloodGroup}</p>
            </div>
          </div>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 h-10 px-4 py-2 shadow-sm">
            <Edit className="mr-2 h-4 w-4 text-slate-500" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <tab.icon className={`mr-2 h-4 w-4 ${activeTab === tab.id ? "text-primary-500" : "text-slate-400"}`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content Areas */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 tracking-wide uppercase mb-4">Contact Information</h3>
                <dl className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-slate-500">Phone</dt>
                      <dd className="text-sm font-medium text-slate-900">{patient.phone}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-slate-500">Address</dt>
                      <dd className="text-sm font-medium text-slate-900">{patient.address}</dd>
                    </div>
                  </div>
                </dl>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 tracking-wide uppercase mb-4">Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.split(", ").map((allergy, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-red-50 text-red-700 border border-red-100">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center py-16 text-center text-slate-500">
                <Clock className="h-12 w-12 mb-4 text-slate-300" />
                <p>Welcome to the Patient Overview.</p>
                <p className="text-sm mt-1">Select Vitals, Investigations, or Prescriptions tabs for detailed actions.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "vitals" && <VitalsTab />}
        {activeTab === "investigations" && <InvestigationsTab />}
        {activeTab === "prescriptions" && <PrescriptionsTab />}
      </div>
    </div>
  );
}
