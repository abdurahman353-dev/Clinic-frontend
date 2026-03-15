import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export function useInvestigations(patientId?: number) {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchInvestigations = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const visitsResponse = await apiFetch(`/visits?filter[patient_id]=${patientId}`);
      if (!visitsResponse.data?.length) {
         setInvestigations([]);
         return;
      }
      const visits = visitsResponse.data;
      const invPromises = visits.map((v: any) => apiFetch(`/visits/${v.id}/investigations`));
      
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
      const visitsResponse = await apiFetch(`/visits?filter[patient_id]=${patientId}&sort=-created_at`);
      const recentVisit = visitsResponse.data?.[0];
      
      if (recentVisit) {
        visitId = recentVisit.id;
      } else {
        const newVisit = await apiFetch(`/visits`, {
          method: "POST",
          body: JSON.stringify({ patient_id: patientId, reason: "routine lab work" })
        });
        visitId = newVisit.data.id;
      }

      const res = await apiFetch(`/visits/${visitId}/investigations`, {
        method: "POST",
        body: JSON.stringify(invData)
      });
      await fetchInvestigations();
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateInvestigationResult = async (invId: number, resultData: any) => {
    try {
      // Find the visit ID for the investigation to form the URL `visits/{visit}/investigations/{investigation}`
      // Since it's nested resources, we need the visit ID, or we can use the main `/investigations` endpoint if one existed
      // Laravel JSON:API usually supports flat updates if configured, but let's assume we need to update via the visit
      // For simplicity matching the route `Route::apiResource('visits.investigations', InvestigationController::class);`
      
      // We will look up the visit_id from the existing state
      const existing = investigations.find(i => i.id === invId);
      if (!existing?.visit_id) throw new Error("Visit ID not found for investigation");

      const res = await apiFetch(`/visits/${existing.visit_id}/investigations/${invId}`, {
        method: "PATCH",
        body: JSON.stringify({ ...resultData, _method: "PATCH" })
      });
      await fetchInvestigations();
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  return { investigations, isLoading, errorMsg, fetchInvestigations, addInvestigation, updateInvestigationResult };
}
