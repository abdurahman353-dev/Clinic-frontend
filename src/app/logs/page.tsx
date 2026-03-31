"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  Terminal,
  FileText,
  CreditCard,
  UserCheck,
  Package,
  AlertCircle,
  Shield
} from "lucide-react";
import { activityLogAPI } from "@/lib/api";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const ACTION_ICONS: Record<string, any> = {
  'LOGIN': <Activity className="h-4 w-4 text-blue-600" />,
  'LOGOUT': <Activity className="h-4 w-4 text-slate-400" />,
  'CREATE_PATIENT': <UserCheck className="h-4 w-4 text-emerald-600" />,
  'UPDATE_PATIENT': <User className="h-4 w-4 text-blue-600" />,
  'ADMIN_CREATED': <ShieldCheck className="h-4 w-4 text-purple-600" />,
  'ADMIN_STATUS_TOGGLED': <AlertCircle className="h-4 w-4 text-amber-600" />,
  'INVESTIGATION_REQUESTED': <FileText className="h-4 w-4 text-indigo-600" />,
  'PAYMENT_RECORDED': <CreditCard className="h-4 w-4 text-emerald-500" />,
  'STOCK_ADDED': <Package className="h-4 w-4 text-amber-500" />,
};

import { ShieldCheck } from "lucide-react";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    from_date: "",
    to_date: "",
    page: 1
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await activityLogAPI.getLogs(filters);
      setLogs(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total
      });
    } catch (error) {
      toast.error("Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters.page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchLogs();
  };

  return (
    <>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">System Activity Audit</h1>
          <p className="text-slate-500 mt-1">Real-time audit trail of all sensitive playground operations</p>
        </div>

        {/* Professional Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">Action</span>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full pl-16 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 outline-none text-sm font-medium"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Auth: Logins</option>
                <option value="PATIENT">Clinic: Patients</option>
                <option value="ADMIN">System: Admin Changes</option>
                <option value="PAYMENT">Finance: Payments</option>
              </select>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">From</span>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                className="w-full pl-14 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 outline-none text-sm font-medium"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">To</span>
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 outline-none text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg text-sm px-4 py-2 transition-all flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </button>
          </form>
        </div>

        {/* Logs Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-6 py-4 flex items-center justify-between shadow-sm border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <ClipboardList className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <span className="text-slate-900 font-bold text-sm tracking-tight block">Activity Audit Feed</span>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Real-time system monitoring</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-slate-600 text-[10px] font-bold uppercase tracking-tighter">Live Audit Active</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-slate-500 mt-4 font-medium">Synchronizing audit data...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-20 text-center">
                <ClipboardList className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No activity logs found for the selected period.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-5 hover:bg-slate-50 transition-all group border-l-4 border-transparent hover:border-primary-500">
                  <div className="flex items-start gap-5">
                    <div className="mt-1">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        {ACTION_ICONS[log.action] || <Activity className="h-5 w-5 text-slate-400" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-[13px] tracking-tight uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{log.action.replace(/_/g, ' ')}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-sm font-bold text-slate-700">{log.user?.name || 'System Auto'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold bg-white border border-slate-100 px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                          <Clock className="h-3 w-3 text-primary-500" />
                          {format(new Date(log.created_at), 'MMM dd, yyyy · HH:mm:ss')}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium mb-3 pr-8">{log.description}</p>
                      <div className="flex items-center gap-6 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          <Shield className="h-3 w-3 text-slate-300" />
                          IP: <span className="text-slate-500 font-bold">{log.ip_address}</span>
                        </span>
                        <span className="hidden md:flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate max-w-sm" title={log.user_agent}>
                          <Terminal className="h-3 w-3 text-slate-300" />
                          UA: <span className="text-slate-500">{log.user_agent}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold">{logs.length}</span> of <span className="font-bold">{pagination.total}</span> audit records
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => setFilters({ ...filters, page: pagination.current_page - 1 })}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-600 px-2">Page {pagination.current_page} of {pagination.last_page}</span>
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => setFilters({ ...filters, page: pagination.current_page + 1 })}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
