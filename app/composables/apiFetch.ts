export function useApiFetch<T>(url: string, options?: Record<string, unknown>) {
  const config = useRuntimeConfig();
  const headers = import.meta.server
    ? useRequestHeaders(["cookie"])
    : undefined;

  return useFetch<T>(`${config.public.apiUrl}${url}`, {
    credentials: "include",
    headers,
    ...options,
  });
}
