import { useState, useCallback } from "react";
import { medicineAPI, stockAPI } from "@/lib/api";

export function useStock() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchMedicines = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await medicineAPI.list();
      setMedicines(res.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load medicines and stock");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMedicine = async (medData: any) => {
    try {
      const res = await medicineAPI.store(medData);
      await fetchMedicines();
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateMedicine = async (medId: number, medData: any) => {
    try {
      const res = await medicineAPI.update(medId, medData);
      await fetchMedicines();
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const addStock = async (stockData: { medicine_id: string | number, quantity: number, batch_number?: string, expiry_date?: string }) => {
     try {
         const res = await stockAPI.store(stockData);
         await fetchMedicines();
         return res.data;
     } catch (err: any) {
         throw err;
     }
  };

  return { medicines, isLoading, errorMsg, fetchMedicines, addMedicine, updateMedicine, addStock };
}
