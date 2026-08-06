// src/constants/theme.ts
export const theme = {
  colors: {
    primaryBackground: '#0F172A', // темный фон приложения
    cardBackground: '#1E293B', // фон карточек, чуть светлее
    card: '#1E293B', // alias for card background
    subtleBorder: 'rgba(255,255,255,0.08)', // полупрозрачные границы
    electricCyan: '#00A3E0', // бренд‑цвет Garmin
    highVisLime: '#D2FF00', // яркий акцент
    primaryText: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.6)',
    // дополнительные цвета, при необходимости
    tint: '#FF5500',
    background: '#0D0D0D',
    foreground: '#FFFFFF',
    primary: '#FF5500',
    secondary: '#1F1F1F',
    muted: '#2C2C2E',
    accent: '#FF5500',
    destructive: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  spacing: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  radii: {
    md: 8,
  },
} as const;

export type Theme = typeof theme;
