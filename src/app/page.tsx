"use client";

import { useEffect, useState } from "react";
import { Users, Activity, NotepadText, TrendingUp, Calendar, Clock, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { dashboardAPI } from "@/lib/api";


interface DashboardData {
  stats: any[];
  attendance: { day: string; count: number }[];
  recentActivity: any[];
  user: { name: string };
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await dashboardAPI.get();
        setData(response);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome, {data.user.name}</h1>
          <p className="text-slate-500 mt-1">Here is what is happening at your clinic today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsLoading(true);
              const fetchDashboardData = async () => {
                try {
                  const response = await dashboardAPI.get();
                  setData(response);
                } catch (error) {
                  console.error("Failed to fetch dashboard data:", error);
                } finally {
                  setIsLoading(false);
                }
              };
              fetchDashboardData();
            }}
            title="Refresh Dashboard"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 h-10 px-4 py-2 shadow-sm"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </button>
          <Link
            href="/patients/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 py-2 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {data.stats.map((stat, i) => {
          const IconMap: { [key: string]: any } = { Users, Activity, NotepadText, TrendingUp };
          const Icon = IconMap[stat.icon] || Activity;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
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
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">New Patients (Last 7 Days)</h2>
            <select className="text-sm border-slate-200 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-72 w-full flex items-end justify-between px-4 pb-4">
            {data.attendance.map((day, i) => {
              const maxCount = Math.max(...data.attendance.map(d => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-2 group flex-1 max-w-[50px]">
                  <div className="relative w-full flex items-end justify-center h-48 bg-slate-50 rounded-t-lg">
                    <div 
                      className="w-8 bg-primary-500 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-primary-600" 
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.count}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{day.day}</span>
                </div>
              );
            })}
            {data.attendance.length === 0 && (
               <div className="h-full w-full bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
               <div className="text-center text-slate-400">
                 <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                 <p className="text-sm font-medium">No attendance data yet</p>
               </div>
             </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          </div>
          <div className="flex-1 overflow-y-auto w-full max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <ul className="space-y-6">
              {data.recentActivity.map((activity, i) => (
                <li key={activity.id} className="relative">
                  {i !== data.recentActivity.length - 1 && (
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
              {data.recentActivity.length === 0 && (
                <li className="text-center text-slate-400 py-8">
                   <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                   <p className="text-sm">No recent activity</p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
