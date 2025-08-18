import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();
  const protectedPage = ["/", "/produk"];
  const adminPage = ["/user"];

  // jika blum login dan mengakses page terprotek
  if (
    (!auth.isLoggedin && protectedPage.includes(to.path)) ||
    (!auth.isLoggedin && adminPage.includes(to.path))
  ) {
    return navigateTo("/login");
  }

  // jika sudah login tapi mau akses login lagi
  if (auth.isLoggedin && to.path === "/login") {
    return navigateTo("/");
  }

  if (
    auth.isLoggedin &&
    adminPage.includes(to.path) &&
    auth.data?.role !== "ADMIN"
  ) {
    return navigateTo("/");
  }
});
