// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/supabase",
    "@nuxtjs/tailwindcss",
    "nuxt-icon",
    "nuxt-headlessui",
  ],
  tailwindcss: {
    config: {
      content: [],
      plugins: [require("@headlessui/tailwindcss")({ prefix: "ui" })],
      theme: {
        extend: {
          colors: {
            midnight: {
              "50": "#f4f6fe",
              "100": "#eaedfd",
              "200": "#d9dffb",
              "300": "#bac3f8",
              "400": "#929cf3",
              "500": "#666cec",
              "600": "#4845e2",
              "700": "#3833ce",
              "800": "#2f2aad",
              "900": "#29258d",
              "950": "#191970",
            },
          },
        },
      },
    },
  },
  supabase: {
    redirectOptions: {
      login: "/",
      callback: "/",
    },
  },
});
