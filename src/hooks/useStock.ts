import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export function useStock() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchMedicines = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // The backend /medicines endpoint should return medicines with their stock relationship
      const res = await apiFetch("/medicines");
      setMedicines(res.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load medicines and stock");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMedicine = async (medData: any) => {
    try {
      // The backend StoreMedicineRequest handles saving the medicine and initial stock quantity
      // The medData should include: name, category, unit_price, description, size, unit, dosage_form,
      // and initial stock fields: initial_stock (quantity), minimum_stock, reorder_level, batch_number, expiry_date
      const res = await apiFetch(`/medicines`, {
        method: "POST",
        body: JSON.stringify(medData)
      });
      await fetchMedicines();
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateMedicine = async (medId: number, medData: any) => {
    try {
      const res = await apiFetch(`/medicines/${medId}`, {
         method: "PUT",
         body: JSON.stringify(medData)
      });
      await fetchMedicines();
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const addStock = async (stockData: { medicine_id: string | number, quantity: number, batch_number?: string, expiry_date?: string }) => {
     try {
         // Create a new stock entry for a medicine
         const res = await apiFetch(`/stocks`, {
             method: "POST",
             body: JSON.stringify(stockData)
         });
         await fetchMedicines();
         return res.data;
     } catch (err: any) {
         throw err;
     }
  };

  return { medicines, isLoading, errorMsg, fetchMedicines, addMedicine, updateMedicine, addStock };
}
