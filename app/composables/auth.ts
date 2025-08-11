export const getUser = async () => {
  const config = useRuntimeConfig();
  const headers = useRequestHeaders();
  const { data, status } = await useAsyncData(
    "get-user",
    () =>
      $fetch(`${config.public.apiUrl}/auth/active`, {
        credentials: "include",
        headers,
      }),
    {
      immediate: true,
    }
  );
  return { data, status };
};
