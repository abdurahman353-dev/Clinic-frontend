"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, MoreHorizontal, Filter, Loader2, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { patientAPI } from "@/lib/api";

interface Patient {
  id: string; // the physical db ID or patient_id string
  db_id: number;
  name: string;
  id_number: string;
  age: number | null;
  gender: string;
  phone: string;
  patient_type: string;
  created_at: string;
}

export default function PatientsList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const params: any = {
        'filter[search]': debouncedSearch,
        'page[number]': 1,
      };
      if (genderFilter) params['filter[gender]'] = genderFilter;
      if (typeFilter) params['filter[patient_type]'] = typeFilter;
      
      const data = await patientAPI.list(params);
      setPatients(data.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, genderFilter, typeFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h1>
          <p className="text-slate-500 mt-1">Manage patient records and histories</p>
        </div>
        <Link 
          href="/patients/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 py-2 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, phone or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
              />
            </div>
            
            <select 
              value={genderFilter} 
              onChange={(e) => setGenderFilter(e.target.value)}
              className="text-sm border-slate-300 rounded-md shadow-sm h-9"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border-slate-300 rounded-md shadow-sm h-9"
            >
              <option value="">All Types</option>
              <option value="outpatient">Outpatient</option>
              <option value="inpatient">Inpatient</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center py-24">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center py-24 text-slate-500 text-sm">
              No patients found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient Info</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                          {patient.name.split(' ').map((n, i) => i < 2 ? n[0] : '').join('')}
                        </div>
                        <div className="ml-4">
                          <Link href={`/patients/${patient.db_id}`} className="text-sm font-medium text-slate-900 hover:text-primary-600">
                            {patient.name}
                          </Link>
                          <div className="text-sm text-slate-500">{patient.id} &bull; {patient.age || '?'} yrs, {patient.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{patient.id_number || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        patient.patient_type === 'inpatient' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {patient.patient_type || 'outpatient'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(patient.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === patient.db_id ? null : patient.db_id)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      
                      {openMenuId === patient.db_id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-6 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              <Link 
                                href={`/patients/${patient.db_id}`}
                                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                role="menuitem"
                              >
                                <Eye className="mr-3 h-4 w-4 text-slate-400" />
                                View Profile
                              </Link>
                              <Link 
                                href={`/patients/${patient.db_id}/edit`}
                                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                role="menuitem"
                              >
                                <Edit className="mr-3 h-4 w-4 text-slate-400" />
                                Edit Patient
                              </Link>
                              <button
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                role="menuitem"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this patient?")) {
                                    // Handle delete
                                  }
                                  setOpenMenuId(null);
                                }}
                              >
                                <Trash2 className="mr-3 h-4 w-4 text-red-400" />
                                Delete Patient
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination placeholder */}
        <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
          <div className="hidden sm:block text-sm text-slate-700">
            Showing <span className="font-medium">{patients.length}</span> results
          </div>
        </div>
      </div>
    </div>
  );
}
