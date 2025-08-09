import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();
  const protectedPage = ["/", "/produk"];
  if (import.meta.server) await auth.fetchUser();
  console.log(`logged ${auth.isLoggedin}`);

  if (!auth.isLoggedin && protectedPage.includes(to.path)) {
    return navigateTo("/login");
  }
  if (auth.isLoggedin && !protectedPage.includes(to.path)) {
    return navigateTo("/");
  }
});
