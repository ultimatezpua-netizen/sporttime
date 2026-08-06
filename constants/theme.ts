// constants/theme.ts
export const theme = {
  colors: {
    primaryBackground: "#0D0D0D",
    cardBackground: "#1C1C1E",
    subtleBorder: "rgba(255,255,255,0.08)",
    electricCyan: "#00A3E0",
    highVisLime: "#D2FF00",
    primaryText: "#FFFFFF",
    secondaryText: "rgba(255,255,255,0.6)"
  },
  spacing: {
    sm: 4,
    md: 8,
    lg: 16
  },
  radii: {
    md: 8
  }
} as const;

type Theme = typeof theme;
