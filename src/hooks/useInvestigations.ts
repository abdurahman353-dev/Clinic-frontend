import { useState, useCallback } from "react";
import { investigationAPI, visitAPI } from "@/lib/api";

export function useInvestigations(patientId?: number) {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeVisitId, setActiveVisitId] = useState<number | null>(null);

  const fetchInvestigations = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await investigationAPI.listGlobal({ 'filter[patient_id]': patientId });
      setInvestigations(response.data || []);
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
        
        if (recentVisit) {
          visitId = recentVisit.id;
        } else {
          const userStr = typeof window !== 'undefined' ? sessionStorage.getItem("admin_user") : null;
          const user = userStr ? JSON.parse(userStr) : null;

          const newVisitResponse = await visitAPI.store({ 
            patient_id: patientId, 
            doctor_id: user?.id,
            reason: "routine lab work" 
          });
          visitId = newVisitResponse.data.id;
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

  return { investigations, isLoading, errorMsg, fetchInvestigations, addInvestigation, updateInvestigation };
}
