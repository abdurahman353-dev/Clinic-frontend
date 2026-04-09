import { useState, useCallback, useEffect } from "react";
import { prescriptionAPI, medicineAPI, visitAPI } from "@/lib/api";

export function usePrescriptions(patientId?: number, initialData: any[] = []) {
  const [prescriptions, setPrescriptions] = useState<any[]>(initialData);
  const [meta, setMeta] = useState<any>(initialData.length > 0 ? { total: initialData.length, per_page: initialData.length, current_page: 1, last_page: 1 } : null);
  const [medicines, setMedicines] = useState<any[]>([]); // To populate the dropdown
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeVisitId, setActiveVisitId] = useState<number | null>(null);

  // Sync internal state if initialData from props changes
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setPrescriptions(initialData);
      setMeta({ total: initialData.length, per_page: initialData.length, current_page: 1, last_page: 0 }); 
    }
  }, [initialData]);

  const fetchPrescriptions = useCallback(async (params: any = {}) => {
    if (!patientId) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await prescriptionAPI.listGlobal({ 
        'filter[patient_id]': patientId,
        ...params
      });
      setPrescriptions(response.data || []);
      setMeta(response.meta || null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load prescriptions");
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const fetchMedicines = useCallback(async () => {
    try {
        const res = await medicineAPI.list({ limit: 100 });
        setMedicines(res.data || []);
    } catch (err) {
        console.error("Failed to load medicines", err);
    }
  }, []);

  const addPrescription = async (rxData: any) => {
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

      const res = await prescriptionAPI.store(visitId, rxData);
      
      if (res.data) {
        setPrescriptions(prev => [res.data, ...prev]);
        // Refetch medicines so the stock levels in the dropdown update
        await fetchMedicines();
      }
      
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const updatePrescription = async (rxId: number, rxData: any) => {
    try {
      const existing = prescriptions.find(r => r.id === rxId);
      if (!existing?.visit_id) throw new Error("Visit ID not found for prescription");

      // Optimistic update
      const prev = [...prescriptions];
      setPrescriptions(p => p.map(item => item.id === rxId ? { ...item, ...rxData, items: rxData.items || item.items } : item));

      const res = await prescriptionAPI.update(existing.visit_id, rxId, rxData);
      
      if (res.data) {
        setPrescriptions(p => p.map(item => item.id === rxId ? res.data : item));
        await fetchMedicines(); // Refresh stock
      }
      
      return res.data;
    } catch (err: any) {
      fetchPrescriptions(); // Restore on failure
      throw err;
    }
  };

  const deletePrescription = async (rxId: number) => {
    try {
      const existing = prescriptions.find(r => r.id === rxId);
      if (!existing?.visit_id) throw new Error("Visit ID not found for prescription");

      // Optimistic delete
      setPrescriptions(p => p.filter(item => item.id !== rxId));

      await prescriptionAPI.delete(existing.visit_id, rxId);
      await fetchMedicines(); // Refresh stock
    } catch (err: any) {
      fetchPrescriptions(); // Restore on failure
      throw err;
    }
  };

  return { 
    prescriptions, 
    meta,
    medicines, 
    isLoading, 
    errorMsg, 
    fetchPrescriptions, 
    fetchMedicines, 
    addPrescription,
    updatePrescription,
    deletePrescription,
    setPrescriptions
  };
}
