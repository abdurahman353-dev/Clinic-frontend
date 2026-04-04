"use client";

import { FileSearch, Loader2, Search, Calendar, User, Microscope, Eye } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { investigationAPI } from "@/lib/api";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  
  // Modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvestigation, setSelectedInvestigation] = useState<any>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchInvestigations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        'filter[search]': debouncedSearch,
        'page': currentPage,
      };
      const response = await investigationAPI.listGlobal(params);
      setInvestigations(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error("Failed to fetch global investigations", err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    fetchInvestigations();
  }, [fetchInvestigations]);

  const openViewModal = (inv: any) => {
    setSelectedInvestigation(inv);
    setIsViewModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Investigations</h1>
          <p className="text-slate-500 mt-1">Global view of all lab and radiology tests.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
                type="text"
                placeholder="Search patient, test or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : investigations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 italic">
            No investigations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Investigation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {investigations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="text-sm font-medium text-slate-900">{inv.patient_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                         <Microscope className="h-3.5 w-3.5 mr-2 text-purple-500" />
                         <span className="text-sm text-slate-900 font-medium">{inv.name}</span>
                         <span className="ml-2 text-xs text-slate-400">({inv.type})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      } capitalize`}>
                        {inv.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-40" />
                        {new Date(inv.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-4">
                        <button 
                          onClick={() => openViewModal(inv)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {inv.patient_id && (
                          <Link href={`/patients/${inv.patient_id}?tab=investigations`} className="text-primary-600 hover:text-primary-700 font-semibold">
                            Results
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          meta={meta}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Investigation Record"
        maxWidth="max-w-xl"
      >
        {selectedInvestigation && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
               <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                 <User className="h-6 w-6 text-primary-500" />
               </div>
               <div>
                 <h4 className="font-bold text-slate-900 text-lg">{selectedInvestigation.patient_name}</h4>
                 <p className="text-sm text-slate-500 flex items-center mt-0.5">
                   <Calendar className="h-3.5 w-3.5 mr-1.5" />
                   {new Date(selectedInvestigation.created_at).toLocaleString()}
                 </p>
               </div>
               <div className="ml-auto">
                 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                   selectedInvestigation.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                 } uppercase tracking-wider`}>
                   {selectedInvestigation.status || 'Pending'}
                 </span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Test Name</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedInvestigation.name}</p>
               </div>
               <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Category</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedInvestigation.type || 'Lab'}</p>
               </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-slate-900 flex items-center px-1">
                <FileSearch className="h-4 w-4 mr-2 text-primary-500" />
                Results & Outcome
              </h5>
              <div className="p-5 bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 min-h-[120px] font-mono text-sm leading-relaxed">
                {selectedInvestigation.result ? (
                  <div className="whitespace-pre-wrap">{selectedInvestigation.result}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 italic">
                    <Loader2 className="h-5 w-5 mb-2 opacity-50" />
                    Pending lab processing...
                  </div>
                )}
              </div>
            </div>

            {selectedInvestigation.notes && (
              <div className="space-y-2">
                <h5 className="font-semibold text-slate-900">Clinical Notes</h5>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 italic font-medium">
                  "{selectedInvestigation.notes}"
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
