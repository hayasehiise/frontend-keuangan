export function useApiFetchInput<T>(
  url: string,
  options?: Record<string, unknown>
) {
  const config = useRuntimeConfig();
  const headers = import.meta.server
    ? useRequestHeaders(["cookie"])
    : undefined;

  return $fetch<T>(`${config.public.apiUrl}${url}`, {
    credentials: "include",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    ...options,
  });
}
