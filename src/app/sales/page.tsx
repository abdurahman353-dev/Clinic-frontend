"use client";

import { useState, useEffect, useCallback } from "react";
import { salesAPI } from "@/lib/api";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Download, 
  Filter, 
  Loader2,
  ChevronRight,
  Stethoscope,
  FlaskConical,
  Pill,
  Activity,
  HeartPulse,
  X
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";

export default function SalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filters, setFilters] = useState({
    from_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0]
  });

  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [selectedDayBills, setSelectedDayBills] = useState<any[]>([]);
  const [loadingDayDetails, setLoadingDayDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await salesAPI.report(filters);
      setData(response.data);
    } catch (error: any) {
      toast.error("Failed to load sales report");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleViewDaily = async (date: string) => {
    setSelectedDate(date);
    setIsDailyModalOpen(true);
    setLoadingDayDetails(true);
    try {
      const response = await salesAPI.dailyDetails(date);
      setSelectedDayBills(response.data);
    } catch (error) {
      toast.error("Failed to load daily details");
    } finally {
      setLoadingDayDetails(false);
    }
  };

  const handleExport = () => {
    if (!data?.daily) return;

    const headers = ["Date", "Consultation", "Vitals", "Investigations", "Prescriptions", "Total"];
    const rows = data.daily.map((day: any) => [
      day.date,
      day.consultation,
      day.vitals,
      day.investigations,
      day.prescriptions,
      day.total
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r: any) => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${filters.from_date}_to_${filters.to_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b'];

  if (loading && !data) {
    return (
      <div className="flex bg-slate-50 items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  const summary = data?.summary || {};
  let dailyData = [...(data?.daily || [])].reverse(); // For chart

  // If there's only one data point, add a dummy point at the beginning to show a line/curve
  if (dailyData.length === 1) {
    const firstDate = new Date(dailyData[0].date);
    const prevDate = new Date(firstDate);
    prevDate.setDate(firstDate.getDate() - 1);
    dailyData = [
      { date: prevDate.toISOString().split('T')[0], total: 0, consultation: 0, vitals: 0, investigations: 0, prescriptions: 0 },
      ...dailyData
    ];
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Dashboard</h1>
          <p className="text-slate-500 mt-1">Professional financial overview of clinic operations</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Calendar className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="date" 
              value={filters.from_date}
              onChange={(e) => setFilters({...filters, from_date: e.target.value})}
              className="text-sm border-none focus:ring-0 p-0 text-slate-700" 
            />
            <span className="mx-2 text-slate-300">to</span>
            <input 
              type="date" 
              value={filters.to_date}
              onChange={(e) => setFilters({...filters, to_date: e.target.value})}
              className="text-sm border-none focus:ring-0 p-0 text-slate-700" 
            />
          </div>
          
          <button 
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard 
          title="Total Revenue" 
          value={`KSh ${Number(summary.grand_total || 0).toLocaleString()}`} 
          subtext={`${summary.transaction_count || 0} Transactions`}
          icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
          color="emerald"
        />
        <SummaryCard 
          title="Consultations" 
          value={`KSh ${Number(summary.consultation_total || 0).toLocaleString()}`} 
          subtext="Professional Fees"
          icon={<Stethoscope className="h-6 w-6 text-blue-600" />}
          color="blue"
        />
        <SummaryCard 
          title="Laboratory" 
          value={`KSh ${Number(summary.investigation_total || 0).toLocaleString()}`} 
          subtext="Lab & Radiology"
          icon={<FlaskConical className="h-6 w-6 text-purple-600" />}
          color="purple"
        />
        <SummaryCard 
          title="Prescriptions" 
          value={`KSh ${Number(summary.medicine_total || 0).toLocaleString()}`} 
          subtext="Pharmacy Sales"
          icon={<Pill className="h-6 w-6 text-pink-600" />}
          color="pink"
        />
        <SummaryCard 
          title="Vitals" 
          value={`KSh ${Number(summary.vitals_total || 0).toLocaleString()}`} 
          subtext="Nursing Services"
          icon={<HeartPulse className="h-6 w-6 text-orange-600" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
              Daily Revenue Trend
            </h3>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#64748b', fontSize: 12}}
                  dy={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#64748b', fontSize: 12}}
                  tickFormatter={(val) => `KSh ${val >= 1000 ? (val/1000) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-slate-600" />
            Revenue Mix
          </h3>
          
          <div className="space-y-6">
            <ProgressBar label="Consultations" amount={summary.consultation_total} total={summary.grand_total} color="bg-blue-500" />
            <ProgressBar label="Laboratory" amount={summary.investigation_total} total={summary.grand_total} color="bg-purple-500" />
            <ProgressBar label="Prescriptions" amount={summary.medicine_total} total={summary.grand_total} color="bg-pink-500" />
            <ProgressBar label="Vitals" amount={summary.vitals_total} total={summary.grand_total} color="bg-orange-500" />
          </div>

          <div className="mt-12 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Performance Data</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Daily Average</span>
              <span className="text-sm font-bold text-slate-900">
                KSh {Number(data.daily.length > 0 ? summary.grand_total / data.daily.length : 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Daily Sales Breakdown</h3>
          <span className="text-xs text-slate-500">{data.daily.length} days in period</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-3 border-b border-slate-100">Date</th>
                <th className="px-6 py-3 border-b border-slate-100">Consultation</th>
                <th className="px-6 py-3 border-b border-slate-100">Lab & Radio</th>
                <th className="px-6 py-3 border-b border-slate-100">Pharmacy</th>
                <th className="px-6 py-3 border-b border-slate-100">Vitals</th>
                <th className="px-6 py-3 border-b border-slate-100">Totals</th>
                <th className="px-6 py-3 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {data.daily.map((day: any) => (
                <tr key={day.date} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-slate-600">KSh {Number(day.consultation).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">KSh {Number(day.investigations).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">KSh {Number(day.prescriptions).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">KSh {Number(day.vitals).toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">KSh {Number(day.total).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleViewDaily(day.date)}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Daily
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Details Modal */}
      <Modal
        isOpen={isDailyModalOpen}
        onClose={() => setIsDailyModalOpen(false)}
        title={`Daily Sales Details: ${new Date(selectedDate).toLocaleDateString()}`}
        description="Detailed list of paid transactions for this day"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {loadingDayDetails ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
          ) : selectedDayBills.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No transactions found for this date.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="px-4 py-2">Patient</th>
                    <th className="px-4 py-2 text-right">Consultation</th>
                    <th className="px-4 py-2 text-right">Vitals</th>
                    <th className="px-4 py-2 text-right">Lab</th>
                    <th className="px-4 py-2 text-right">Pharmacy</th>
                    <th className="px-4 py-2 text-right">Total Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedDayBills.map((bill: any) => (
                    <tr key={bill.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{bill.patient?.name}</div>
                        <div className="text-xs text-slate-400">{bill.patient?.patient_id}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">KSh {Number(bill.consultation_fee).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-600">KSh {Number(bill.vitals_total).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-600">KSh {Number(bill.investigation_total).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-600">KSh {Number(bill.medicine_total).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 underline decoration-slate-200 underline-offset-4">
                        KSh {Number(bill.grand_total).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="px-4 py-3">TOTALS</td>
                    <td className="px-4 py-3 text-right">KSh {selectedDayBills.reduce((acc, b) => acc + Number(b.consultation_fee), 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">KSh {selectedDayBills.reduce((acc, b) => acc + Number(b.vitals_total), 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">KSh {selectedDayBills.reduce((acc, b) => acc + Number(b.investigation_total), 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">KSh {selectedDayBills.reduce((acc, b) => acc + Number(b.medicine_total), 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-primary-600">
                      KSh {selectedDayBills.reduce((acc, b) => acc + Number(b.grand_total), 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({ title, value, subtext, icon, color }: any) {
  const colorClasses: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    pink: "bg-pink-50 text-pink-600",
    orange: "bg-orange-50 text-orange-600"
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>
        </div>
        <div className={`p-3 rounded-xl transition-colors ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, amount, total, color }: any) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-[10px] text-slate-400 font-medium">
        KSh {Number(amount).toLocaleString()} total recorded
      </div>
    </div>
  );
}
