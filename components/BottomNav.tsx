import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/context/AppContext';
import { FONTS } from '@/constants/typography';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { cartCount, favorites } = useApp();

  const isHomeActive = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/' || pathname === '/(tabs)/index';
  const isCatalogActive = pathname.includes('/catalog');
  const isFavoritesActive = pathname.includes('/favorites');
  const isCartActive = pathname.includes('/cart') || pathname.includes('/checkout') || pathname.includes('/payment');
  const isProfileActive = pathname.includes('/profile') || pathname.includes('/settings') || pathname.includes('/orders');

  const navItems = [
    {
      id: 'home',
      label: 'Головна',
      iconOutline: 'home-outline' as const,
      iconFilled: 'home' as const,
      route: '/(tabs)' as const,
      isActive: isHomeActive,
      badge: 0,
    },
    {
      id: 'catalog',
      label: 'Каталог',
      iconOutline: 'grid-outline' as const,
      iconFilled: 'grid' as const,
      route: '/catalog' as const,
      isActive: isCatalogActive,
      badge: 0,
    },
    {
      id: 'favorites',
      label: 'Обрані',
      iconOutline: 'heart-outline' as const,
      iconFilled: 'heart' as const,
      route: '/(tabs)/favorites' as const,
      isActive: isFavoritesActive,
      badge: favorites.length,
    },
    {
      id: 'cart',
      label: 'Кошик',
      iconOutline: 'cart-outline' as const,
      iconFilled: 'cart' as const,
      route: '/(tabs)/cart' as const,
      isActive: isCartActive,
      badge: cartCount,
    },
    {
      id: 'profile',
      label: 'Профіль',
      iconOutline: 'person-outline' as const,
      iconFilled: 'person' as const,
      route: '/(tabs)/profile' as const,
      isActive: isProfileActive,
      badge: 0,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'web' ? 6 : Math.max(insets.bottom, 6),
        },
      ]}
    >
      {navItems.map((item) => {
        const activeColor = colors.primary;
        const inactiveColor = colors.mutedForeground;
        const iconColor = item.isActive ? activeColor : inactiveColor;
        const textColor = item.isActive ? activeColor : inactiveColor;
        const iconName = item.isActive ? item.iconFilled : item.iconOutline;

        return (
          <Pressable
            key={item.id}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
            hitSlop={6}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={20} color={iconColor} />
              {item.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.navLabel,
                {
                  color: textColor,
                  fontFamily: item.isActive ? FONTS.bold : FONTS.medium,
                  fontWeight: item.isActive ? '700' : '500',
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 54,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    zIndex: 9999,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 9,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
