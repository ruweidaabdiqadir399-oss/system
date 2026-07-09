import { useCallback, useEffect, useRef, useState } from 'react';

const resolveError = (err) => err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';

/**
 * Runs an async fetcher on mount (and whenever `deps` change), exposing
 * loading/error/data state plus a manual `refetch`. Pass `{ skip: true }`
 * to defer the initial fetch (e.g. until a required param is available).
 */
export const useFetch = (fetcher, deps = [], { skip = false } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      return result;
    } catch (err) {
      setError(resolveError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skip) return undefined;
    let active = true;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(resolveError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  return { data, loading, error, setData, setError, refetch };
};
