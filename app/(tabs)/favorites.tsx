import React, { useMemo } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@/components/SafeIonicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { getProductsByIds, PRODUCTS } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import { FONTS } from '@/constants/typography';
import { Header } from '@/components/Header';

export default function FavoritesScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favorites } = useApp();

  const products = getProductsByIds(favorites);
  const bottomPad = Platform.OS === 'web' ? 84 + 16 : insets.bottom + 80 + 16;

  const popularHits = useMemo(() => {
    return PRODUCTS.filter(p => p.series === 'Fenix' || p.series === 'Forerunner').slice(0, 4);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="Улюблені" />

      {products.length === 0 ? (
        <ScrollView
          style={styles.emptyScrollView}
          contentContainerStyle={[styles.emptyContainer, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Heart Icon Box */}
          <View style={styles.iconCircle}>
            <Ionicons name="heart" size={36} color="#FF5500" />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.emptyTitle}>Список порожній</Text>
          <Text style={styles.emptySubtitle}>
            Натискайте ♡ на картці товару, щоб зберегти моделі Garmin, які вам сподобалися.
          </Text>

          {/* Catalog Button */}
          <Pressable
            style={({ pressed }) => [
              styles.catalogBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push('/catalog')}
          >
            <Text style={styles.catalogBtnText}>Переглянути каталог</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>

          {/* Hits Section with Horizontal Scroll */}
          <View style={styles.hitsSection}>
            <Text style={styles.hitsTitle}>Хіти продажів</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hitsScroll}
            >
              {popularHits.map(item => (
                <View key={item.id} style={styles.hitCardWrapper}>
                  <ProductCard product={item} compact showCartButton={false} />
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => p.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ProductCard product={item} showCartButton={false} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  emptyScrollView: { flex: 1 },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 0, 0.3)',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: FONTS.regular,
  },
  catalogBtn: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 28,
    backgroundColor: '#FF5500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  catalogBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  hitsSection: {
    marginTop: 40,
    width: '100%',
  },
  hitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 14,
    fontFamily: FONTS.bold,
  },
  hitsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  hitCardWrapper: {
    width: 240,
  },
});
