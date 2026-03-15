"use client";

import { FileSearch } from "lucide-react";
import Link from "next/link";

export default function InvestigationsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Investigations</h1>
          <p className="text-slate-500 mt-1">Global view of all lab and radiology tests.</p>
        </div>
      </div>

      <div className="bg-white p-12 border border-slate-200 rounded-xl shadow-sm text-center">
        <FileSearch className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">Investigations Dashboard</h3>
        <p className="border-t border-slate-100 mt-4 pt-4 text-slate-500 text-sm max-w-md mx-auto">
          To manage investigations for a specific patient, please navigate to the <Link href="/patients" className="text-primary-600 hover:underline">Patient Profiles</Link> directory.
        </p>
      </div>
    </div>
  );
}
