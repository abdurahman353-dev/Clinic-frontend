import { useState, useCallback } from "react";
import { investigationAPI, visitAPI } from "@/lib/api";

export function useInvestigations(patientId?: number) {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeVisitId, setActiveVisitId] = useState<number | null>(null);

  const fetchInvestigations = useCallback(async (params: any = {}) => {
    if (!patientId) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await investigationAPI.listGlobal({ 
        'filter[patient_id]': patientId,
        ...params
      });
      setInvestigations(response.data || []);
      setMeta(response.meta || null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load investigations");
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const addInvestigation = async (invData: any) => {
    if (!patientId) throw new Error("Patient ID is required");
    let visitId = activeVisitId;
    
    try {
      // Find or create visit
      if (!visitId) {
        const visitsResponse = await visitAPI.list({ 
          'filter[patient_id]': patientId,
          'sort': '-created_at'
        });
        const recentVisit = visitsResponse.data?.[0];
        const isRecent = recentVisit && (new Date().getTime() - new Date(recentVisit.created_at).getTime()) < 24 * 60 * 60 * 1000;
        
        if (recentVisit && isRecent && recentVisit.status !== 'completed' && recentVisit.status !== 'paid') {
          visitId = recentVisit.id;
        } else {
          throw new Error("No active visit found for today. Please start a new visit from the Patient Profile before adding records.");
        }
        setActiveVisitId(visitId);
      }

      if (!visitId) throw new Error("Failed to resolve visit ID");

      const res = await investigationAPI.store(visitId, invData);
      
      if (res.data) {
        setInvestigations(prev => [res.data, ...prev]);
      }
      
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateInvestigation = async (invId: number, updateData: any) => {
    try {
      const existing = investigations.find(i => i.id === invId);
      if (!existing?.visit_id) throw new Error("Visit ID not found for investigation");

      const res = await investigationAPI.update(existing.visit_id, invId, updateData);
      
      if (res.data) {
        setInvestigations(p => p.map(item => item.id === invId ? res.data : item));
      }
      
      return res.data;
    } catch (err: any) {
      fetchInvestigations(); // Refetch to be safe since we don't have prev state fully isolated here if it threw late
      throw err;
    }
  };

  return { investigations, meta, isLoading, errorMsg, fetchInvestigations, addInvestigation, updateInvestigation, setInvestigations };
}
