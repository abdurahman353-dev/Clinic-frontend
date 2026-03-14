import { Users, Activity, NotepadText, TrendingUp, Calendar, Clock } from "lucide-react";

export default function Home() {
  const stats = [
    { label: "Total Patients", value: "1,248", change: "+12%", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Active Investigations", value: "43", change: "-5%", icon: NotepadText, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Consultations Today", value: "28", change: "+18%", icon: Activity, color: "text-green-600", bg: "bg-green-100" },
    { label: "Revenue (MTD)", value: "$12,400", change: "+8%", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  const recentActivity = [
    { id: 1, type: "appointment", patient: "Sarah Johnson", details: "Routine Checkup", time: "10:30 AM", status: "completed" },
    { id: 2, type: "investigation", patient: "Michael Brown", details: "Blood Test Results Available", time: "11:15 AM", status: "pending" },
    { id: 3, type: "prescription", patient: "Emily Davis", details: "Prescription Renewed", time: "01:00 PM", status: "completed" },
    { id: 4, type: "appointment", patient: "James Wilson", details: "Follow-up Consultation", time: "02:30 PM", status: "upcoming" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Morning, Dr. Smith</h1>
          <p className="text-slate-500 mt-1">Here is what is happening at your clinic today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 h-10 px-4 py-2 shadow-sm">
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </button>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 py-2 shadow-sm">
            New Patient
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stat.change.startsWith("+") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Chart Area placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Patient Attendance</h2>
            <select className="text-sm border-slate-200 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-72 w-full bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
            <div className="text-center text-slate-400">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Chart visualization will appear here</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</button>
          </div>
          <div className="flex-1 overflow-y-auto w-full">
            <ul className="space-y-6">
              {recentActivity.map((activity, i) => (
                <li key={activity.id} className="relative">
                  {i !== recentActivity.length - 1 && (
                    <span className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center ring-4 ring-white">
                        {activity.type === "appointment" && <Users className="h-4 w-4 text-primary-500" />}
                        {activity.type === "investigation" && <NotepadText className="h-4 w-4 text-purple-500" />}
                        {activity.type === "prescription" && <Calendar className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <div className="text-sm text-slate-900 font-medium">
                        {activity.patient}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {activity.details}
                      </div>
                    </div>
                    <div className="text-right text-xs whitespace-nowrap text-slate-400 pt-1.5 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.time}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
