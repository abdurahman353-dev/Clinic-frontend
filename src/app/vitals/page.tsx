import { VitalsTab } from "@/components/patients/VitalsTab";
import { Activity } from "lucide-react";

export default function VitalsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary-600" />
            Clinic Vitals Overview
          </h1>
          <p className="text-slate-500 mt-1">Recent vital signs recorded across all patients.</p>
        </div>
      </div>
      
      {/* Reusing the Vitals component developed for the patient profile */}
      <VitalsTab />
    </div>
  );
}
