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
            downriver: {
              "50": "#eff6ff",
              "100": "#dbeafe",
              "200": "#bedaff",
              "300": "#92c4fe",
              "400": "#5ea3fc",
              "500": "#3980f8",
              "600": "#2360ed",
              "700": "#1b4bda",
              "800": "#1d3db0",
              "900": "#1d388b",
              "950": "#172557",
            },
            space: {
              "50": "#f0f6fe",
              "100": "#dee9fb",
              "200": "#c5dbf8",
              "300": "#9dc4f3",
              "400": "#6ea4ec",
              "500": "#4c83e5",
              "600": "#3767d9",
              "700": "#2e53c7",
              "800": "#2b45a2",
              "900": "#283d80",
              "950": "#1e2952",
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

  compatibilityDate: "2025-02-23",
});