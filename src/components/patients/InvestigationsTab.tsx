import { Plus, CheckCircle2, Clock } from "lucide-react";

export function InvestigationsTab() {
  const tests = [
    { id: "INV-091", name: "Complete Blood Count (CBC)", date: "Oct 24, 2023", provider: "Dr. Smith", status: "Completed" },
    { id: "INV-092", name: "Lipid Panel", date: "Oct 24, 2023", provider: "Dr. Smith", status: "Completed" },
    { id: "INV-104", name: "HbA1c", date: "Oct 28, 2023", provider: "Dr. Smith", status: "Pending" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Investigations & Labs</h2>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-9 px-4 shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Request Test
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <ul className="divide-y divide-slate-200">
          {tests.map((test) => (
            <li key={test.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 flex items-center justify-center rounded-full ${test.status === 'Completed' ? 'bg-green-100' : 'bg-amber-100'}`}>
                    {test.status === 'Completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{test.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Requested on {test.date} by {test.provider}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    test.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {test.status}
                  </span>
                  {test.status === 'Completed' ? (
                    <button className="text-primary-600 hover:text-primary-700 font-medium text-xs">View Results</button>
                  ) : (
                    <button className="text-slate-400 hover:text-slate-600 font-medium text-xs">Upload Result</button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
