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
    let visitId = activeVisitId;
    try {
<<<<<<< Updated upstream
      // Find or create visit if not cached
      if (!visitId) {
        const visitsResponse = await visitAPI.list({ 
          'filter[patient_id]': patientId,
          'sort': '-created_at',
          'page[size]': 1
=======
      // Find or create visit
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

        const newVisit = await visitAPI.store({ 
          patient_id: patientId, 
          doctor_id: user?.id,
          reason: "routine lab work" 
>>>>>>> Stashed changes
        });
        const recentVisit = visitsResponse.data?.[0];
        
        if (recentVisit) {
          visitId = recentVisit.id;
        } else {
          const newVisit = await visitAPI.store({ 
            patient_id: patientId, 
            reason: "routine lab work" 
          });
          visitId = newVisit.data.id;
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

      // Optimistic update
      const prev = [...investigations];
      setInvestigations(p => p.map(item => item.id === invId ? { ...item, ...updateData } : item));

      const res = await investigationAPI.update(existing.visit_id, invId, updateData);
      
      if (res.data) {
        setInvestigations(p => p.map(item => item.id === invId ? res.data : item));
      }
      
      return res.data;
    } catch (err: any) {
      // Re-fetch or let error bubble up, we didn't save rollback state robustly, 
      // but let's assume it throws and caller handles it.
      // To strictly rollback:
      fetchInvestigations(); // Refetch to be safe since we don't have prev state fully isolated here if it threw late
      throw err;
    }
  };

  return { investigations, isLoading, errorMsg, fetchInvestigations, addInvestigation, updateInvestigation };
}
