import { useState, useCallback } from "react";
import { labTestAPI } from "@/lib/api";

export function useLabTests() {
  const [labTests, setLabTests] = useState<any[]>([]);
  const [isLoadingLabTests, setIsLoading] = useState(false);
  const [labTestsError, setLabTestsError] = useState("");

  const fetchLabTests = useCallback(async () => {
    setIsLoading(true);
    setLabTestsError("");
    try {
      const response = await labTestAPI.list();
      setLabTests(response.data || []);
    } catch (err: any) {
      setLabTestsError(err.message || "Failed to load lab tests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLabTest = async (data: any) => {
    // Optimistic Update
    const tempId = Date.now();
    const tempItem = { ...data, id: tempId, isOptimistic: true };
    setLabTests(prev => [...prev, tempItem].sort((a, b) => a.name.localeCompare(b.name)));

    try {
      const res = await labTestAPI.store(data);
      if (res.data) {
        setLabTests(prev => prev.map(item => item.id === tempId ? res.data : item).sort((a, b) => a.name.localeCompare(b.name)));
      }
      return res.data;
    } catch (err: any) {
      setLabTests(prev => prev.filter(item => item.id !== tempId));
      throw err;
    }
  };

  const updateLabTest = async (id: number, data: any) => {
    const originalItem = labTests.find(item => item.id === id);
    // Optimistic Update
    setLabTests(prev => prev.map(item => item.id === id ? { ...item, ...data } : item).sort((a, b) => a.name.localeCompare(b.name)));

    try {
      const res = await labTestAPI.update(id, data);
      if (res.data) {
        setLabTests(prev => prev.map(item => item.id === id ? res.data : item).sort((a, b) => a.name.localeCompare(b.name)));
      }
      return res.data;
    } catch (err: any) {
      if (originalItem) {
        setLabTests(prev => prev.map(item => item.id === id ? originalItem : item).sort((a, b) => a.name.localeCompare(b.name)));
      }
      throw err;
    }
  };

  return { labTests, isLoadingLabTests, labTestsError, fetchLabTests, addLabTest, updateLabTest, setLabTests };
}
