"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, CheckCircle2, Clock, Loader2, FileText, Edit2, X, Search, ArrowLeft, AlertTriangle, ListChecks } from "lucide-react";
import { useInvestigations } from "@/hooks/useInvestigations";
import { useLabTests } from "@/hooks/useLabTests";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/Pagination";

type FormView = "table" | "request" | "result";

const emptyBulkInvestigationRow = { name: "", type: "lab", cost: "" };

export default function InvestigationsTab({
  patientId,
  onTotalChange,
  initialData = [],
  isVisitPaid = false,
  activeVisitId = null,
  onStartNewVisit
}: {
  patientId?: number;
  onTotalChange: (total: number) => void;
  initialData?: any[];
  isVisitPaid?: boolean;
  activeVisitId?: number | null;
  onStartNewVisit?: () => void;
}): React.JSX.Element {
  const { investigations, meta, isLoading, fetchInvestigations, addInvestigation, bulkAddInvestigations, updateInvestigation, setInvestigations } = useInvestigations(patientId, initialData, activeVisitId);
  const [currentPage, setCurrentPage] = useState(1);
  const { labTests, fetchLabTests, updateLabTest, deleteLabTest } = useLabTests();

  const [view, setView] = useState<FormView>("table");
  const [isEditLabTestModalOpen, setIsEditLabTestModalOpen] = useState(false);
  const [editingLabTest, setEditingLabTest] = useState<any>(null);
  const [selectedInvId, setSelectedInvId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [isBulkRequestModalOpen, setIsBulkRequestModalOpen] = useState(false);
  const [bulkInvestigationRows, setBulkInvestigationRows] = useState<any[]>([{ ...emptyBulkInvestigationRow }]);
  const [bulkInvestigationNotes, setBulkInvestigationNotes] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [labTestToDelete, setLabTestToDelete] = useState<any>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [requestForm, setRequestForm] = useState({
    name: "",
    type: "lab",
    notes: "",
    cost: "",
    diagnosis: ""
  });

  const totalCost = selectedTests.reduce((sum, test) => sum + (Number(test.default_cost) || 0), 0);

  useEffect(() => {
    if (!editingId && selectedTests.length > 0) {
      const names = selectedTests.map(t => t.name).join(", ");
      setRequestForm(prev => ({ ...prev, name: names, cost: totalCost.toString() }));
    } else if (!editingId && selectedTests.length === 0) {
      setRequestForm(prev => ({ ...prev, name: "", cost: "" }));
    }
  }, [selectedTests, editingId, totalCost]);

  const [newLabTestForm, setNewLabTestForm] = useState({
    name: "",
    type: "lab",
    default_cost: ""
  });

  const [resultForm, setResultForm] = useState({
    result: "",
    status: "completed"
  });

  useEffect(() => {
    fetchInvestigations({ page: currentPage });
    fetchLabTests();
  }, [fetchInvestigations, fetchLabTests, currentPage]);

  useEffect(() => {
    if (meta?.total !== undefined) {
      onTotalChange(meta.total);
    }
  }, [meta, onTotalChange]);

  const resetRequestForm = () => {
    setRequestForm({ name: "", type: "lab", notes: "", cost: "", diagnosis: "" });
    setSelectedTests([]);
    setSearchTerm("");
    setEditingId(null);
    setView("table");
  };

  const resetResultForm = () => {
    setResultForm({ result: "", status: "completed" });
    setSelectedInvId(null);
    setView("table");
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId && selectedTests.length === 0 && !requestForm.name) {
      toast.error("Please select at least one investigation");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateInvestigation(editingId, {
          name: requestForm.name,
          type: requestForm.type,
          notes: requestForm.notes,
          cost: requestForm.cost,
          diagnosis: requestForm.diagnosis
        });
        toast.success("Investigation updated successfully");
      } else {
        const testsToRequest = selectedTests.length > 0
          ? selectedTests
          : [{ name: requestForm.name, type: requestForm.type, cost: requestForm.cost }];

        const payload = testsToRequest.map(test => ({
          name: test.name,
          type: test.type,
          notes: requestForm.notes,
          cost: test.cost || test.default_cost || 0,
          diagnosis: requestForm.diagnosis
        }));

        if (payload.length > 1) {
          await bulkAddInvestigations(payload);
        } else {
          await addInvestigation(payload[0]);
        }
        toast.success(`${testsToRequest.length} investigation(s) requested successfully`);
      }
      resetRequestForm();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to request investigation";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectLabTest = (test: any) => {
    if (editingId) {
      setRequestForm({
        ...requestForm,
        name: test.name,
        type: test.type,
        cost: test.default_cost.toString()
      });
      setSearchTerm(test.name);
    } else {
      if (!selectedTests.find(t => t.id === test.id)) {
        setSelectedTests(prev => [...prev, test]);
      }
      setSearchTerm("");
    }
    setIsDropdownOpen(false);
  };

  const removeSelectedTest = (testId: number) => {
    setSelectedTests(prev => prev.filter(t => t.id !== testId));
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId) return;
    setIsSubmitting(true);

    try {
      await updateInvestigation(selectedInvId, resultForm);
      toast.success("Test result uploaded successfully");
      resetResultForm();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to upload result";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResultForm = (invId: number) => {
    setSelectedInvId(invId);
    setResultForm({ result: "", status: "completed" });
    setView("result");
  };

  const handleEditRequest = (test: any) => {
    setEditingId(test.id);
    setRequestForm({
      name: test.name || "",
      type: test.type || "lab",
      notes: test.notes || "",
      cost: test.cost || "",
      diagnosis: test.diagnosis || ""
    });
    setSearchTerm(test.name || "");
    setView("request");
  };

  const handleAddRequest = () => {
    setEditingId(null);
    setRequestForm({ name: "", type: "lab", notes: "", cost: "", diagnosis: "" });
    setSearchTerm("");
    setIsDropdownOpen(false);
    setView("request");
  };

  const resetBulkRequestForm = () => {
    setBulkInvestigationRows([{ ...emptyBulkInvestigationRow }]);
    setBulkInvestigationNotes("");
  };

  const handleOpenBulkRequest = () => {
    resetBulkRequestForm();
    setIsBulkRequestModalOpen(true);
  };

  const addBulkInvestigationRow = () => {
    setBulkInvestigationRows(prev => [...prev, { ...emptyBulkInvestigationRow }]);
  };

  const removeBulkInvestigationRow = (index: number) => {
    setBulkInvestigationRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const updateBulkInvestigationRow = (index: number, field: string, value: string) => {
    setBulkInvestigationRows(prev => prev.map((row, i) => {
      if (i !== index) return row;

      const next = { ...row, [field]: value };
      if (field === "name") {
        const match = labTests.find(test => test.name.toLowerCase() === value.trim().toLowerCase());
        if (match) {
          next.type = match.type || "lab";
          next.cost = match.default_cost !== null && match.default_cost !== undefined ? String(match.default_cost) : "";
        }
      }
      return next;
    }));
  };

  const bulkRowHasContent = (row: any) => row.name?.trim() || row.cost !== "";

  const handleBulkRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const filledRows = bulkInvestigationRows.filter(bulkRowHasContent);

    if (filledRows.length === 0) {
      toast.error("Please add at least one investigation");
      return;
    }

    if (filledRows.some(row => !row.name?.trim())) {
      toast.error("Investigation name is required for every row");
      return;
    }

    if (filledRows.some(row => row.cost !== "" && isNaN(parseFloat(row.cost)))) {
      toast.error("Please enter a valid test fee for every investigation");
      return;
    }

    const payload = filledRows.map(row => ({
      name: row.name.trim(),
      type: row.type || "lab",
      cost: row.cost !== "" ? parseFloat(row.cost) : 0,
      notes: bulkInvestigationNotes.trim() || null,
    }));

    setIsSubmitting(true);

    try {
      const created = await bulkAddInvestigations(payload);
      toast.success(`${created.length} investigation(s) requested successfully`);
      setIsBulkRequestModalOpen(false);
      resetBulkRequestForm();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to request investigations";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLabTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabTest) return;
    const data = {
      name: editingLabTest.name,
      type: editingLabTest.type,
      default_cost: parseFloat(editingLabTest.default_cost) || 0
    };
    const id = editingLabTest.id;
    setIsEditLabTestModalOpen(false);
    setEditingLabTest(null);
    try {
      await updateLabTest(id, data);
      toast.success("Investigation type updated in library");
    } catch (err: any) {
      // handled
    }
  };


  const handleDeleteLabTest = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLabTestToDelete({ id, name });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteLabTest = async () => {
    if (!labTestToDelete) return;

    // Close modal and provide immediate feedback
    const originalId = labTestToDelete.id;
    setIsDeleteConfirmOpen(false);
    setLabTestToDelete(null);
    toast.success("Investigation type removed from library");

    try {
      await deleteLabTest(originalId);
    } catch (err: any) {
      // Hook handles state restoration; API interceptor handles toast error
    }
  };

  const filteredLabTests = labTests.filter(test => {
    // During an edit, if the search term hasn't changed from the original selection, 
    // show all tests so the user can easily swap for a different one.
    if (editingId && searchTerm === requestForm.name && searchTerm !== "") {
      return true;
    }
    return test.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ── REQUEST / EDIT FORM ───────────────────────────────────────────────────────
  if (view === "request") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={resetRequestForm}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Investigations
          </button>
          <span className="text-slate-300">/</span>
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? "Edit Investigation Request" : "Request Investigation"}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-6 py-4 border-b border-slate-200">
            <p className="text-sm text-slate-600">
              {editingId ? "Update test request details." : "Add a new test request for this patient. You can select multiple tests at once."}
            </p>
          </div>

          <form onSubmit={handleRequestSubmit} className="p-6 space-y-6">
            {/* Investigation Name */}
            <div ref={searchDropdownRef} className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Investigation Name *</label>
                {selectedTests.length > 0 && !editingId && (
                  <span className="text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                    {selectedTests.length} selected
                  </span>
                )}
              </div>

              {/* Clean search input container */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  required={!editingId && selectedTests.length === 0}
                  type="text"
                  value={editingId ? (searchTerm || requestForm.name) : searchTerm}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchTerm(val);
                    if (editingId) setRequestForm({ ...requestForm, name: val });
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                  placeholder={
                    editingId
                      ? "Investigation name..."
                      : selectedTests.length > 0
                        ? "Search to add another test..."
                        : "Search or type investigation name... (Multi-select allowed)"
                  }
                  autoComplete="off"
                />

                {(searchTerm || (editingId && requestForm.name)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      if (editingId) setRequestForm({ ...requestForm, name: "" });
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    title="Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Dropdown list positioned right beneath the input */}
                {isDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white shadow-xl max-h-56 rounded-xl py-1 text-sm border border-slate-200 overflow-y-auto focus:outline-none ring-1 ring-black/5 divide-y divide-slate-100">
                    {filteredLabTests.length > 0 ? (
                      filteredLabTests.map((test) => {
                        const isAlreadySelected = selectedTests.some(t => t.id === test.id);
                        return (
                          <div
                            key={test.id}
                            className={`cursor-pointer select-none py-2 px-3 hover:bg-primary-50/60 transition-colors flex items-center justify-between group ${isAlreadySelected ? 'bg-primary-50/40 text-primary-700 font-medium' : 'text-slate-800'
                              }`}
                            onClick={() => selectLabTest(test)}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center justify-between">
                                <span className="truncate font-medium">{test.name}</span>
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                                  KSh {Number(test.default_cost || 0).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{test.type}</p>
                            </div>
                            {isAlreadySelected && (
                              <span className="text-[11px] font-semibold text-primary-600 bg-primary-100/70 px-1.5 py-0.5 rounded mr-1">
                                Added
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-3 px-4 text-slate-500 text-xs text-center">
                        No library matches for &quot;{searchTerm}&quot;. You can still type custom name.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Tests Chips Area - Clean, separate, beautiful below input */}
              {!editingId && selectedTests.length > 0 && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Selected Investigations ({selectedTests.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTests([])}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTests.map(test => (
                      <span
                        key={test.id}
                        className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-white text-primary-800 text-xs font-medium border border-primary-200 shadow-sm"
                      >
                        <span>{test.name}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                          KSh {Number(test.default_cost || 0).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSelectedTest(test.id)}
                          className="p-0.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-full transition-colors"
                          title="Remove test"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <select
                  value={selectedTests.length > 1 ? "multiple" : (selectedTests.length === 1 ? selectedTests[0].type : requestForm.type)}
                  onChange={e => setRequestForm({ ...requestForm, type: e.target.value })}
                  disabled={selectedTests.length > 0 || (!!editingId && searchTerm !== "")}
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${selectedTests.length > 0 || (!!editingId && searchTerm !== "") ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-dashed' : ''
                    }`}
                >
                  <option value="lab">Laboratory (Blood, Urine, etc.)</option>
                  <option value="radiology">Radiology (X-Ray, MRI, Ultrasound)</option>
                  <option value="procedure">Clinical Procedure</option>
                  {selectedTests.length > 1 && <option value="multiple">Determined dynamically</option>}
                </select>
              </div>

              {/* Test Fee */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Test Fee (KES)</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-500 sm:text-sm font-medium">KSh</span>
                  </div>
                  <input
                    type="number"
                    value={requestForm.cost}
                    onChange={e => setRequestForm({ ...requestForm, cost: e.target.value })}
                    className={`block w-full rounded-lg border border-slate-300 py-2 pl-12 pr-3 focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${(selectedTests.length > 0 || (editingId && searchTerm)) ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-dashed' : ''
                      }`}
                    placeholder="0.00"
                    readOnly={selectedTests.length > 0 || (!!editingId && searchTerm !== "")}
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Diagnosis / Clinical Indication
                {/* <span className="ml-1.5 text-xs font-normal text-slate-400">(Why is this test being ordered?)</span> */}
              </label>
              <input
                type="text"
                value={requestForm.diagnosis}
                onChange={e => setRequestForm({ ...requestForm, diagnosis: e.target.value })}
                placeholder="e.g. Suspected malaria, screening for diabetes, follow-up on hypertension..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* Clinical Notes (Reason) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Investigation</label>
              <textarea
                value={requestForm.notes}
                onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Why is this investigation being requested?..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetRequestForm}
                className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-5 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors active:scale-[0.98]"
              >
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {editingId ? "Saving..." : "Requesting..."}</>
                  : editingId ? "Save Changes" : "Request Test"
                }
              </button>
            </div>
          </form>
        </div>

        {/* Edit Lab Test Type Modal */}
        <Modal
          isOpen={isEditLabTestModalOpen}
          onClose={() => { setIsEditLabTestModalOpen(false); setEditingLabTest(null); }}
          title="Edit Investigation Type"
          description="Update master investigation details in the library"
        >
          {editingLabTest && (
            <form onSubmit={handleEditLabTestSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Investigation Name *</label>
                <input required type="text" value={editingLabTest.name} onChange={e => setEditingLabTest({ ...editingLabTest, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select value={editingLabTest.type} onChange={e => setEditingLabTest({ ...editingLabTest, type: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  <option value="lab">Laboratory (Blood, Urine, etc.)</option>
                  <option value="radiology">Radiology (X-Ray, MRI, Ultrasound)</option>
                  <option value="procedure">Clinical Procedure</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Price (KES) *</label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-500 sm:text-sm">KSh</span>
                  </div>
                  <input required type="number" value={editingLabTest.default_cost} onChange={e => setEditingLabTest({ ...editingLabTest, default_cost: e.target.value })} className="block w-full rounded-md border-slate-300 pl-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setIsEditLabTestModalOpen(false); setEditingLabTest(null); }} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    );
  }

  // ── UPLOAD RESULT FORM ────────────────────────────────────────────────────────
  if (view === "result") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={resetResultForm}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Investigations
          </button>
          <span className="text-slate-300">/</span>
          <h2 className="text-lg font-bold text-slate-900">Upload Test Results</h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
            <p className="text-sm text-slate-600">Enter diagnostic findings for this investigation.</p>
          </div>

          <form onSubmit={handleResultSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={resultForm.status}
                onChange={e => setResultForm({ ...resultForm, status: e.target.value })}
                className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Result Details *</label>
              <textarea
                required
                value={resultForm.result}
                onChange={e => setResultForm({ ...resultForm, result: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter findings, measurements, or diagnostic results..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetResultForm}
                className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-5 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors active:scale-[0.98]"
              >
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Results"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── TABLE VIEW ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {isVisitPaid && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900 leading-tight">Visit Closed (Fully Paid)</h3>
            <p className="text-xs text-amber-800 mt-1">
              This visit is already finalized or no active visit exists. To request tests, please <button
                onClick={onStartNewVisit}
                className="font-black underline decoration-amber-300 hover:text-amber-950 transition-colors"
              >Start a New Visit</button> first.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Investigations &amp; Labs</h2>
        <div className="flex items-center gap-2">
          {/* <button
            onClick={handleOpenBulkRequest}
            disabled={isVisitPaid}
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 h-9 px-4 border shadow-sm
              ${isVisitPaid
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50'
              }
            `}
          >
            <ListChecks className="mr-2 h-4 w-4" />
            Bulk Request
          </button> */}
          <button
            onClick={handleAddRequest}
            disabled={isVisitPaid}
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 h-9 px-4 shadow-sm
              ${isVisitPaid ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-primary-600 text-white hover:bg-primary-700'}
            `}
          >
            <Plus className="mr-2 h-4 w-4" />
            Request Test
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[200px]">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : investigations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No investigations recorded yet.</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {investigations.map((test) => (
              <li key={test.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 flex items-center justify-center rounded-full mt-1 ${test.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'}`}>
                      {test.status === 'completed'
                        ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                        : <Clock className="h-5 w-5 text-amber-600" />
                      }
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{test.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${test.type === 'radiology' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {test.type}
                        </span>
                        <p className="text-xs text-slate-500">Requested on {new Date(test.created_at).toLocaleDateString()}</p>
                      </div>
                      {test.diagnosis && (
                        <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <span className="font-semibold text-slate-700">Diagnosis:</span> {test.diagnosis}
                        </p>
                      )}
                      {test.cost && (
                        <p className="text-sm font-bold text-slate-900 mt-2">Test Fee: KSh {test.cost}</p>
                      )}
                      {test.status === 'completed' && test.result && (
                        <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700">
                          <span className="font-semibold block mb-1">Result:</span>
                          {test.result}
                        </div>
                      )}
                      {test.notes && !test.result && (
                        <p className="text-sm text-slate-500 italic mt-2"><span className="font-semibold text-slate-700">Reason:</span> {test.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm ml-auto sm:ml-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mb-2 ${test.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {test.status}
                    </span>
                    <div className="flex items-center justify-end gap-2 text-xs">
                      {test.status !== 'completed' && !(test.is_cleared || isVisitPaid || (activeVisitId && test.visit_id && test.visit_id !== activeVisitId)) && (
                        <>
                          <button
                            onClick={() => handleEditRequest(test)}
                            className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-md transition-colors"
                            title="Edit Test Request"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openResultForm(test.id)}
                            className="text-primary-600 hover:text-primary-700 font-medium bg-primary-50 px-3 py-1.5 rounded-md hover:bg-primary-100 transition-colors"
                          >
                            Upload Result
                          </button>
                        </>
                      )}
                      {(test.is_cleared || isVisitPaid || (activeVisitId && test.visit_id && test.visit_id !== activeVisitId)) && (
                        <div className="flex items-center text-slate-400 gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100" title="Locked by previous visit or payment">
                          <CheckCircle2 className="h-3 w-3 text-slate-400" />
                          <span className="font-medium">Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination
          meta={meta}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <Modal
        isOpen={isBulkRequestModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsBulkRequestModalOpen(false);
            resetBulkRequestForm();
          }
        }}
        title="Bulk Request Investigations"
        description="Add multiple investigation requests for this patient in one submission"
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleBulkRequestSubmit} className="space-y-4">
          <datalist id="bulk-investigation-options">
            {labTests.map(test => (
              <option key={test.id} value={test.name} />
            ))}
          </datalist>

          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3">
            {bulkInvestigationRows.map((row, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Investigation {index + 1}</h4>
                  {bulkInvestigationRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBulkInvestigationRow(index)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Remove investigation"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Investigation Name *</label>
                    <input
                      list="bulk-investigation-options"
                      type="text"
                      value={row.name}
                      onChange={e => updateBulkInvestigationRow(index, "name", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Search or type investigation name"
                      autoComplete="off"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                    <select
                      value={row.type}
                      onChange={e => updateBulkInvestigationRow(index, "type", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="lab">Laboratory</option>
                      <option value="radiology">Radiology</option>
                      <option value="procedure">Procedure</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fee (KES)</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                        <span className="text-slate-400 text-xs">KSh</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.cost}
                        onChange={e => updateBulkInvestigationRow(index, "cost", e.target.value)}
                        className="block w-full rounded-md border-slate-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addBulkInvestigationRow}
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Another Investigation
          </button>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinical Notes / Reason</label>
            <textarea
              value={bulkInvestigationNotes}
              onChange={e => setBulkInvestigationNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Shared reason or clinical indication for these investigations..."
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {bulkInvestigationRows.filter(bulkRowHasContent).length} investigation(s) ready
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsBulkRequestModalOpen(false);
                  resetBulkRequestForm();
                }}
                className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-5 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors active:scale-[0.98]"
              >
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Requesting...</>
                  : "Request Investigations"
                }
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditLabTestModalOpen}
        onClose={() => { setIsEditLabTestModalOpen(false); setEditingLabTest(null); }}
        title="Edit Investigation Type"
        description="Update master investigation details in the library"
      >
        {editingLabTest && (
          <form onSubmit={handleEditLabTestSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Investigation Name *</label>
              <input required type="text" value={editingLabTest.name} onChange={e => setEditingLabTest({ ...editingLabTest, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={editingLabTest.type} onChange={e => setEditingLabTest({ ...editingLabTest, type: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                <option value="lab">Laboratory (Blood, Urine, etc.)</option>
                <option value="radiology">Radiology (X-Ray, MRI, Ultrasound)</option>
                <option value="procedure">Clinical Procedure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Price (KES) *</label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-slate-500 sm:text-sm">KSh</span></div>
                <input required type="number" value={editingLabTest.default_cost} onChange={e => setEditingLabTest({ ...editingLabTest, default_cost: e.target.value })} className="block w-full rounded-md border-slate-300 pl-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => { setIsEditLabTestModalOpen(false); setEditingLabTest(null); }} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>
      {/* Lab Test Deletion Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteLabTest}
        title="Delete Investigation Type"
        message={`Are you sure you want to delete "${labTestToDelete?.name}" from the master library? Existing patient records will remain, but this test won't be available for new requests.`}
        confirmText="Delete"
        type="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}