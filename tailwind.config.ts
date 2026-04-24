import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
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
        gold: {
          50: "hsl(var(--gold-50))",
          100: "hsl(var(--gold-100))",
          200: "hsl(var(--gold-200))",
          300: "hsl(var(--gold-300))",
          400: "hsl(var(--gold-400))",
          500: "hsl(var(--gold-500))",
          600: "hsl(var(--gold-600))",
          700: "hsl(var(--gold-700))",
          800: "hsl(var(--gold-800))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        "gradient-gold": "var(--gradient-gold)",
        "gradient-gold-soft": "var(--gradient-gold-soft)",
        "gradient-bg": "var(--gradient-bg)",
        "gradient-tile": "var(--gradient-tile)",
      },
      boxShadow: {
        gold: "var(--shadow-gold)",
        "gold-strong": "var(--shadow-gold-strong)",
        tile: "var(--shadow-tile)",
        popup: "var(--shadow-popup)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { "0%": { transform: "scale(0.85)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        "merge-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)", filter: "brightness(1.6)" },
          "100%": { transform: "scale(1)", filter: "brightness(1)" },
        },
        "coin-bounce": {
          "0%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-6px) scale(1.18)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        "spawn": {
          "0%": { transform: "scale(0) rotate(-180deg)", opacity: "0" },
          "60%": { transform: "scale(1.15) rotate(10deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0)", opacity: "1" },
        },
        "float-up": {
          "0%": { transform: "translateY(0) scale(0.9)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { transform: "translateY(-80px) scale(1.1)", opacity: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "banner-in": {
          "0%": { transform: "translate(-50%, -120%)", opacity: "0" },
          "60%": { transform: "translate(-50%, 10%)", opacity: "1" },
          "100%": { transform: "translate(-50%, 0)", opacity: "1" },
        },
        "particle": {
          "0%": { transform: "translate(0,0) scale(1)", opacity: "1" },
          "100%": { transform: "translate(var(--px,0), var(--py,0)) scale(0.2)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.25s var(--ease-bounce)",
        "merge-pop": "merge-pop 0.45s var(--ease-bounce)",
        "coin-bounce": "coin-bounce 0.4s var(--ease-bounce)",
        "spawn": "spawn 0.4s var(--ease-bounce)",
        "float-up": "float-up 1.1s ease-out forwards",
        "shimmer": "shimmer 2.5s linear infinite",
        "banner-in": "banner-in 0.6s var(--ease-bounce) forwards",
        "particle": "particle 0.8s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
