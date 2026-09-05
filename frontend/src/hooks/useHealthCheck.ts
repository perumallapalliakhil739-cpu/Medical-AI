import { useState, useEffect, useCallback } from 'react';
import { HealthResponse } from '../types';
import { fetchHealth } from '../services/api';

export function useHealthCheck(pollIntervalMs: number = 10000) {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchHealth();
      setData(res);
      setLastChecked(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to MedLens backend API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    if (pollIntervalMs > 0) {
      const interval = setInterval(checkHealth, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [checkHealth, pollIntervalMs]);

  return { data, loading, error, lastChecked, refetch: checkHealth };
}
