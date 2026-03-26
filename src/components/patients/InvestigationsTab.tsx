"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle2, Clock, Loader2, FileText, Edit2, X, Search } from "lucide-react";
import { useInvestigations } from "@/hooks/useInvestigations";
import { useLabTests } from "@/hooks/useLabTests";
import { Modal } from "@/components/ui/Modal";
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
  const { labTests, isLoadingLabTests, fetchLabTests, addLabTest, updateLabTest } = useLabTests();

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

  const [requestForm, setRequestForm] = useState({
    name: "",
    type: "lab",
    notes: "",
    cost: ""
  });

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
    
    const data = {
      name: newLabTestForm.name,
      type: newLabTestForm.type,
      default_cost: parseFloat(newLabTestForm.default_cost) || 0
    };
    
    // Close modal and reset immediately for instant feedback
    setIsNewLabTestModalOpen(false);
    setNewLabTestForm({ name: "", type: "lab", default_cost: "" });
    
    // Auto-select (optimistically)
    setRequestForm({
      ...requestForm,
      name: data.name,
      type: data.type,
      cost: data.default_cost.toString()
    });
    setSearchTerm(data.name);

    try {
      await addLabTest(data);
      toast.success("New investigation type added to library");
    } catch (err: any) {
      // Error is handled by api.js toast, but we should reset search if it failed?
      // For now, api.js will show error toast.
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                required={!editingId && selectedTests.length === 0}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (editingId) {
                    setRequestForm({ ...requestForm, name: e.target.value });
                  }
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder={editingId ? "Investigation name..." : "Search or type investigation name... (Bulk allowed)"}
                autoComplete="off"
              />
              
              {/* Selected Tests Tags for Bulk */}
              {!editingId && selectedTests.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTests.map(test => (
                    <span 
                      key={test.id} 
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-50 text-primary-700 text-xs font-medium border border-primary-100 animate-in fade-in zoom-in duration-200"
                    >
                      {test.name}
                      <button 
                        type="button" 
                        onClick={() => removeSelectedTest(test.id)}
                        className="p-0.5 hover:bg-primary-100 rounded-full transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLabTest({ ...test });
                            setIsEditLabTestModalOpen(true);
                          }}
                          className="ml-2 p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          title="Edit Library Item"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
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
      {/* Add New Lab Test Type Modal */}
      <Modal
        isOpen={isNewLabTestModalOpen}
        onClose={() => setIsNewLabTestModalOpen(false)}
        title="Add New Investigation Type"
        description="Register a new type of test to the master library"
      >
        <form onSubmit={handleNewLabTestSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Investigation Name *</label>
            <input 
              required 
              type="text" 
              value={newLabTestForm.name} 
              onChange={e => setNewLabTestForm({ ...newLabTestForm, name: e.target.value })} 
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
              placeholder="e.g. Thyroid Profile" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select 
              value={newLabTestForm.type} 
              onChange={e => setNewLabTestForm({ ...newLabTestForm, type: e.target.value })} 
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
                value={newLabTestForm.default_cost}
                onChange={e => setNewLabTestForm({ ...newLabTestForm, default_cost: e.target.value })}
                className="block w-full rounded-md border-slate-300 pl-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsNewLabTestModalOpen(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Add to Library"}
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
    </div>
  );
}
