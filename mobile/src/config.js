// Base URL of the deployed backend API. MUST include the /api suffix.
// For local testing on a physical device, use your computer's LAN IP
// (e.g. http://192.168.1.5:5000/api) - localhost will NOT work on a phone.
export const API_BASE_URL = "https://ghirni-grampachyat.onrender.com/api";

// Rounded-card radius used across the app.
export const RADIUS = 16;

// Light theme palette.
export const LIGHT = {
  primary: "#0D47A1",
  primaryDark: "#08306B",
  saffron: "#FF9933",
  success: "#16A34A",
  danger: "#DC2626",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  cardAlt: "#F1F5F9",
  text: "#1E293B",
  muted: "#64748B",
  border: "#E2E8F0",
  onPrimary: "#FFFFFF",
  shadow: "#0F172A",
};

// Dark theme palette.
export const DARK = {
  primary: "#3B82F6",
  primaryDark: "#1E3A8A",
  saffron: "#FB923C",
  success: "#22C55E",
  danger: "#F87171",
  bg: "#0B1220",
  card: "#1E293B",
  cardAlt: "#162032",
  text: "#F1F5F9",
  muted: "#94A3B8",
  border: "#334155",
  onPrimary: "#FFFFFF",
  shadow: "#000000",
};

// Backwards-compatible palette (maps legacy COLORS.* keys to the light theme).
export const COLORS = {
  gov: LIGHT.primary,
  govDark: LIGHT.primaryDark,
  saffron: LIGHT.saffron,
  india: LIGHT.success,
  bg: LIGHT.bg,
  card: LIGHT.card,
  text: LIGHT.text,
  muted: LIGHT.muted,
  border: LIGHT.border,
};
