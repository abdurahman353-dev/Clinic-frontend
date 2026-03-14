import { Plus, Pill } from "lucide-react";

export function PrescriptionsTab() {
  const prescriptions = [
    { id: "Rx-4029", medicine: "Amoxicillin 500mg", dosage: "1 tablet", frequency: "3 times a day", duration: "7 days", date: "Oct 24, 2023", active: true },
    { id: "Rx-4030", medicine: "Ibuprofen 400mg", dosage: "1 tablet", frequency: "As needed for pain", duration: "5 days", date: "Oct 24, 2023", active: true },
    { id: "Rx-3155", medicine: "Lisinopril 10mg", dosage: "1 tablet", frequency: "Once daily", duration: "30 days", date: "Sep 15, 2023", active: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Prescriptions</h2>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-9 px-4 shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          New Prescription
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col h-full">
            {rx.active && (
              <div className="absolute top-0 right-0 shadow-sm">
                <div className="bg-green-500 text-white text-[10px] uppercase font-bold tracking-wider py-1 px-3 rounded-bl-lg">Active</div>
              </div>
            )}
            <div className="flex items-start gap-4 mb-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${rx.active ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-400'}`}>
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${rx.active ? 'text-slate-900' : 'text-slate-600'}`}>{rx.medicine}</h3>
                <p className="text-sm text-slate-500 mt-1">{rx.id} &bull; Prescribed {rx.date}</p>
              </div>
            </div>
            
            <div className="mt-auto bg-slate-50 rounded-lg p-3 grid grid-cols-3 gap-2 divide-x divide-slate-200 border border-slate-100">
              <div className="px-2">
                <span className="block text-xs text-slate-500 mb-0.5">Dosage</span>
                <span className="block text-sm font-medium text-slate-900">{rx.dosage}</span>
              </div>
              <div className="px-2">
                <span className="block text-xs text-slate-500 mb-0.5">Frequency</span>
                <span className="block text-sm font-medium text-slate-900">{rx.frequency}</span>
              </div>
              <div className="px-2">
                <span className="block text-xs text-slate-500 mb-0.5">Duration</span>
                <span className="block text-sm font-medium text-slate-900">{rx.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
