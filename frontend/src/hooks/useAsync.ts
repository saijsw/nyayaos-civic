import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic async operation hook with loading/error states.
 * Usage: const { data, loading, error, execute } = useAsync(fetchFunction);
 */
export const useAsync = <T, Args extends any[] = any[]>(
  asyncFn: (...args: Args) => Promise<T>
) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args: Args) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await asyncFn(...args);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err: any) {
      const errorMsg = err?.message || 'An error occurred';
      setState({ data: null, loading: false, error: errorMsg });
      throw err;
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
};
