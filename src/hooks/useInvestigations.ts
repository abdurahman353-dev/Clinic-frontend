import { useState, useCallback, useEffect } from "react";
import { investigationAPI, visitAPI } from "@/lib/api";

export function useInvestigations(patientId?: number, initialData: any[] = [], propActiveVisitId?: number | null) {
  const [investigations, setInvestigations] = useState<any[]>(initialData);
  const [meta, setMeta] = useState<any>(initialData.length > 0 ? { total: initialData.length, per_page: initialData.length, current_page: 1, last_page: 1 } : null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeVisitId, setActiveVisitId] = useState<number | null>(propActiveVisitId || null);

  // Sync internal state if initialData from props changes
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setInvestigations(initialData);
      setMeta({ total: initialData.length, per_page: initialData.length, current_page: 1, last_page: 1 });
    }
  }, [initialData]);

  // Sync active visit ID from prop
  useEffect(() => {
    if (propActiveVisitId !== undefined) {
      setActiveVisitId(propActiveVisitId);
    }
  }, [propActiveVisitId]);

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

  const resolveVisitId = async () => {
    if (!patientId) throw new Error("Patient ID is required");

    // Use cached visit ID if available
    let visitId = activeVisitId;
    if (visitId) return visitId;

    const visitsResponse = await visitAPI.list({
      'filter[patient_id]': patientId,
      'sort': '-created_at',
      'per_page': 1,
    });
    const recentVisit = visitsResponse.data?.[0];

    // Accept any visit that is not fully paid (open, billed, completed)
    if (recentVisit && recentVisit.status !== 'paid') {
      visitId = recentVisit.id;
    } else if (recentVisit && recentVisit.status === 'paid') {
      throw new Error("This visit is already paid and closed. Please start a new visit from the Patient Profile before adding investigations.");
    } else {
      throw new Error("No visit found for this patient. Please start a new visit from the Patient Profile first.");
    }

    if (!visitId) throw new Error("Failed to resolve visit ID");

    setActiveVisitId(visitId);
    return visitId;
  };

  const addInvestigation = async (invData: any) => {
    try {
      const visitId = await resolveVisitId();
      const res = await investigationAPI.store(visitId, invData);

      if (res.data) {
        setInvestigations(prev => [res.data, ...prev]);
        setMeta((prev: any) => prev
          ? { ...prev, total: (prev.total || 0) + 1 }
          : { total: 1, per_page: 1, current_page: 1, last_page: 1 }
        );
      }

      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const bulkAddInvestigations = async (investigationsData: any[]) => {
    if (!investigationsData.length) {
      throw new Error("At least one investigation is required");
    }

    const visitId = await resolveVisitId();
    const res = await investigationAPI.bulkStore(visitId, { investigations: investigationsData });
    const created = res.data || [];

    if (created.length > 0) {
      setInvestigations(prev => [...created, ...prev]);
      setMeta((prev: any) => prev
        ? { ...prev, total: (prev.total || 0) + created.length }
        : { total: created.length, per_page: created.length, current_page: 1, last_page: 1 }
      );
    }

    return created;
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

  return { investigations, meta, isLoading, errorMsg, fetchInvestigations, addInvestigation, bulkAddInvestigations, updateInvestigation, setInvestigations };
}
