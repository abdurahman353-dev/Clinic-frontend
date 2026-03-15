import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";

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
      const visitsResponse = await apiFetch(`/visits?filter[patient_id]=${patientId}`);
      if (!visitsResponse.data?.length) {
         setVitals([]);
         return;
      }
      
      const visitIds = visitsResponse.data.map((v: any) => v.id);
      
      // Fetch vitals for these visits
      // In a real app we'd have a specific endpoint or eager load.
      // Laravel JSON API often uses filter[]
      // Let's create an endpoint or just fetch the first visit vitals for now.
      // Actually the backend VitalSign resource doesn't include visit relation directly in index unless requested.
      // Easiest is to POST a new visit if none exists, then POST vitals to replacing `visits/{visit}/vitals`
      
      // For now, let's just fetch recent vitals across all visits for this patient
      const vitalsPromises = visitsResponse.data.map((visit: any) => 
         apiFetch(`/visits/${visit.id}/vitals`)
      );
      const vitalsResults = await Promise.all(vitalsPromises);
      
      // flatten
      const allVitals = vitalsResults.flatMap(res => res.data || []);
      // sort by created_at desc
      allVitals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setVitals(allVitals);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load vitals");
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const addVital = async (vitalData: any) => {
    // 1. check if patient has an open visit today. If not, create one.
    let visitId;
    try {
      const visitsResponse = await apiFetch(`/visits?filter[patient_id]=${patientId}&sort=-created_at`);
      const recentVisit = visitsResponse.data?.[0];
      
      // Need a recent visit, otherwise create one
      if (recentVisit) {
        visitId = recentVisit.id;
      } else {
        const newVisit = await apiFetch(`/visits`, {
          method: "POST",
          body: JSON.stringify({ patient_id: patientId, reason: "routine" })
        });
        visitId = newVisit.data.id;
      }

      const res = await apiFetch(`/visits/${visitId}/vitals`, {
        method: "POST",
        body: JSON.stringify(vitalData)
      });
      await fetchVitals(); // refresh
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  return { vitals, isLoading, errorMsg, fetchVitals, addVital };
}
