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
          reason: "routine vitals check" 
>>>>>>> Stashed changes
        });
        const recentVisit = visitsResponse.data?.[0];
        
        if (recentVisit) {
          visitId = recentVisit.id;
        } else {
          const newVisit = await visitAPI.store({ 
            patient_id: patientId, 
            reason: "routine vitals check" 
          });
          visitId = newVisit.data.id;
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

  return { vitals, isLoading, errorMsg, fetchVitals, addVital, updateVital };
}
