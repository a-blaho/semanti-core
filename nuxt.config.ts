// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    "@nuxtjs/supabase",
    "@nuxtjs/tailwindcss",
    "nuxt-icon",
    "nuxt-headlessui",
  ],

  components: {
    dirs: [
      {
        path: "~/components",
        extensions: [".vue"],
        // Exclude index.ts files and ui directory from global registration
        pattern: "**/*.vue",
        ignore: ["**/ui/**/*"],
      },
    ],
  },

  supabase: {
    redirectOptions: {
      login: "/",
      callback: "/",
    },
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },

  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
  },

  nitro: {
    experimental: {
      asyncContext: true,
    },
  },

  postcss: {
    plugins: {
      "tailwindcss/nesting": {},
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  compatibilityDate: "2025-02-23",
});
