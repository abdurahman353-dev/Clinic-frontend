import { PrescriptionsTab } from "@/components/patients/PrescriptionsTab";
import { FileText } from "lucide-react";

export default function PrescriptionsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary-600" />
            Clinic Prescriptions
          </h1>
          <p className="text-slate-500 mt-1">Active and recent medication prescriptions.</p>
        </div>
      </div>
      
      {/* Reusing the Prescriptions component developed for the patient profile */}
      <PrescriptionsTab />
    </div>
  );
}
