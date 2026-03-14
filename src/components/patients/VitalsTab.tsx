import { Activity, Plus, TrendingUp } from "lucide-react";

export function VitalsTab() {
  const vitalsHistory = [
    { date: "Oct 24, 2023", bp: "120/80", hr: "72 bpm", temp: "98.6°F", resp: "16/min", spo2: "99%" },
    { date: "Sep 15, 2023", bp: "118/78", hr: "74 bpm", temp: "98.4°F", resp: "18/min", spo2: "98%" },
    { date: "Aug 10, 2023", bp: "122/82", hr: "76 bpm", temp: "99.1°F", resp: "16/min", spo2: "98%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Vitals History</h2>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-9 px-4 shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Record Vitals
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Blood Pressure", value: "120/80", unit: "mmHg", icon: Activity, color: "text-red-500", bg: "bg-red-50" },
          { label: "Heart Rate", value: "72", unit: "bpm", icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "Temperature", value: "98.6", unit: "°F", icon: Activity, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Resp. Rate", value: "16", unit: "/min", icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "SpO2 (Oxygen)", value: "99", unit: "%", icon: Activity, color: "text-sky-500", bg: "bg-sky-50" },
        ].map((vital, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg ${vital.bg} flex items-center justify-center mb-3`}>
              <vital.icon className={`h-4 w-4 ${vital.color}`} />
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{vital.label}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{vital.value}</span>
              <span className="text-sm font-medium text-slate-500">{vital.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Blood Pressure</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Heart Rate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Temperature</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Resp. Rate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SpO2</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200 text-sm">
              {vitalsHistory.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">{row.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.bp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.hr}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.temp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.resp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.spo2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
