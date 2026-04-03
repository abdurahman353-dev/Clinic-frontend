import { useState, useCallback } from "react";
import { vitalAPI, visitAPI } from "@/lib/api";

export function useVitals(patientId?: number) {
  const [vitals, setVitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeVisitId, setActiveVisitId] = useState<number | null>(null);

  const fetchVitals = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await vitalAPI.listGlobal({ 'filter[patient_id]': patientId });
      setVitals(response.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load vitals");
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const addVital = async (vitalsData: any) => {
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

      const res = await vitalAPI.store(visitId, vitalsData);
      
      // Update state locally for "lightning" feel
      if (res.data) {
        setVitals(prev => [res.data, ...prev]);
      }
      
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateVital = async (visitId: number, vitalId: number, vitalData: any) => {
    // Optimistic UI update
    const prevVitals = [...vitals];
    setVitals(prev => prev.map(v => v.id === vitalId ? { ...v, ...vitalData } : v));

    try {
      const res = await vitalAPI.update(visitId, vitalId, vitalData);
      if (res.data) {
        setVitals(prev => prev.map(v => v.id === vitalId ? res.data : v));
      }
      return res.data;
    } catch (err: any) {
      // Rollback on error
      setVitals(prevVitals);
      throw err;
    }
  };

  return { vitals, isLoading, errorMsg, fetchVitals, addVital, updateVital, setVitals };
}
