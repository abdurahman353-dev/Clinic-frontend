import { useState, useCallback } from "react";
import { labTestAPI } from "@/lib/api";

// Global singleton cache for instant loading of lab tests library
let cachedLabTests: any[] | null = null;

export function useLabTests() {
  const [labTests, setLabTests] = useState<any[]>(cachedLabTests || []);
  const [isLoadingLabTests, setIsLoading] = useState(!cachedLabTests);
  const [labTestsError, setLabTestsError] = useState("");

  const fetchLabTests = useCallback(async () => {
    if (!cachedLabTests) setIsLoading(true);
    setLabTestsError("");
    try {
      const response = await labTestAPI.list();
      const tests = response.data || [];
      setLabTests(tests);
      cachedLabTests = tests;
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

  const bulkAddLabTests = async (tests: any[]) => {
    // Optimistic Update
    const tempItems = tests.map(t => ({ ...t, id: Math.random(), isOptimistic: true }));
    const originalTests = [...labTests];
    
    setLabTests(prev => [...prev, ...tempItems].sort((a, b) => a.name.localeCompare(b.name)));
    cachedLabTests = [...labTests, ...tempItems].sort((a, b) => a.name.localeCompare(b.name));

    try {
      const res = await labTestAPI.bulkStore({ tests });
      await fetchLabTests(); // Refresh for real IDs
      return res.data;
    } catch (err: any) {
      setLabTests(originalTests);
      cachedLabTests = originalTests;
      throw err;
    }
  };

  const deleteLabTest = async (id: number) => {
    const originalTests = [...labTests];
    setLabTests(prev => prev.filter(item => item.id !== id));

    try {
      await labTestAPI.delete(id);
    } catch (err: any) {
      setLabTests(originalTests);
      throw err;
    }
  };

  return { labTests, isLoadingLabTests, labTestsError, fetchLabTests, addLabTest, updateLabTest, bulkAddLabTests, deleteLabTest, setLabTests };
}
