"use client";

import { useEffect, useState, useCallback } from "react";
import { getMockStore } from "./store";

export function useMockStore() {
  const [data, setData] = useState(null);

  const refresh = useCallback(() => {
    setData(getMockStore());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("mock-admin-update", handler);
    return () => window.removeEventListener("mock-admin-update", handler);
  }, [refresh]);

  return { data, refresh };
}

export function useMockStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const { getStats } = await import("./store");
      setStats(getStats());
    }
    load();
    const handler = () => load();
    window.addEventListener("mock-admin-update", handler);
    return () => window.removeEventListener("mock-admin-update", handler);
  }, []);

  return stats;
}
