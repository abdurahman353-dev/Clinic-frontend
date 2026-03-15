import { useState, useCallback } from "react";
import { vitalAPI, visitAPI } from "@/lib/api";

export function useVitals(patientId?: number) {
  const [vitals, setVitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchVitals = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      // Vitals are tied to a visit. For MVP, we'll fetch visits for the patient and then aggregate vitals
      // Or we can just fetch all vitals and filter by patient. Let's fetch visits first.
      const visitsResponse = await visitAPI.list({ 'filter[patient_id]': patientId });
      if (!visitsResponse.data?.length) {
         setVitals([]);
         return;
      }
      
      const visits = visitsResponse.data;
      const vitalsPromises = visits.map((v: any) => vitalAPI.list(v.id));
      
      const vitalsResults = await Promise.all(vitalsPromises);
      const allVitals = vitalsResults.flatMap((res) => res.data || []);
      
      // Sort desc
      allVitals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setVitals(allVitals);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load vitals");
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const addVital = async (vitalsData: any) => {
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
          reason: "routine vitals check" 
        });
        visitId = newVisit.data.id;
      }

      const res = await vitalAPI.store(visitId, vitalsData);
      await fetchVitals();
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  return { vitals, isLoading, errorMsg, fetchVitals, addVital };
}
