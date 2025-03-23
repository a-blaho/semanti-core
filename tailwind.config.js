/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./assets/**/*.css",
  ],
  plugins: [
    require("@headlessui/tailwindcss")({ prefix: "ui" }),
    require("tailwindcss-animate"),
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        midnight: {
          50: "#f4f6fe",
          100: "#eaedfd",
          200: "#d9dffb",
          300: "#bac3f8",
          400: "#929cf3",
          500: "#666cec",
          600: "#4845e2",
          700: "#3833ce",
          800: "#2f2aad",
          900: "#29258d",
          950: "#191970",
        },
        downriver: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bedaff",
          300: "#92c4fe",
          400: "#5ea3fc",
          500: "#3980f8",
          600: "#2360ed",
          700: "#1b4bda",
          800: "#1d3db0",
          900: "#1d388b",
          950: "#172557",
        },
        space: {
          50: "#f0f6fe",
          100: "#dee9fb",
          200: "#c5dbf8",
          300: "#9dc4f3",
          400: "#6ea4ec",
          500: "#4c83e5",
          600: "#3767d9",
          700: "#2e53c7",
          800: "#2b45a2",
          900: "#283d80",
          950: "#1e2952",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
};
