import { useState, useCallback } from "react";
import { prescriptionAPI, medicineAPI, visitAPI } from "@/lib/api";

export function usePrescriptions(patientId?: number) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]); // To populate the dropdown
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeVisitId, setActiveVisitId] = useState<number | null>(null);

  const fetchPrescriptions = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await prescriptionAPI.listGlobal({ 'filter[patient_id]': patientId });
      setPrescriptions(response.data || []);
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
        
        if (recentVisit) {
          visitId = recentVisit.id;
        } else {
          const userStr = typeof window !== 'undefined' ? sessionStorage.getItem("admin_user") : null;
          const user = userStr ? JSON.parse(userStr) : null;

          const newVisitResponse = await visitAPI.store({ 
            patient_id: patientId, 
            doctor_id: user?.id,
            reason: "prescription refill" 
          });
          visitId = newVisitResponse.data.id;
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

  return { 
    prescriptions, 
    medicines, 
    isLoading, 
    errorMsg, 
    fetchPrescriptions, 
    fetchMedicines, 
    addPrescription,
    updatePrescription,
    setPrescriptions
  };
}
