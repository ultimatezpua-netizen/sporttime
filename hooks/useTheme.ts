// hooks/useTheme.ts
import { theme } from '@/constants/theme';
import colors from '@/constants/colors';
import { useColorScheme } from 'react-native';
import { useSettings } from '@/context/SettingsContext';

/**
 * Returns the unified design tokens for the current color scheme.
 *
 * Merges backward-compatible color palette from constants/colors.ts
 * with new theme tokens from constants/theme.ts.
 * This is the single source of truth for all styling tokens.
 */
export function useTheme() {
  const scheme = useColorScheme();
  const { theme: userTheme } = useSettings();
  const isDark =
    userTheme === 'dark' || (userTheme === undefined && scheme === 'dark');

  // Backward-compatible palette from colors.ts
  const palette =
    isDark && 'dark' in colors
      ? (colors as unknown as Record<string, typeof colors.light>).dark
      : colors.light;

  // New theme tokens
  const themeColors = theme.colors;

  return {
    // Spread the legacy palette first (background, foreground, primary, card, border, etc.)
    ...palette,
    // Layer new theme tokens on top
    ...themeColors,
    // Layout tokens
    radius: colors.radius,
    spacing: theme.spacing,
  } as const;
}
