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
    isLoggedin: false,
  }),
  actions: {
    login(user: User | null) {
      this.isLoggedin = !!user;
    },
    logout() {
      this.isLoggedin = false;
    },
  },
});
