import { Platform } from 'react-native';

const garminSansFont = Platform.select({
  web: 'Roboto, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  ios: 'System',
  android: 'sans-serif',
  default: undefined,
});

const garminCondensedFont = Platform.select({
  web: '"Roboto Condensed", Oswald, "Arial Condensed", sans-serif-condensed, sans-serif',
  ios: 'HelveticaNeue-CondensedBold',
  android: 'sans-serif-condensed',
  default: undefined,
});

export const FONTS = {
  regular: garminSansFont ?? 'Inter_400Regular',
  medium: garminSansFont ?? 'Inter_500Medium',
  semibold: garminSansFont ?? 'Inter_600SemiBold',
  bold: garminSansFont ?? 'Inter_700Bold',
  condensedBold: garminCondensedFont ?? garminSansFont ?? 'Inter_700Bold',
} as const;

export const GARMIN_TYPOGRAPHY = {
  heroTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    letterSpacing: 2,
    fontFamily: FONTS.condensedBold,
    textTransform: 'uppercase' as const,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    fontFamily: FONTS.condensedBold,
    textTransform: 'uppercase' as const,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
    fontFamily: FONTS.condensedBold,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 1,
    fontFamily: FONTS.condensedBold,
  },
  brandLogo: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#888888',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    fontFamily: FONTS.condensedBold,
  },
  priceTag: {
    fontSize: 20,
    fontWeight: '800' as const,
    fontFamily: FONTS.bold,
  },
  bodyText: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#666666',
    fontFamily: FONTS.medium,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 1,
    fontFamily: FONTS.condensedBold,
  },
} as const;