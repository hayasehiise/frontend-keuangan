// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/ui",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
  ],
  runtimeConfig: {
    public: {
      apiUrl: "http://localhost:3000",
    },
  },
  css: ["~/assets/css/global.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  ui: {
    colorMode: false,
  },
});
