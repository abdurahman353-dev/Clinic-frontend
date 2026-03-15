import { useState, useCallback } from "react";
import { investigationAPI, visitAPI } from "@/lib/api";

export function useInvestigations(patientId?: number) {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchInvestigations = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const visitsResponse = await visitAPI.list({ 'filter[patient_id]': patientId });
      if (!visitsResponse.data?.length) {
         setInvestigations([]);
         return;
      }
      const visits = visitsResponse.data;
      const invPromises = visits.map((v: any) => investigationAPI.list(v.id));
      
      const invResults = await Promise.all(invPromises);
      const allTests = invResults.flatMap((res) => res.data || []);
      
      // Sort desc
      allTests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setInvestigations(allTests);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load investigations");
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const addInvestigation = async (invData: any) => {
    let visitId;
    try {
      // Find or create visit
      const visitsResponse = await visitAPI.list({ 
        'filter[patient_id]': patientId,
        'sort': '-created_at'
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

      const res = await investigationAPI.store(visitId, invData);
      await fetchInvestigations();
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateInvestigationResult = async (invId: number, resultData: any) => {
    try {
      const existing = investigations.find(i => i.id === invId);
      if (!existing?.visit_id) throw new Error("Visit ID not found for investigation");

      const res = await investigationAPI.update(existing.visit_id, invId, resultData);
      await fetchInvestigations();
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  return { investigations, isLoading, errorMsg, fetchInvestigations, addInvestigation, updateInvestigationResult };
}
