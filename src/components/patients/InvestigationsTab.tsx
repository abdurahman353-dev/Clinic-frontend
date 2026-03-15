"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle2, Clock, Loader2, X, FileText, Edit2 } from "lucide-react";
import { useInvestigations } from "@/hooks/useInvestigations";
import toast from "react-hot-toast";

export function InvestigationsTab({ patientId }: { patientId?: number }) {
  const { investigations, isLoading, fetchInvestigations, addInvestigation, updateInvestigation } = useInvestigations(patientId);
  
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [requestForm, setRequestForm] = useState({
    name: "",
    type: "lab",
    notes: ""
  });

  const [resultForm, setResultForm] = useState({
    result: "",
    status: "completed"
  });

  useEffect(() => {
    fetchInvestigations();
  }, [fetchInvestigations]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dataToSave = { ...requestForm };
    const currentEditingId = editingId;
    
    // Optimistic close
    setIsRequestModalOpen(false);
    setEditingId(null);
    setRequestForm({ name: "", type: "lab", notes: "" });

    try {
      if (currentEditingId) {
        await updateInvestigation(currentEditingId, dataToSave);
        toast.success("Investigation updated successfully");
      } else {
        await addInvestigation(dataToSave);
        toast.success("Investigation requested successfully");
      }
    } catch (err: any) {
      alert(err.message || "Failed to process request");
      setIsRequestModalOpen(true); // Re-open on failure
      if (currentEditingId) setEditingId(currentEditingId);
      setRequestForm(dataToSave);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId) return;
    setIsSubmitting(true);
    const dataToSave = { ...resultForm };
    const invId = selectedInvId;

    // Optimistic close
    setIsResultModalOpen(false);
    setSelectedInvId(null);
    setResultForm({ result: "", status: "completed" });

    try {
      await updateInvestigation(invId, dataToSave);
      toast.success("Test result uploaded successfully");
    } catch (err: any) {
      alert(err.message || "Failed to update test result");
      // Recovery
      setSelectedInvId(invId);
      setResultForm(dataToSave);
      setIsResultModalOpen(true);
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
       notes: test.notes || ""
    });
    setIsRequestModalOpen(true);
  };

  const handleAddRequest = () => {
    setEditingId(null);
    setRequestForm({ name: "", type: "lab", notes: "" });
    setIsRequestModalOpen(true);
  };

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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          test.type === 'radiology' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {test.type}
                        </span>
                        <p className="text-xs text-slate-500">Requested on {new Date(test.created_at).toLocaleDateString()}</p>
                      </div>
                      
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mb-2 ${
                      test.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {test.status}
                    </span>
                    <div className="flex items-center justify-end gap-2 text-xs">
                      {test.status !== 'completed' && (
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
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Request Test Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editingId ? "Edit Investigation" : "Request Investigation"}</h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Investigation Name *</label>
                <input required type="text" value={requestForm.name} onChange={e => setRequestForm({...requestForm, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g. Complete Blood Count" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select value={requestForm.type} onChange={e => setRequestForm({...requestForm, type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  <option value="lab">Laboratory (Blood, Urine, etc.)</option>
                  <option value="radiology">Radiology (X-Ray, MRI, Ultrasound)</option>
                  <option value="procedure">Clinical Procedure</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes</label>
                <textarea value={requestForm.notes} onChange={e => setRequestForm({...requestForm, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Why is this test being requested..."></textarea>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Requesting...</> : "Request Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Result Modal */}
      {isResultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
             <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Upload Test Results</h3>
              <button onClick={() => setIsResultModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleResultSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={resultForm.status} onChange={e => setResultForm({...resultForm, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Result Details *</label>
                <textarea required value={resultForm.result} onChange={e => setResultForm({...resultForm, result: e.target.value})} rows={6} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Enter findings, measurements, or diagnostic results..."></textarea>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsResultModalOpen(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Save Results"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
