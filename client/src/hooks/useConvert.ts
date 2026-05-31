import { useCallback, useState } from "react";
import type { ConvertResponse } from "../types/convert";
import { convertFile, convertUrl } from "../api/client";

interface ConvertState {
  loading: boolean;
  error: string | null;
  result: ConvertResponse | null;
}

export function useConvert() {
  const [state, setState] = useState<ConvertState>({
    loading: false,
    error: null,
    result: null,
  });

  const handleFile = useCallback(async (file: File) => {
    setState({ loading: true, error: null, result: null });
    try {
      const result = await convertFile(file);
      setState({ loading: false, error: null, result });
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
        result: null,
      });
    }
  }, []);

  const handleUrl = useCallback(async (url: string) => {
    setState({ loading: true, error: null, result: null });
    try {
      const result = await convertUrl(url);
      setState({ loading: false, error: null, result });
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
        result: null,
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null });
  }, []);

  return { ...state, handleFile, handleUrl, reset };
}
