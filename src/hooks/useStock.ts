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
      if (res.data) {
        setMedicines(prev => [res.data, ...prev]);
      }
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateMedicine = async (medId: number, medData: any) => {
    const prev = [...medicines];
    setMedicines(p => p.map(m => m.id === medId ? { ...m, ...medData, stock: { ...m.stock, minimum_stock: medData.minimum_stock, reorder_level: medData.reorder_level } } : m));

    try {
      const res = await medicineAPI.update(medId, medData);
      if (res.data) {
        setMedicines(p => p.map(m => m.id === medId ? res.data : m));
      }
      return res.data;
    } catch (err: any) {
      setMedicines(prev);
      throw err;
    }
  };

  const addStock = async (stockData: { medicine_id: string | number, quantity: number, batch_number?: string, expiry_date?: string }) => {
     try {
         const res = await stockAPI.store(stockData);
         if (res.data) {
            setMedicines(prev => prev.map(m => {
                if (m.id == stockData.medicine_id) {
                    return { ...m, stock: res.data };
                }
                return m;
            }));
         }
         return res.data;
     } catch (err: any) {
         throw err;
     }
  };

  const adjustStock = async (stockId: number, adjustment: number) => {
    // Optimistic local update
    setMedicines(prev => prev.map(m => {
      if (m.stock && m.stock.id === stockId) {
        return { 
          ...m, 
          stock: { 
            ...m.stock, 
            quantity: (m.stock.quantity ?? 0) + adjustment 
          } 
        };
      }
      return m;
    }));

    try {
      const res = await stockAPI.adjust(stockId, adjustment);
      if (res.data) {
        setMedicines(prev => prev.map(m => {
          if (m.stock && m.stock.id === stockId) {
            return { ...m, stock: res.data };
          }
          return m;
        }));
      }
      return res.data;
    } catch (err: any) {
      // Caller should re-fetch medicines to restore correct state on error
      throw err;
    }
  };

  return { medicines, isLoading, errorMsg, fetchMedicines, addMedicine, updateMedicine, addStock, adjustStock, setMedicines };
}
