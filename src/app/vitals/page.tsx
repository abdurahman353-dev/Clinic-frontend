"use client";

import { Activity } from "lucide-react";
import Link from "next/link";

export default function VitalsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Vitals</h1>
          <p className="text-slate-500 mt-1">Overview of recent vitals tracked across the clinic.</p>
        </div>
      </div>

      <div className="bg-white p-12 border border-slate-200 rounded-xl shadow-sm text-center">
        <Activity className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">Vitals Overview</h3>
        <p className="border-t border-slate-100 mt-4 pt-4 text-slate-500 text-sm max-w-md mx-auto">
          Please navigate to a specific <Link href="/patients" className="text-primary-600 hover:underline">Patient's Profile</Link> to record and view their vitals history.
        </p>
      </div>
    </div>
  );
}
