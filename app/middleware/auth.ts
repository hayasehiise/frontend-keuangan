import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();
  const protectedPage = ["/", "/produk"];

  // // fetch data di SSR (Server Side)
  // // if (import.meta.server) await auth.fetchUser();
  // await auth.fetchUser();

  // jika blum login dan mengakses page terprotek
  if (!auth.isLoggedin && protectedPage.includes(to.path)) {
    return navigateTo("/login");
  }

  // jika sudah login tapi mau akses login lagi
  if (auth.isLoggedin && !protectedPage.includes(to.path)) {
    return navigateTo("/");
  }
});
