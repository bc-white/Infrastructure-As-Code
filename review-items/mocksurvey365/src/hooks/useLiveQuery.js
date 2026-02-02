/**
 * React hook for using Dexie liveQuery with React
 * Provides reactive updates when IndexedDB data changes
 */

import { useEffect, useState } from 'react';

/**
 * Custom hook to use Dexie liveQuery with React
 * @param {Function} queryFn - Function that returns a Dexie query or promise
 * @param {Array} deps - Dependency array (like useEffect)
 * @returns {[any, boolean, Error|null]} - [data, isLoading, error]
 */
export function useLiveQuery(queryFn, deps = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!queryFn) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let subscription = null;

    try {
      // Execute the query function to get the observable
      const observable = queryFn();

      if (!observable || typeof observable.subscribe !== 'function') {
        // If it's not an observable, treat it as a regular promise
        Promise.resolve(observable).then(
          (result) => {
            if (isMounted) {
              setData(result);
              setIsLoading(false);
              setError(null);
            }
          },
          (err) => {
            if (isMounted) {
              setError(err);
              setIsLoading(false);
              setData(null);
            }
          }
        );
        return;
      }

      // Subscribe to the observable
      subscription = observable.subscribe({
        next: (value) => {
          if (isMounted) {
            setData(value);
            setIsLoading(false);
            setError(null);
          }
        },
        error: (err) => {
          if (isMounted) {
            setError(err);
            setIsLoading(false);
            setData(null);
          }
        },
      });
    } catch (err) {
      if (isMounted) {
        setError(err);
        setIsLoading(false);
        setData(null);
      }
    }

    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, deps);

  return [data, isLoading, error];
}

export default useLiveQuery;

