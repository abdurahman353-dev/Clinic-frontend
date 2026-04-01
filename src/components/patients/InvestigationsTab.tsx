"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle2, Clock, Loader2, FileText, Edit2, X, Search, Trash2 } from "lucide-react";
import { useInvestigations } from "@/hooks/useInvestigations";
import { useLabTests } from "@/hooks/useLabTests";
import { labTestAPI } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

export default function InvestigationsTab({
  patientId,
  initialData,
  onDataChange,
  isInitialLoaded,
  onLoadComplete
}: {
  patientId?: number;
  initialData: any[];
  onDataChange: (data: any[]) => void;
  isInitialLoaded: boolean;
  onLoadComplete: () => void;
}): React.JSX.Element {
  const { investigations, isLoading, fetchInvestigations, addInvestigation, updateInvestigation, setInvestigations } = useInvestigations(patientId);
  const { labTests, isLoadingLabTests, fetchLabTests, addLabTest, updateLabTest, bulkAddLabTests, deleteLabTest } = useLabTests();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isNewLabTestModalOpen, setIsNewLabTestModalOpen] = useState(false);
  const [isEditLabTestModalOpen, setIsEditLabTestModalOpen] = useState(false);
  const [editingLabTest, setEditingLabTest] = useState<any>(null);
  const [selectedInvId, setSelectedInvId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [bulkNewLabTests, setBulkNewLabTests] = useState<any[]>([{ name: "", type: "lab", default_cost: "" }]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [labTestToDelete, setLabTestToDelete] = useState<any>(null);

  const [requestForm, setRequestForm] = useState({
    name: "",
    type: "lab",
    notes: "",
    cost: ""
  });

  const totalCost = selectedTests.reduce((sum, test) => sum + (Number(test.default_cost) || 0), 0);
  
  // Sync requestForm name with selected tests for comma-separated display if not editing
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
    if (!isInitialLoaded) {
      Promise.all([fetchInvestigations(), fetchLabTests()]).then(() => onLoadComplete());
    } else {
      fetchLabTests();
    }
  }, [fetchInvestigations, fetchLabTests, isInitialLoaded, onLoadComplete]);

  // Sync internal investigations with lifted state
  useEffect(() => {
    if (isInitialLoaded && investigations.length === 0 && initialData.length > 0) {
      setInvestigations(initialData);
    }
  }, [initialData, isInitialLoaded, setInvestigations, investigations.length]);

  // Update lifted state when internal investigations change
  useEffect(() => {
    if (investigations.length > 0) {
      onDataChange(investigations);
    }
  }, [investigations, onDataChange]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate: if not editing, must have at least one test selected
    if (!editingId && selectedTests.length === 0 && !requestForm.name) {
      toast.error("Please select at least one investigation");
      return;
    }

    setIsSubmitting(true);

    const commonNotes = requestForm.notes;

    // Optimistic Closure
    setIsRequestModalOpen(false);
    const originalSelectedTests = [...selectedTests];
    const originalRequestForm = { ...requestForm };
    
    // Clear state
    setSelectedTests([]);
    setRequestForm({ name: "", type: "lab", notes: "", cost: "" });
    setSearchTerm("");

    try {
      if (editingId) {
        // Edit single request
        await updateInvestigation(editingId, {
          name: originalRequestForm.name,
          type: originalRequestForm.type,
          notes: originalRequestForm.notes,
          cost: originalRequestForm.cost
        });
        toast.success("Investigation updated successfully");
      } else {
        // Bulk Add
        const testsToRequest = selectedTests.length > 0 
          ? selectedTests 
          : [{ name: originalRequestForm.name, type: originalRequestForm.type, cost: originalRequestForm.cost }];

        await Promise.all(testsToRequest.map(test => 
          addInvestigation({
            name: test.name,
            type: test.type,
            notes: commonNotes,
            cost: test.cost || test.default_cost
          })
        ));
        toast.success(`${testsToRequest.length} investigation(s) requested successfully`);
      }
    } catch (err: any) {
      // Error handled by api.js
    } finally {
      setIsSubmitting(false);
      setEditingId(null);
    }
  };

  const selectLabTest = (test: any) => {
    if (editingId) {
      // When editing, we just update the form
      setRequestForm({
        ...requestForm,
        name: test.name,
        type: test.type,
        cost: test.default_cost.toString()
      });
      setSearchTerm(test.name);
    } else {
      // When adding new, we add to bulk selection
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

    // Optimistic Closure
    setIsResultModalOpen(false);
    setSelectedInvId(null);
    const originalResult = { ...resultForm };
    setResultForm({ result: "", status: "completed" });

    try {
      await updateInvestigation(selectedInvId, originalResult);
      toast.success("Test result uploaded successfully");
    } catch (err: any) {
      // toast.error is handled by api.js interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResultModal = (invId: number) => {
    setSelectedInvId(invId);
    setResultForm({ result: "", status: "completed" });
    setIsResultModalOpen(true);
  };

  const handleEditRequest = (test: any) => {
    setEditingId(test.id);
    setRequestForm({
      name: test.name || "",
      type: test.type || "lab",
      notes: test.notes || "",
      cost: test.cost || ""
    });
    setIsRequestModalOpen(true);
  };

  const handleAddRequest = () => {
    setEditingId(null);
    setRequestForm({ name: "", type: "lab", notes: "", cost: "" });
    setSearchTerm("");
    setIsDropdownOpen(false);
    setIsRequestModalOpen(true);
  };

  const handleNewLabTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validTests = bulkNewLabTests.filter(t => t.name.trim() !== "");
    if (validTests.length === 0) {
      toast.error("Please add at least one investigation name");
      return;
    }

    setIsSubmitting(true);
    try {
      await bulkAddLabTests(validTests.map(test => ({
        name: test.name,
        type: test.type,
        default_cost: parseFloat(test.default_cost) || 0
      })));
      
      toast.success(`${validTests.length} investigation types registered`);
      setIsNewLabTestModalOpen(false);
      setBulkNewLabTests([{ name: "", type: "lab", default_cost: "" }]);
    } catch (error: any) {
      // Error toast is handled by interceptor or hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const addBulkRow = () => {
    setBulkNewLabTests([...bulkNewLabTests, { name: "", type: "lab", default_cost: "" }]);
  };

  const removeBulkRow = (index: number) => {
    if (bulkNewLabTests.length > 1) {
      const newRows = [...bulkNewLabTests];
      newRows.splice(index, 1);
      setBulkNewLabTests(newRows);
    }
  };

  const updateBulkRow = (index: number, field: string, value: string) => {
    const newRows = [...bulkNewLabTests];
    newRows[index] = { ...newRows[index], [field]: value };
    setBulkNewLabTests(newRows);
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

    // Close modal and reset immediately
    setIsEditLabTestModalOpen(false);
    setEditingLabTest(null);

    // Update current form if it matches
    if (requestForm.name === data.name || searchTerm === data.name) {
      setRequestForm(prev => ({ ...prev, name: data.name, type: data.type, cost: data.default_cost.toString() }));
      setSearchTerm(data.name);
    }

    try {
      await updateLabTest(id, data);
      toast.success("Investigation type updated in library");
    } catch (err: any) {
      // Error handled by api.js
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

  const filteredLabTests = labTests.filter(test => 
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Investigations & Labs</h2>
        <button
          onClick={handleAddRequest}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-9 px-4 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Request Test
        </button>
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
                      {test.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{test.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${test.type === 'radiology' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                          {test.type}
                        </span>
                        <p className="text-xs text-slate-500">Requested on {new Date(test.created_at).toLocaleDateString()}</p>
                      </div>

                      {test.cost && (
                        <p className="text-sm font-bold text-slate-900 mt-2">
                          Test Fee: KSh {test.cost}
                        </p>
                      )}

                      {test.status === 'completed' && test.result && (
                        <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700">
                          <span className="font-semibold block mb-1">Result:</span>
                          {test.result}
                        </div>
                      )}
                      {test.notes && !test.result && (
                        <p className="text-sm text-slate-500 italic mt-2">Notes: {test.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm ml-auto sm:ml-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mb-2 ${test.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                      {test.status}
                    </span>
                    <div className="flex items-center justify-end gap-2 text-xs">
                      {test.status !== 'completed' && !test.is_cleared && (
                        <>
                          <button
                            onClick={() => handleEditRequest(test)}
                            className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-md transition-colors"
                            title="Edit Test Request"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openResultModal(test.id)}
                            className="text-primary-600 hover:text-primary-700 font-medium bg-primary-50 px-3 py-1.5 rounded-md hover:bg-primary-100 transition-colors"
                          >
                            Upload Result
                          </button>
                        </>
                      )}
                      {test.is_cleared && (
                        <div className="flex items-center text-slate-400 gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          <CheckCircle2 className="h-3 w-3 text-slate-400" />
                          <span className="font-medium">Cleared & Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Request Test Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => { setIsRequestModalOpen(false); setEditingId(null); }}
        title={editingId ? "Edit Investigation Request" : "Request Investigation"}
        description={editingId ? "Update test request details" : "Add a new test request for this patient"}
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Investigation Name *</label>
              <button
                type="button"
                onClick={() => setIsNewLabTestModalOpen(true)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add New Type
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-opacity group-focus-within:opacity-40">
                <Search className={`h-4 w-4 ${selectedTests.length > 0 ? 'text-primary-500' : 'text-slate-400'}`} />
              </div>
              <input
                required={!editingId && selectedTests.length === 0}
                type="text"
                value={searchTerm || (selectedTests.length > 0 ? selectedTests.map(t => t.name).join(", ") : "")}
                onChange={(e) => {
                  const val = e.target.value;
                  // If user is clearing the comma separated list, clear everything
                  if (selectedTests.length > 0 && val === "") {
                    setSelectedTests([]);
                    setSearchTerm("");
                  } else {
                    setSearchTerm(val);
                  }
                  
                  if (editingId) {
                    setRequestForm({ ...requestForm, name: val });
                  }
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className={`w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${selectedTests.length > 0 ? 'bg-primary-50/30' : ''}`}
                placeholder={editingId ? "Investigation name..." : "Search or type investigation name... (Bulk allowed)"}
                autoComplete="off"
              />
              
              {/* Selected Tests Tags for Bulk - Visual confirmation below */}
              {!editingId && selectedTests.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 p-1 bg-slate-50 border border-dotted border-slate-200 rounded-md">
                  {selectedTests.map(test => (
                    <span 
                      key={test.id} 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-primary-700 text-[11px] font-semibold border border-primary-200 shadow-sm animate-in fade-in zoom-in duration-200"
                    >
                      {test.name}
                      <button 
                        type="button" 
                        onClick={() => removeSelectedTest(test.id)}
                        className="p-0.5 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setSelectedTests([])}
                    className="text-[10px] text-slate-400 hover:text-red-500 ml-auto px-1"
                  >
                    Clear All
                  </button>
                </div>
              )}
              
              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-40 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-slate-200">
                  {filteredLabTests.length > 0 ? (
                    filteredLabTests.map((test) => (
                      <div
                        key={test.id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-2 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                        onClick={() => selectLabTest(test)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="block truncate font-medium text-slate-900">{test.name}</span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">KSh {test.default_cost}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-tight">{test.type}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLabTest({ ...test });
                              setIsEditLabTestModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md"
                            title="Edit Library Item"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteLabTest(test.id, test.name, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title="Delete Library Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 px-3 text-slate-500 text-sm">No matches found. You can still type the name manually.</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select value={requestForm.type} onChange={e => setRequestForm({ ...requestForm, type: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <option value="lab">Laboratory (Blood, Urine, etc.)</option>
              <option value="radiology">Radiology (X-Ray, MRI, Ultrasound)</option>
              <option value="procedure">Clinical Procedure</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes</label>
            <textarea value={requestForm.notes} onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Why is this test being requested..."></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Test Fee (KES)</label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-500 sm:text-sm">KSh</span>
              </div>
              <input
                type="number"
                value={requestForm.cost}
                onChange={e => setRequestForm({ ...requestForm, cost: e.target.value })}
                className="block w-full rounded-md border-slate-300 pl-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => { setIsRequestModalOpen(false); setEditingId(null); }} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {editingId ? "Saving..." : "Requesting..."}</> : editingId ? "Save Changes" : "Request Test"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Result Modal */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="Upload Test Results"
        description="Enter diagnostic findings for this investigation"
      >
        <form onSubmit={handleResultSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={resultForm.status} onChange={e => setResultForm({ ...resultForm, status: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Result Details *</label>
            <textarea required value={resultForm.result} onChange={e => setResultForm({ ...resultForm, result: e.target.value })} rows={6} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Enter findings, measurements, or diagnostic results..."></textarea>
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsResultModalOpen(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Results"}
            </button>
          </div>
        </form>
      </Modal>
      {/* Add New Lab Test Type Modal (Bulk) */}
      <Modal
        isOpen={isNewLabTestModalOpen}
        onClose={() => setIsNewLabTestModalOpen(false)}
        title="Add New Investigation Types"
        description="Register one or more test types to the master library"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleNewLabTestSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-slate-600 text-xs font-bold uppercase tracking-wider bg-slate-50">
                  <th className="px-3 py-2 border-b border-slate-200">Investigation Name *</th>
                  <th className="px-3 py-2 border-b border-slate-200">Category</th>
                  <th className="px-3 py-2 border-b border-slate-200 w-32">Price (KES) *</th>
                  <th className="px-3 py-2 border-b border-slate-200 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bulkNewLabTests.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-2 py-2">
                      <input 
                        required 
                        type="text" 
                        value={row.name} 
                        onChange={e => updateBulkRow(index, 'name', e.target.value)} 
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                        placeholder="e.g. Thyroid Profile" 
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
                          className="text-slate-400 hover:text-red-600 transition-colors"
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
              <Plus className="h-4 w-4 mr-1" />
              Add Another Row
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsNewLabTestModalOpen(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Register Investigations"}
            </button>
          </div>
        </form>
      </Modal>

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
                <input
                  required
                  type="number"
                  value={editingLabTest.default_cost}
                  onChange={e => setEditingLabTest({ ...editingLabTest, default_cost: e.target.value })}
                  className="block w-full rounded-md border-slate-300 pl-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
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
