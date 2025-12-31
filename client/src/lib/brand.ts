/**
 * Okapi Care Network Brand Colors
 * Deep purple primary color scheme
 */

export const BRAND = {
  // Primary purple
  purple: {
    DEFAULT: "#4C1D95",  // Main brand color
    dark: "#3B0764",     // Darker shade
    light: "#5B21B6",    // Lighter/hover
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
    950: "#4C1D95",      // Our main brand color
  },

  // Semantic colors
  primary: "#4C1D95",
  primaryHover: "#5B21B6",
  primaryDark: "#3B0764",

  // Footer/dark backgrounds
  footerBg: "#1e1b4b",

  // Keep teal as secondary/accent
  secondary: "#0d9488",
  secondaryHover: "#0f766e",
} as const;
