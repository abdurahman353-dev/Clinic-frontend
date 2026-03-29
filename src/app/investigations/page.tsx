"use client";

import { FileSearch, Loader2, Search, Calendar, User, Microscope, Plus, Eye } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { investigationAPI, labTestAPI } from "@/lib/api";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [selectedInvestigation, setSelectedInvestigation] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    patient_name: "",
    name: "",
    type: "",
    cost: 0,
    notes: "",
    result: "",
    status: "pending"
  });

  const fetchInvestigations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await investigationAPI.listGlobal();
      setInvestigations(response.data || []);
    } catch (err) {
      console.error("Failed to fetch global investigations", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLabTests = async () => {
    try {
      const response = await labTestAPI.list();
      setLabTests(response.data || []);
    } catch (err) {
      console.error("Failed to fetch lab tests", err);
    }
  };

  useEffect(() => {
    fetchInvestigations();
    fetchLabTests();
  }, [fetchInvestigations]);

  const handleTestChange = (testId: string) => {
    const test = labTests.find(t => t.id.toString() === testId);
    if (test) {
      setFormData({
        ...formData,
        name: test.name,
        type: test.type || "Lab",
        cost: test.cost || 0
      });
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedInvestigation(null);
    setFormData({
      patient_name: "",
      name: "",
      type: "",
      cost: 0,
      notes: "",
      result: "",
      status: "pending"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (inv: any) => {
    setIsEditing(true);
    setSelectedInvestigation(inv);
    setFormData({
      patient_name: inv.patient_name || "",
      name: inv.name || "",
      type: inv.type || "",
      cost: inv.cost || 0,
      notes: inv.notes || "",
      result: inv.result || "",
      status: inv.status || "pending"
    });
    setIsModalOpen(true);
  };

  const openViewModal = (inv: any) => {
    setSelectedInvestigation(inv);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_name || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && selectedInvestigation) {
        await investigationAPI.updateStandalone(selectedInvestigation.id, formData);
        toast.success("Investigation updated successfully");
      } else {
        await investigationAPI.storeStandalone(formData);
        toast.success("Investigation added successfully");
      }
      setIsModalOpen(false);
      fetchInvestigations();
    } catch (err) {
      console.error("Failed to save investigation", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInvestigations = investigations.filter(inv => 
    inv.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <button 
                onClick={openAddModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Investigation
            </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : filteredInvestigations.length === 0 ? (
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
                {filteredInvestigations.map((inv) => (
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
                        {!inv.patient_id && (
                          <button 
                            onClick={() => openEditModal(inv)}
                            className="text-primary-600 hover:text-primary-700 font-semibold"
                          >
                            Edit
                          </button>
                        )}
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
      </div>

      {/* Modal for adding/editing standalone investigation */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditing ? "Edit Standalone Investigation" : "Add Standalone Investigation"}
        description={isEditing ? "Update test details or enter results." : "Order a laboratory test for a walk-in patient. This will generate an invoice."}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name *</label>
            <input
              type="text"
              required
              placeholder="Enter full name"
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Investigation *</label>
            <select
              required
              value={labTests.find(t => t.name === formData.name)?.id || ""}
              onChange={(e) => handleTestChange(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
            >
              <option value="">Select a test</option>
              {labTests.map((test) => (
                <option key={test.id} value={test.id}>{test.name} (${test.cost})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center">
                <FileSearch className="h-4 w-4 mr-2 text-primary-500" />
                Test Outcome
              </h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Results</label>
                <textarea
                  rows={4}
                  placeholder="Enter lab results here..."
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditing ? "Update Record" : "Save Investigation")}
            </button>
          </div>
        </form>
      </Modal>

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
              <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl min-h-[120px] font-mono text-sm leading-relaxed">
                {selectedInvestigation.result ? (
                  <div className="whitespace-pre-wrap">{selectedInvestigation.result}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 italic">
                    <Loader2 className="h-5 w-5 mb-2 opacity-20" />
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
