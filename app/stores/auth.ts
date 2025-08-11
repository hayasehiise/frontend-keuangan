import { defineStore } from "pinia";

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
}
export const useAuthStore = defineStore("auth", {
  state: () => ({
    data: null as User | null,
    isLoggedin: false,
  }),
  actions: {
    login(user: User | null) {
      this.data = user;
      this.isLoggedin = !!user;
    },
    logout() {
      this.data = null;
      this.isLoggedin = false;
    },
  },
  // persist: {
  //   storage: piniaPluginPersistedstate.sessionStorage(),
  // },
});
