import { useState, useCallback, useEffect, useRef } from "react";
import { medicineAPI, stockAPI } from "@/lib/api";
import { onDataChange } from "@/lib/dataEvents";

export function useStock() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const lastParamsRef = useRef<Record<string, any>>({});

  const fetchMedicines = useCallback(async (params: Record<string, any> = {}, options: { silent?: boolean } = {}) => {
    const silent = options.silent === true;
    lastParamsRef.current = params;

    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg("");

    try {
      const res = await medicineAPI.list(params);
      setMedicines(res.data || []);
      setMeta(res.meta || null);
      setSummary(res.summary || null);
      if (Array.isArray(res.categories)) {
        setAllCategories(res.categories);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load medicines and stock");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchAllCategories = useCallback(async () => {
    try {
      const cats = await medicineAPI.categories();
      setAllCategories(Array.isArray(cats) ? cats : []);
    } catch {
      // silently fail
    }
  }, []);

  // Any successful mutation anywhere in the app triggers a silent re-sync.
  useEffect(() => onDataChange(() => {
    fetchMedicines(lastParamsRef.current, { silent: true });
  }), [fetchMedicines]);

  const addMedicine = async (medData: any) => {
    const res = await medicineAPI.store(medData);
    if (res) {
      setMedicines(prev => [res, ...prev]);
      setSummary((prev: any) => prev ? { ...prev, total: (prev.total || 0) + 1 } : prev);
    }
    return res;
  };

  const updateMedicine = async (medId: number, medData: any) => {
    const prev = [...medicines];
    setMedicines(p => p.map(m => m.id === medId ? { ...m, ...medData, stock: { ...m.stock, minimum_stock: medData.minimum_stock, reorder_level: medData.reorder_level } } : m));

    try {
      const res = await medicineAPI.update(medId, medData);
      if (res) {
        setMedicines(p => p.map(m => m.id === medId ? res : m));
      }
      return res;
    } catch (err: any) {
      setMedicines(prev);
      throw err;
    }
  };

  const bulkAddStock = async (stocks: any[]) => {
    return await stockAPI.bulkStore({ stocks });
  };

  const bulkAddMedicines = async (items: any[]) => {
    const res = await medicineAPI.bulkStore(items);
    if (Array.isArray(res) && res.length > 0) {
      setMedicines(prev => [...res, ...prev]);
      setSummary((prev: any) => prev ? { ...prev, total: (prev.total || 0) + res.length } : prev);
    }
    return res;
  };

  const addStock = async (stockData: { medicine_id: string | number, quantity: number, buying_price?: number | null, batch_number?: string, expiry_date?: string }) => {
    const res = await stockAPI.store(stockData);
    if (res) {
      setMedicines(prev => prev.map(m => {
        if (m.id == stockData.medicine_id) {
          return { ...m, stock: res };
        }
        return m;
      }));
    }
    return res;
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
      if (res) {
        setMedicines(prev => prev.map(m => {
          if (m.stock && m.stock.id === stockId) {
            return { ...m, stock: res };
          }
          return m;
        }));
      }
      return res;
    } catch (err) {
      // Caller should re-fetch medicines to restore correct state on error
      throw err;
    }
  };

  const updateCategory = async (oldName: string, newName: string) => {
    const originalMedicines = [...medicines];
    setMedicines(prev => prev.map(m => m.category === oldName ? { ...m, category: newName } : m));

    try {
      await medicineAPI.updateCategory(oldName, newName);
    } catch (err: any) {
      setMedicines(originalMedicines);
      throw err;
    }
  };

  const deleteCategory = async (name: string) => {
    const originalMedicines = [...medicines];
    setMedicines(prev => prev.map(m => m.category === name ? { ...m, category: null } : m));

    try {
      await medicineAPI.deleteCategory(name);
    } catch (err: any) {
      setMedicines(originalMedicines);
      throw err;
    }
  };

  return { medicines, meta, summary, allCategories, isLoading, isRefreshing, errorMsg, fetchMedicines, fetchAllCategories, addMedicine, updateMedicine, addStock, bulkAddStock, bulkAddMedicines, adjustStock, updateCategory, deleteCategory, setMedicines };
}
