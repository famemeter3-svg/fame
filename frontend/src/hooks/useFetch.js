import { useState, useEffect } from 'react';

/**
 * Custom hook for data fetching with loading and error states
 * @param {Function} fetchFn - Async function that fetches data
 * @param {Array} dependencies - Dependencies array for useEffect
 * @returns {object} { data, loading, error, refetch }
 */
export const useFetch = (fetchFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result.data || result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
};

/**
 * Custom hook for paginated data fetching
 * @param {Function} fetchFn - Async function that fetches data with offset/limit
 * @param {number} initialLimit - Items per page
 * @returns {object} { data, loading, error, page, nextPage, prevPage, setPage }
 */
export const usePaginatedFetch = (fetchFn, initialLimit = 20) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  const offset = page * initialLimit;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const result = await fetchFn(initialLimit, offset);
        setData(result.data?.data || result.data || []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [page, initialLimit]);

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => (p > 0 ? p - 1 : 0));

  return { data, loading, error, page, nextPage, prevPage, setPage };
};
