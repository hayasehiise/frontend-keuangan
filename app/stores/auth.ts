import { defineStore } from "pinia";

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
}
export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    isLoading: false,
    isLoggedin: false,
  }),
  actions: {
    async fetchUser() {
      this.isLoading = true;
      const requestFetch = useRequestFetch();
      try {
        const config = useRuntimeConfig();
        const { data, error } = await useAsyncData(() =>
          requestFetch(`${config.public.apiUrl}/auth/active`)
        );

        if (error.value) {
          this.user = null;
          this.isLoggedin = false;
        } else if (data.value) {
          this.user = data.value;
          this.isLoggedin = true;
        } else {
          this.user = null;
          this.isLoggedin = false;
        }
      } catch {
        this.user = null;
        this.isLoggedin = false;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        const config = useRuntimeConfig();
        await $fetch(`${config.public.apiUrl}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } finally {
        this.user = null;
        this.isLoggedin = false;
      }
    },
  },
});
