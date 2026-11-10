"use client";

import { FileSearch, Loader2, Search, Calendar, User, Microscope, Eye, Plus, X, Edit2, Trash2, ListPlus, FlaskConical, Stethoscope } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { investigationAPI } from "@/lib/api";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useLabTests } from "@/hooks/useLabTests";
import { toast } from "sonner";

export default function InvestigationsPage() {
  const [activeView, setActiveView] = useState<"patient_tests" | "library">("patient_tests");

  // Patient Investigations state
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  // Master Lab Tests state from hook
  const { labTests, isLoadingLabTests, fetchLabTests, updateLabTest, bulkAddLabTests, deleteLabTest } = useLabTests();
  const [librarySearch, setLibrarySearch] = useState("");

  // Bulk New Lab Tests state requested by user
  const [bulkNewLabTests, setBulkNewLabTests] = useState<any[]>([{ name: "", type: "lab", default_cost: "" }]);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  // Edit / Delete Lab Test state
  const [editingLabTest, setEditingLabTest] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [labTestToDelete, setLabTestToDelete] = useState<any>(null);

  // Patient Investigation View modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvestigation, setSelectedInvestigation] = useState<any>(null);

  // Debounce search query for patient investigations
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
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

  useEffect(() => {
    fetchLabTests();
  }, [fetchLabTests]);

  const openViewModal = (inv: any) => {
    setSelectedInvestigation(inv);
    setIsViewModalOpen(true);
  };

  // Bulk Lab Test handlers
  const addBulkRow = () => {
    setBulkNewLabTests(prev => [...prev, { name: "", type: "lab", default_cost: "" }]);
  };

  const removeBulkRow = (index: number) => {
    setBulkNewLabTests(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const updateBulkRow = (index: number, field: string, value: string) => {
    setBulkNewLabTests(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleNewLabTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validTests = bulkNewLabTests.filter((t: any) => t.name?.trim() !== "");
    if (validTests.length === 0) {
      toast.error("Please add at least one investigation name");
      return;
    }

    // Client-side duplicate check within the batch
    const names = validTests.map((t: any) => t.name.trim().toLowerCase());
    const seen = new Set<string>();
    for (const name of names) {
      if (seen.has(name)) {
        toast.error(`Duplicate name in your list: "${name}". Each investigation name must be unique.`);
        return;
      }
      seen.add(name);
    }

    setIsSubmittingBulk(true);
    try {
      await bulkAddLabTests(validTests.map((test: any) => ({
        name: test.name.trim(),
        type: test.type || "lab",
        default_cost: parseFloat(test.default_cost) || 0
      })));
      toast.success(`${validTests.length} investigation type(s) registered successfully! They are now available on the patient investigations tab.`);
      setBulkNewLabTests([{ name: "", type: "lab", default_cost: "" }]);
      setIsBulkAddModalOpen(false);
      fetchLabTests();
    } catch (error: any) {
      // The global API interceptor already shows a toast — only show here if it has extra context
      const serverMsg = error?.response?.data?.message;
      if (serverMsg && (serverMsg.includes("already exists") || serverMsg.includes("duplicate"))) {
        toast.error(serverMsg);
      } else if (!error?.response) {
        // Network/timeout error not caught by interceptor
        toast.error(error.message || "Failed to register investigation types");
      }
      // For 422/500 with server messages, the interceptor already toasted
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Edit Lab Test handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabTest) return;
    try {
      await updateLabTest(editingLabTest.id, {
        name: editingLabTest.name.trim(),
        type: editingLabTest.type,
        default_cost: parseFloat(editingLabTest.default_cost) || 0
      });
      toast.success("Investigation type updated successfully");
      setIsEditModalOpen(false);
      setEditingLabTest(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update investigation");
    }
  };

  const confirmDelete = async () => {
    if (!labTestToDelete) return;
    setIsDeleteConfirmOpen(false);
    setLabTestToDelete(null);
    try {
      await deleteLabTest(labTestToDelete.id);
      toast.success(`"${labTestToDelete.name}" removed from library`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete investigation");
    }
  };

  // Library pagination
  const [libraryPage, setLibraryPage] = useState(1);
  const LIBRARY_PER_PAGE = 15;

  // Filter master tests by search
  const filteredLibrary = labTests.filter((test: any) => {
    if (!librarySearch.trim()) return true;
    const term = librarySearch.toLowerCase();
    return test.name?.toLowerCase().includes(term) || test.type?.toLowerCase().includes(term);
  });

  // Reset library page when search changes
  useEffect(() => {
    setLibraryPage(1);
  }, [librarySearch]);

  const paginatedLibrary = filteredLibrary.slice(
    (libraryPage - 1) * LIBRARY_PER_PAGE,
    libraryPage * LIBRARY_PER_PAGE
  );

  const libraryMeta = filteredLibrary.length > 0
    ? {
        total: filteredLibrary.length,
        per_page: LIBRARY_PER_PAGE,
        current_page: libraryPage,
        last_page: Math.ceil(filteredLibrary.length / LIBRARY_PER_PAGE),
      }
    : null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Investigations</h1>
          <p className="text-slate-500 mt-1">Manage patient test records and the clinic's master investigation catalog.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 h-10 px-4 shadow-sm bg-primary-600 text-white hover:bg-primary-700 active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" />
            Bulk Add Test Types
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveView("patient_tests")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeView === "patient_tests"
                ? "border-primary-600 text-primary-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Microscope className="h-4 w-4" />
            Patient Test Requests
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {meta?.total ?? investigations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView("library")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeView === "library"
                ? "border-primary-600 text-primary-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            Master Test Library &amp; Pricing
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
              {labTests.length}
            </span>
          </button>
        </nav>
      </div>

      {/* VIEW 1: PATIENT INVESTIGATIONS */}
      {activeView === "patient_tests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search patient, test or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm"
              />
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Investigation</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {investigations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 text-slate-600 font-bold text-xs">
                              <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <div className="text-sm font-medium text-slate-900">{inv.patient_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Microscope className="h-3.5 w-3.5 mr-2 text-purple-500" />
                            <span className="text-sm text-slate-900 font-medium">{inv.name}</span>
                            <span className="ml-2 text-xs text-slate-400 capitalize">({inv.type})</span>
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
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openViewModal(inv)}
                              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                              title="View Record"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {inv.patient_id && (
                              <Link
                                href={`/patients/${inv.patient_id}?tab=investigations`}
                                className="text-primary-600 hover:text-primary-700 font-semibold text-xs bg-primary-50 px-2.5 py-1 rounded-md"
                              >
                                View Results
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

            <Pagination
              meta={meta}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* VIEW 2: MASTER TEST LIBRARY */}
      {activeView === "library" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search master library by name or category..."
                value={librarySearch}
                onChange={(e) => { setLibrarySearch(e.target.value); }}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing <strong>{filteredLibrary.length}</strong> available test types
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {isLoadingLabTests ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
              </div>
            ) : filteredLibrary.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <FlaskConical className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-slate-700">No test types in catalog</p>
                <p className="text-xs text-slate-400 mt-1">Click "Bulk Add Test Types" to register tests to the master library.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Test Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Standard Fee</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {paginatedLibrary.map((test: any) => (
                      <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 text-sm">
                          {test.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                            test.type === 'radiology' ? 'bg-purple-100 text-purple-800' : test.type === 'procedure' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {test.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                          KSh {Number(test.default_cost || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingLabTest({ ...test });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Edit test"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setLabTestToDelete(test);
                                setIsDeleteConfirmOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete test"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Library Pagination */}
          <Pagination
            meta={libraryMeta}
            onPageChange={(page) => setLibraryPage(page)}
          />
        </div>
      )}

      {/* BULK ADD TEST TYPES MODAL */}
      <Modal
        isOpen={isBulkAddModalOpen}
        onClose={() => !isSubmittingBulk && setIsBulkAddModalOpen(false)}
        title="Register Master Investigation Types"
        description="Add multiple investigation types to the master catalog. These will immediately appear in the dropdown on the patient Investigations tab."
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleNewLabTestSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-slate-600 text-xs font-bold uppercase tracking-wider bg-slate-50">
                  <th className="px-3 py-2 border-b border-slate-200">Investigation Name *</th>
                  <th className="px-3 py-2 border-b border-slate-200 w-44">Category</th>
                  <th className="px-3 py-2 border-b border-slate-200 w-36">Price (KES) *</th>
                  <th className="px-3 py-2 border-b border-slate-200 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bulkNewLabTests.map((row: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-2 py-2">
                      <input
                        required
                        type="text"
                        value={row.name}
                        onChange={e => updateBulkRow(index, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="e.g. Full Blood Count, Thyroid Profile"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={row.type}
                        onChange={e => updateBulkRow(index, 'type', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="lab">Laboratory</option>
                        <option value="radiology">Radiology</option>
                        <option value="procedure">Procedure</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                          <span className="text-slate-400 text-xs">KSh</span>
                        </div>
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.default_cost}
                          onChange={e => updateBulkRow(index, 'default_cost', e.target.value)}
                          className="block w-full rounded-md border-slate-300 pl-8 focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-1.5"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      {bulkNewLabTests.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBulkRow(index)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={addBulkRow}
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Another Row
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBulkAddModalOpen(false)}
              disabled={isSubmittingBulk}
              className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingBulk}
              className="inline-flex items-center px-5 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmittingBulk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Save & Register All"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingLabTest(null); }}
        title="Edit Investigation Type"
        description="Update master investigation details in the library"
      >
        {editingLabTest && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Investigation Name *</label>
              <input
                required
                type="text"
                value={editingLabTest.name}
                onChange={e => setEditingLabTest({ ...editingLabTest, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={editingLabTest.type}
                onChange={e => setEditingLabTest({ ...editingLabTest, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="lab">Laboratory (Blood, Urine, etc.)</option>
                <option value="radiology">Radiology (X-Ray, Ultrasound, CT)</option>
                <option value="procedure">Clinical Procedure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Price (KES) *</label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-500 sm:text-sm">KSh</span>
                </div>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingLabTest.default_cost}
                  onChange={e => setEditingLabTest({ ...editingLabTest, default_cost: e.target.value })}
                  className="block w-full rounded-md border-slate-300 pl-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsEditModalOpen(false); setEditingLabTest(null); }}
                className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => { setIsDeleteConfirmOpen(false); setLabTestToDelete(null); }}
        onConfirm={confirmDelete}
        title="Remove Investigation Type"
        message={`Are you sure you want to remove "${labTestToDelete?.name}" from the master library? Existing patient records will not be affected.`}
      />

      {/* VIEW PATIENT INVESTIGATION MODAL */}
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
                  <p className="text-sm font-bold text-slate-900 mt-1 uppercase">{selectedInvestigation.type || 'Lab'}</p>
               </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-slate-900 flex items-center px-1">
                <FileSearch className="h-4 w-4 mr-2 text-primary-500" />
                Results &amp; Outcome
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