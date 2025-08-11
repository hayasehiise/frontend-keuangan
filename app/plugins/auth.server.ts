interface User {
  id: string;
  name: string;
  username: string;
  role: string;
}

export default defineNuxtPlugin(async (_nuxtApp) => {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  const headers = useRequestHeaders();

  if (authStore.data) return;

  try {
    const { data: user } = await useFetch<User>(
      `${config.public.apiUrl}/auth/active`,
      {
        credentials: "include",
        headers,
      }
    );
    authStore.login(user.value || null);
  } catch {
    authStore.login(null);
  }
});
