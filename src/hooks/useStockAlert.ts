"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import { onDataChange } from "@/lib/dataEvents";

type AlertStatus = "none" | "low" | "critical";

let cached: { value: AlertStatus; at: number } | null = null;
let inflight: Promise<AlertStatus> | null = null;
const CACHE_TTL = 30000;

function loadStockAlert(force = false): Promise<AlertStatus> {
  if (!force && cached && Date.now() - cached.at < CACHE_TTL) {
    return Promise.resolve(cached.value);
  }

  if (inflight) {
    return inflight;
  }

  inflight = apiClient
    .get("/stock-alert", { params: force ? { no_cache: 1 } : {} })
    .then(({ data }) => {
      const value: AlertStatus =
        data?.status === "critical" ? "critical" : data?.status === "low" ? "low" : "none";
      cached = { value, at: Date.now() };
      return value;
    })
    .catch(() => cached?.value ?? "none")
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function useStockAlert(enabled: boolean): AlertStatus {
  const [status, setStatus] = useState<AlertStatus>(cached?.value ?? "none");

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    const run = (force: boolean) => {
      loadStockAlert(force).then((value) => {
        if (active) setStatus(value);
      });
    };

    const initial = setTimeout(() => run(false), 1500);
    const unsubscribe = onDataChange(() => run(true));
    const interval = setInterval(() => run(true), 120000);

    return () => {
      active = false;
      clearTimeout(initial);
      unsubscribe();
      clearInterval(interval);
    };
  }, [enabled]);

  return status;
}
