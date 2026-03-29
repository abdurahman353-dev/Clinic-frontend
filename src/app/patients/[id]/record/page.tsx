"use client";

import { use, useState, useEffect } from "react";
import { patientAPI } from "@/lib/api";
import { Loader2, Printer, Activity, Microscope, Pill, Calendar, User, Phone, Droplet, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default function ModernPatientRecord({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const patientId = unwrappedParams.id;

  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await patientAPI.get(patientId);
        setPatient(response.data);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load clinical records.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatientData();
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (errorMsg || !patient) {
    return (
      <div className="p-12 text-center text-red-600 font-bold bg-white min-h-screen">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        Error: {errorMsg || "Record not found"}
      </div>
    );
  }

  // Aggregate clinical data into a single unified record
  const clinicalRecords = [
    ...(patient.vitals || []).map((v: any) => ({
      date: v.created_at,
      type: 'VITALS',
      icon: <Activity className="h-4 w-4" />,
      color: 'bg-blue-50 text-blue-700',
      details: `BP: ${v.blood_pressure || '-'} | Pulse: ${v.pulse || '-'} | Temp: ${v.temperature || '-'}°C | Wt: ${v.weight || '-'}kg | BMI: ${v.bmi || '-'}`
    })),
    ...(patient.investigations || []).filter((i: any) => i.status === 'completed').map((i: any) => ({
      date: i.created_at,
      type: 'INVESTIGATION',
      icon: <Microscope className="h-4 w-4" />,
      color: 'bg-purple-50 text-purple-700',
      details: `${i.name.toUpperCase()}: ${i.result}`
    })),
    ...(patient.prescriptions || []).map((p: any) => ({
      date: p.created_at,
      type: 'PRESCRIPTION',
      icon: <Pill className="h-4 w-4" />,
      color: 'bg-emerald-50 text-emerald-700',
      details: p.items.map((item: any) => `${item.medicine} [${item.dosage || 'N/A'}] (Qty: ${item.quantity})`).join('; ')
    }))
  ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-slate-100/50 min-h-screen p-0 md:p-12 print:bg-white print:p-0 font-sans text-slate-900 overflow-y-auto">
      {/* Print Trigger Button - Hidden on Print */}
      <div className="max-w-[900px] mx-auto mb-6 flex justify-end items-center print:hidden px-4 md:px-0 sticky top-0 z-10">
        {/* <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Image src="/wafaa_logo.jpeg" alt="Logo" width={24} height={24} className="rounded-full" />
          </div>
          <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Medical Record System</p>
        </div> */}
        <button
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-black text-sm hover:bg-slate-800 flex items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Printer className="h-4 w-4" />
          Print Official Report
        </button>
      </div>

      {/* Main Document Body */}
      <div className="max-w-[900px] mx-auto bg-white p-24 print:shadow-none print:p-0 print:rounded-none min-h-[1100px] relative flex flex-col print:w-full">

        {/* Clinic Header with Logo */}
        <div className="flex flex-col items-center mb-4 space-y-4">
          <div className="relative w-100 h-24 mb-2 align-center justify-center">
            <Image
              src="/wafaa_logo.jpeg"
              alt="Wafaa Medical Services"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Quality Healthcare Services</p>
            <div className="text-[10px] space-y-0.5 font-bold text-slate-500 uppercase tracking-wider">
              <p>Nairobi, Kenya &bull; Tel: +254 700 000 000 &bull; Email: clinical@wafaa.med</p>
            </div>
          </div>
          <div className="h-0.5 w-64 bg-slate-900 mx-auto mt-4"></div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Comprehensive Patient History</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Official Clinical Summary</p>
        </div>

        {/* Patient Profile Card (Restored modern look) */}
        <div className="mb-14 grid grid-cols-2 gap-10 bg-slate-50 p-10 print:bg-white print:border-slate-200">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Patient Full Name</span>
              <p className="font-semibold text-2xl text-slate-900 uppercase leading-none tracking-tight">{patient.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-6">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">ID Number</span>
                <p className="font-semibold text-slate-900 font-mono text-base leading-none">#{patient.id || patient.db_id}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Gender</span>
                <p className="font-semibold text-slate-900 text-base capitalize leading-none">{patient.gender}</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Age</span>
                <p className="font-semibold text-slate-900 text-base leading-none">{patient.age} Years</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Blood Group</span>
                <p className="font-semibold text-slate-600 text-base leading-none">{patient.blood_group || "N/A"}</p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-6">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Known Medical Allergies</span>
              <p className={`text-sm font-semibold leading-relaxed ${patient.allergies ? 'text-slate-700' : 'text-slate-500 italic'}`}>
                {patient.allergies || "None Disclosed"}
              </p>
            </div>
          </div>
        </div>

        {/* Unified History List */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 whitespace-nowrap">Clinical Progress History</h3>
            <div className="h-px bg-slate-200 w-full"></div>
          </div>

          <div className="overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-44">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12px] text-slate-700">
                {clinicalRecords.length > 0 ? clinicalRecords.map((record: any, i: number) => (
                  <tr key={i} className="transition-colors group break-inside-avoid">
                    <td className="px-8 py-6 align-top">
                      <p className="font-bold text-slate-900 text-[13px]">{new Date(record.date).toLocaleDateString('en-GB')}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">{new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-6 align-top">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 font-black text-[9px] uppercase tracking-widest transition-all shrink-0`}>
                        {record.icon}
                        {record.type}
                      </div>
                    </td>
                    <td className="px-8 py-6 align-top leading-relaxed text-slate-600 font-medium text-[13px]">
                      {record.details}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-8 py-16 text-center text-slate-300">
                      <div className="flex flex-col items-center gap-3">
                        <AlertTriangle className="h-8 w-8 text-slate-100" />
                        <p className="italic font-bold">No clinical history records found for this patient.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Footer (Restored original style) */}
        <div className="mt-20 pt-16 border-t border-slate-100 grid grid-cols-2 gap-24 px-10">
          <div className="text-center group">
            <div className="h-0.5 w-full bg-slate-200 mb-4 group-hover:bg-slate-300 transition-colors"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Officer Signature</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">Nairobi, Kenya</p>
          </div>
          <div className="text-center group">
            <div className="h-1 w-full bg-slate-900 mb-4 shadow-sm"></div>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Authorizing Physician</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 underline decoration-primary-200 underline-offset-4">{new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <div className="mt-24 text-center space-y-2 pb-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Clinical Documentation - Wafaa Med-Cloud</p>
          <p className="text-[8px] text-slate-300 italic max-w-md mx-auto">This computer-generated document is a validated summary of health records and is official when paired with a valid facility stamp.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #portal-root, #modal-root {
            visibility: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .bg-slate-100\\/50 {
            background-color: white !important;
          }
          .p-24 {
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
