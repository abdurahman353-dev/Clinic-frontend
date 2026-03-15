import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export function usePrescriptions(patientId?: number) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]); // To populate the dropdown
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPrescriptions = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const visitsResponse = await apiFetch(`/visits?filter[patient_id]=${patientId}`);
      if (!visitsResponse.data?.length) {
         setPrescriptions([]);
         return;
      }
      const visits = visitsResponse.data;
      const rxPromises = visits.map((v: any) => apiFetch(`/visits/${v.id}/prescriptions`));
      
      const rxResults = await Promise.all(rxPromises);
      const allRx = rxResults.flatMap((res) => res.data || []);
      
      // Sort desc
      allRx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setPrescriptions(allRx);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load prescriptions");
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const fetchMedicines = useCallback(async () => {
    try {
        const res = await apiFetch('/medicines');
        setMedicines(res.data || []);
    } catch (err) {
        console.error("Failed to load medicines", err);
    }
  }, []);

  const addPrescription = async (rxData: any) => {
    let visitId;
    try {
      // Find or create visit
      const visitsResponse = await apiFetch(`/visits?filter[patient_id]=${patientId}&sort=-created_at`);
      const recentVisit = visitsResponse.data?.[0];
      
      if (recentVisit) {
        visitId = recentVisit.id;
      } else {
        const newVisit = await apiFetch(`/visits`, {
          method: "POST",
          body: JSON.stringify({ patient_id: patientId, reason: "prescription refill" })
        });
        visitId = newVisit.data.id;
      }

      const res = await apiFetch(`/visits/${visitId}/prescriptions`, {
        method: "POST",
        body: JSON.stringify(rxData)
      });
      await fetchPrescriptions();
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  return { 
    prescriptions, 
    medicines, 
    isLoading, 
    errorMsg, 
    fetchPrescriptions, 
    fetchMedicines, 
    addPrescription 
  };
}
