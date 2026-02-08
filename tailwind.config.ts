import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
    },
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        "holo-bob": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "neon-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 6px rgba(192, 132, 252, 0.4), 0 0 14px rgba(192, 132, 252, 0.15), inset 0 0 6px rgba(192, 132, 252, 0.05)",
          },
          "50%": {
            boxShadow:
              "0 0 10px rgba(192, 132, 252, 0.6), 0 0 24px rgba(192, 132, 252, 0.25), inset 0 0 10px rgba(192, 132, 252, 0.1)",
          },
        },
        "glitch-reveal": {
          "0%": {
            clipPath: "inset(50% 0 50% 0)",
            filter: "brightness(2) saturate(0) hue-rotate(180deg)",
          },
          "10%": {
            clipPath: "inset(42% 0 42% 0)",
            filter: "brightness(1.8) saturate(0.2) hue-rotate(120deg)",
          },
          "15%": {
            clipPath: "inset(45% 0 45% 0)",
            filter: "brightness(2.2) saturate(0.1) hue-rotate(180deg)",
          },
          "25%": {
            clipPath: "inset(32% 0 32% 0)",
            filter: "brightness(1.5) saturate(0.4) hue-rotate(60deg)",
          },
          "35%": {
            clipPath: "inset(22% 0 22% 0)",
            filter: "brightness(1.3) saturate(0.6) hue-rotate(30deg)",
          },
          "40%": {
            clipPath: "inset(26% 0 26% 0)",
            filter: "brightness(1.6) saturate(0.3) hue-rotate(90deg)",
          },
          "55%": {
            clipPath: "inset(12% 0 12% 0)",
            filter: "brightness(1.2) saturate(0.7) hue-rotate(15deg)",
          },
          "65%": {
            clipPath: "inset(6% 0 6% 0)",
            filter: "brightness(1.1) saturate(0.85) hue-rotate(5deg)",
          },
          "70%": {
            clipPath: "inset(9% 0 9% 0)",
            filter: "brightness(1.3) saturate(0.7) hue-rotate(20deg)",
          },
          "85%": {
            clipPath: "inset(2% 0 2% 0)",
            filter: "brightness(1.05) saturate(0.95)",
          },
          "100%": {
            clipPath: "inset(0% 0 0% 0)",
            filter: "none",
          },
        },
        "scanline-scroll": {
          "0%": { backgroundPositionY: "0px" },
          "100%": { backgroundPositionY: "200px" },
        },
        "holo-ambient-flicker": {
          "0%, 100%": { backgroundColor: "transparent", transform: "translateX(0)" },
          "7%": { backgroundColor: "transparent", transform: "translateX(0)" },
          "7.3%": { backgroundColor: "rgba(192, 132, 252, 0.2)", transform: "translateX(4px)" },
          "7.6%": { backgroundColor: "rgba(100, 200, 255, 0.15)", transform: "translateX(-2px)" },
          "8%": { backgroundColor: "transparent", transform: "translateX(0)" },
          "34%": { backgroundColor: "transparent", transform: "translateX(0)" },
          "34.2%": { backgroundColor: "rgba(100, 200, 255, 0.18)", transform: "translateX(-3px)" },
          "34.5%": { backgroundColor: "transparent", transform: "translateX(0)" },
          "34.7%": { backgroundColor: "rgba(192, 132, 252, 0.12)", transform: "translateX(2px)" },
          "35%": { backgroundColor: "transparent", transform: "translateX(0)" },
          "61%": { backgroundColor: "transparent", transform: "translateX(0)" },
          "61.2%": { backgroundColor: "rgba(192, 132, 252, 0.22)", transform: "translateX(5px)" },
          "61.6%": { backgroundColor: "transparent", transform: "translateX(0)" },
          "88%": { backgroundColor: "transparent", transform: "translateX(0)" },
          "88.1%": { backgroundColor: "rgba(150, 100, 255, 0.25)", transform: "translateX(-4px)" },
          "88.4%": { backgroundColor: "rgba(100, 200, 255, 0.1)", transform: "translateX(3px)" },
          "88.8%": { backgroundColor: "transparent", transform: "translateX(0)" },
        },
      },
      animation: {
        "holo-bob": "holo-bob 5s ease-in-out infinite",
        "neon-pulse": "neon-pulse 3s ease-in-out infinite",
        "holo-ambient": "holo-ambient-flicker 8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
