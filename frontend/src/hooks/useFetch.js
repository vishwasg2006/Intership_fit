import { useCallback, useEffect, useState } from "react";

// const { data, loading, error, reload } = useFetch(() => api.getHome(), []);
export default function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    fn()
      .then((data) => setState({ data, loading: false, error: "" }))
      .catch((e) => setState({ data: null, loading: false, error: e.message }));
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
