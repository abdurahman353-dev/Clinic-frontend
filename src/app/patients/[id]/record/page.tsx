"use client";

import React, { use, useState, useEffect, Fragment } from "react";
import { patientAPI } from "@/lib/api";
import { printHtml } from "@/lib/print";
import {
  Loader2, Printer, Activity, Microscope, Pill, AlertTriangle, ArrowLeft
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ModernPatientRecord({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const patientId = unwrappedParams.id;

  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await patientAPI.get(patientId, { include: 'vitalSigns,investigations,prescriptions.items' });
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

  // Aggregate clinical data
  const clinicalRecords = [
    ...(patient.vitals || []).map((v: any) => ({
      date: v.created_at,
      type: "VITALS",
      icon: <Activity className="h-4 w-4" />,
      iconHtml: "💉",
      details: `BP: ${v.blood_pressure || "-"} | Pulse: ${v.pulse || "-"} | Temp: ${v.temperature || "-"}°C | Wt: ${v.weight || "-"}kg | BMI: ${v.bmi || "-"}`,
      reason: v.notes || "",
    })),
    ...(patient.investigations || [])
      .filter((i: any) => i.status === "completed")
      .map((i: any) => ({
        date: i.created_at,
        type: "INVESTIGATION",
        icon: <Microscope className="h-4 w-4" />,
        iconHtml: "🔬",
        details: `${i.name.toUpperCase()}: ${i.result}`,
        reason: i.notes || "",
      })),
    ...(patient.prescriptions || []).map((p: any) => ({
      date: p.created_at,
      type: "PRESCRIPTION",
      icon: <Pill className="h-4 w-4" />,
      iconHtml: "💊",
      details: p.items
        .map((item: any) => `${item.medicine} [${item.dosage || "N/A"}] (Qty: ${item.quantity})`)
        .join("; "),
      reason: p.notes || "",
    })),
  ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handlePrint = () => {
    const today = new Date().toLocaleDateString("en-GB");

    const rowsHtml = clinicalRecords.length > 0
      ? clinicalRecords.map(record => `
          <tr>
            <td style="padding:10px 16px;vertical-align:top;border-bottom:1px solid #f1f5f9;width:100px;">
              <p style="font-weight:700;color:#0f172a;font-size:12px;margin:0">${new Date(record.date).toLocaleDateString("en-GB")}</p>
              <p style="font-size:9px;color:#94a3b8;font-weight:700;margin:2px 0 0">${new Date(record.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </td>
            <td style="padding:10px 16px;vertical-align:top;border-bottom:1px solid #f1f5f9;width:140px;">
              <span style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:#475569;">
                ${record.iconHtml} ${record.type}
              </span>
            </td>
            <td style="padding:10px 16px;vertical-align:top;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569;line-height:1.6;">
              ${record.details}
            </td>
            <td style="padding:10px 16px;vertical-align:top;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b;font-style:italic;">
              ${record.reason || "-"}
            </td>
          </tr>`)
        .join("")
      : `<tr><td colspan="4" style="padding:40px;text-align:center;color:#cbd5e1;font-style:italic;font-weight:700;">No clinical history records found.</td></tr>`;

    const html = `
      <div style="max-width:860px;margin:0 auto;padding:40px 48px;background:white;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:24px;">
          <img src="/wafaa_logo.jpeg" alt="Wafaa Medical" style="height:80px;width:auto;object-fit:contain;margin:0 auto 8px;display:block;" />
          <p style="font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.3em;margin:4px 0;">Quality Healthcare Services</p>
          <p style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:2px 0;">P.O BOX 42409-80100 &bull; Mombasa, Kenya &bull; Tel: +254 710262377 &bull; Email: wafaamedicalclinic@gmail.com</p>
          <div style="height:2px;background:#0f172a;width:200px;margin:16px auto 0;"></div>
        </div>

        <!-- Title -->
        <div style="text-align:center;margin-bottom:32px;">
          <h2 style="font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;margin:0;">Comprehensive Patient History</h2>
          <p style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;margin:4px 0 0;">Official Clinical Summary</p>
        </div>

        <!-- Patient Info Card -->
        <div style="background:#f8fafc;padding:24px;margin-bottom:32px;display:grid;grid-template-columns:1fr 1fr;gap:24px;">
          <div>
            <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;margin:0 0 4px;">Patient Full Name</p>
            <p style="font-size:20px;font-weight:700;text-transform:uppercase;margin:0 0 16px;color:#0f172a;">${patient.name}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;border-top:1px solid #e2e8f0;padding-top:16px;">
              <div>
                <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;margin:0 0 2px;">ID Number</p>
                <p style="font-weight:700;color:#0f172a;margin:0;font-family:monospace;">#${patient.patient_id || patient.id}</p>
              </div>
              <div>
                <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;margin:0 0 2px;">Gender</p>
                <p style="font-weight:700;color:#0f172a;margin:0;text-transform:capitalize;">${patient.gender}</p>
              </div>
            </div>
          </div>
          <div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
              <div>
                <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;margin:0 0 2px;">Age</p>
                <p style="font-weight:700;color:#0f172a;margin:0;">${patient.age || "N/A"} Years</p>
              </div>
              <div>
                <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;margin:0 0 2px;">Blood Group</p>
                <p style="font-weight:700;color:#475569;margin:0;">${patient.blood_group || "N/A"}</p>
              </div>
            </div>
            <div style="border-top:1px solid #e2e8f0;padding-top:16px;">
              <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;margin:0 0 4px;">Known Medical Allergies</p>
              <p style="font-size:12px;font-weight:600;color:${patient.allergies ? '#334155' : '#94a3b8'};font-style:${patient.allergies ? 'normal' : 'italic'};margin:0;">${patient.allergies || "None Disclosed"}</p>
            </div>
          </div>
        </div>

        <!-- Clinical History Table -->
        <div style="margin-bottom:32px;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
            <h3 style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;color:#0f172a;margin:0;white-space:nowrap;">Clinical Progress History</h3>
            <div style="height:1px;background:#e2e8f0;flex:1;"></div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                <th style="padding:10px 16px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;width:100px;">Date</th>
                <th style="padding:10px 16px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;width:140px;">Category</th>
                <th style="padding:10px 16px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;">Clinical Observations</th>
                <th style="padding:10px 16px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;width:180px;">Reason</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>

        <!-- Footer signatures -->
        <div style="margin-top:48px;padding-top:32px;border-top:1px solid #f1f5f9;display:grid;grid-template-columns:1fr 1fr;gap:64px;padding-left:24px;padding-right:24px;">
          <div style="text-align:center;">
            <div style="height:1px;background:#e2e8f0;margin-bottom:8px;"></div>
            <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;margin:0;">Medical Officer Signature</p>
            <p style="font-size:8px;color:#cbd5e1;font-weight:700;text-transform:uppercase;margin:4px 0 0;">Mombasa, Kenya</p>
          </div>
          <div style="text-align:center;">
            <div style="height:3px;background:#0f172a;margin-bottom:8px;"></div>
            <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#0f172a;margin:0;">Authorizing Physician</p>
            <p style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin:4px 0 0;text-decoration:underline;">${today}</p>
          </div>
        </div>

        <!-- Footer text -->
        <div style="margin-top:48px;text-align:center;">
          <p style="font-size:8px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.3em;margin:0;">Official Clinical Documentation - Wafaa Med-Cloud</p>
          <p style="font-size:7px;color:#cbd5e1;font-style:italic;max-width:400px;margin:4px auto 0;">This computer-generated document is a validated summary of health records and is official when paired with a valid facility stamp.</p>
        </div>
      </div>
    `;

    printHtml(html, "A4", `
      @page { size: A4; margin: 10mm; }
      body { margin: 0; padding: 0; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    `);
  };

  return (
    <div className="bg-slate-100/50 min-h-screen p-0 md:p-12 font-sans text-slate-900 overflow-y-auto">
      {/* Print Button */}
      <div className="max-w-[900px] mx-auto mb-6 flex justify-between items-center px-4 md:px-0 sticky top-0 z-10 pt-6 md:pt-0">
        <Link href={`/patients/${patient.db_id}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-all active:scale-95"
        >
          <Printer className="h-4 w-4" />
          Print Official Report
        </button>
      </div>

      {/* Screen Preview */}
      <div className="max-w-[900px] mx-auto bg-white p-10 md:p-16 shadow-sm min-h-[1100px] relative flex flex-col">
        {/* Clinic Header */}
        <div className="flex flex-col items-center mb-6 space-y-3">
          <div className="relative h-20 w-48">
            <Image src="/wafaa_logo.jpeg" alt="Wafaa Medical Services" fill style={{ objectFit: "contain" }} priority />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Quality Healthcare Services</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            P.O BOX 42409-80100 &bull; Mombasa, Kenya &bull; Tel: +254 710262377 &bull; Email: wafaamedicalclinic@gmail.com
          </p>
          <div className="h-0.5 w-48 bg-slate-900 mx-auto" />
        </div>

        <div className="text-center mb-10">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Comprehensive Patient History</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Official Clinical Summary</p>
        </div>

        {/* Patient Info */}
        <div className="mb-10 grid grid-cols-2 gap-8 bg-slate-50 p-8">
          <div className="space-y-5">
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Patient Full Name</span>
              <p className="font-semibold text-xl text-slate-900 uppercase leading-none">{patient.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-6 border-t border-slate-200 pt-5">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">ID Number</span>
                <p className="font-semibold text-slate-900 font-mono text-sm">#{patient.patient_id || patient.id}</p>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Gender</span>
                <p className="font-semibold text-slate-900 text-sm capitalize">{patient.gender}</p>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Age</span>
                <p className="font-semibold text-slate-900 text-sm">{patient.age} Years</p>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Blood Group</span>
                <p className="font-semibold text-slate-600 text-sm">{patient.blood_group || "N/A"}</p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-5">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Known Medical Allergies</span>
              <p className={`text-sm font-semibold leading-relaxed ${patient.allergies ? "text-slate-700" : "text-slate-400 italic"}`}>
                {patient.allergies || "None Disclosed"}
              </p>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 whitespace-nowrap">Clinical Progress History</h3>
            <div className="h-px bg-slate-200 w-full" />
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-28">Date</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-40">Category</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Clinical Observations</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-48">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clinicalRecords.length > 0
                ? clinicalRecords.map((record: any, i: number) => (
                  <tr key={i} className="group">
                    <td className="px-6 py-5 align-top">
                      <p className="font-bold text-slate-900 text-xs">{new Date(record.date).toLocaleDateString("en-GB")}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                        {new Date(record.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="inline-flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest text-slate-500">
                        {record.icon}
                        {record.type}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-xs text-slate-600 font-medium leading-relaxed">{record.details}</td>
                    <td className="px-6 py-5 align-top text-[11px] text-slate-500 font-semibold italic leading-relaxed">{record.reason || "-"}</td>
                  </tr>
                ))
                : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-300 italic font-bold text-sm">
                      No clinical history records found for this patient.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* Signature Footer */}
        <div className="mt-16 pt-12 border-t border-slate-100 grid grid-cols-2 gap-20 px-8">
          <div className="text-center">
            <div className="h-px w-full bg-slate-200 mb-3" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medical Officer Signature</p>
            <p className="text-[8px] text-slate-300 font-bold uppercase mt-1">Mombasa, Kenya</p>
          </div>
          <div className="text-center">
            <div className="h-1 w-full bg-slate-900 mb-3" />
            <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Authorizing Physician</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{new Date().toLocaleDateString("en-GB")}</p>
          </div>
        </div>

        <div className="mt-16 text-center space-y-1.5 pb-2">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Clinical Documentation - Wafaa Med-Cloud</p>
          <p className="text-[7px] text-slate-300 italic max-w-md mx-auto">
            This computer-generated document is a validated summary of health records and is official when paired with a valid facility stamp.
          </p>
        </div>
      </div>
    </div>
  );
}
