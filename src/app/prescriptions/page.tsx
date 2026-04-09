"use client";

import { FileText, Loader2, Search, Calendar, User, Pill, Eye, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { prescriptionAPI } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import DirectPrescriptionModal from "@/components/prescriptions/DirectPrescriptionModal";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  // Modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [editPrescription, setEditPrescription] = useState<any>(null);

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

  const fetchPrescriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        'filter[search]': debouncedSearch,
        'page': currentPage,
      };
      const response = await prescriptionAPI.listGlobal(params);
      setPrescriptions(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error("Failed to fetch global prescriptions", err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const openViewModal = (rx: any) => {
    setSelectedPrescription(rx);
    setIsViewModalOpen(true);
  };

  const handleEdit = (rx: any) => {
    setEditPrescription(rx);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditPrescription(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Prescriptions</h1>
          <p className="text-slate-500 mt-1 text-sm">Global view of all medication prescriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search patient or medicine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 shadow-sm"
          >
             <Pill className="mr-2 h-4 w-4" />
             New Prescription
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 italic">
            No prescriptions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Medicines</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="text-sm font-medium text-slate-900">{rx.patient_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {rx.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center text-sm text-slate-700">
                            <Pill className="h-3.5 w-3.5 mr-2 text-primary-500" />
                            <span className="font-medium">{item.medicine}</span>
                            <span className="ml-2 text-slate-400 text-xs">{item.dosage}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rx.patient_id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                           In-patient
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                           Walk-in
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-40" />
                        {new Date(rx.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => openViewModal(rx)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!rx.patient_id && !rx.is_cleared && (
                           <button
                             onClick={() => handleEdit(rx)}
                             className="text-primary-600 hover:text-primary-800 transition-colors"
                             title="Edit Purchase"
                           >
                              <FileText className="h-4 w-4" />
                           </button>
                        )}
                        {rx.patient_id && (
                          <Link href={`/patients/${rx.patient_id}?tab=prescriptions`} className="text-primary-600 hover:text-primary-700 font-semibold">
                            History
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
        title="Prescription Details"
        maxWidth="max-w-xl"
      >
        {selectedPrescription && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <User className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{selectedPrescription.patient_name}</h4>
                <p className="text-sm text-slate-500 flex items-center mt-0.5">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {new Date(selectedPrescription.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-semibold text-slate-900 flex items-center">
                <Pill className="h-4 w-4 mr-2 text-primary-500" />
                Prescribed Medicines
              </h5>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {selectedPrescription.items.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900">{item.medicine}</span>
                      <span className="text-xs font-medium px-2 py-1 bg-primary-50 text-primary-700 rounded-full">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    {(item.dosage || item.frequency || item.duration) && (
                      <div className="mt-2 text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        {item.dosage && <span>Dosage: <span className="font-semibold text-slate-700">{item.dosage}</span></span>}
                        {item.frequency && <span>Frequency: <span className="font-semibold text-slate-700">{item.frequency}</span></span>}
                        {item.duration && <span>Duration: <span className="font-semibold text-slate-700">{item.duration} days</span></span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedPrescription.notes && (
              <div className="space-y-2">
                <h5 className="font-semibold text-slate-900">Clinical Notes</h5>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 italic">
                  "{selectedPrescription.notes}"
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      <DirectPrescriptionModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={fetchPrescriptions} 
        prescription={editPrescription}
      />
    </div>
  );
}
