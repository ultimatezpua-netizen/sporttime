import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@/components/SafeIonicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { formatPrice, Product } from '@/data/products';
import { ProductImage } from '@/components/ProductImage';
import { FONTS } from '@/constants/typography';

/** Map color names (UA + EN) → hex for swatch display */
const COLOR_HEX_MAP: Record<string, string> = {
  // Ukrainian
  'Чорний': '#1A1A1A',
  'Білий': '#F5F5F5',
  'Зелений': '#2E8B57',
  'Сірий': '#808080',
  'Синій': '#2563EB',
  'Помаранчевий': '#FF6B00',
  'Темно-сірий': '#4A4A4A',
  'Сріблястий': '#C0C0C0',
  'Червоний': '#DC2626',
  'Фіолетовий': '#7C3AED',
  'Рожевий': '#EC4899',
  'Жовтий': '#EAB308',
  'Хакі': '#6B7B3B',
  'Блакитний': '#38BDF8',
  'Темно-синій': '#1E3A5F',
  'Темно-зелений': '#166534',
  'Бордовий': '#7F1D1D',
  'Коричневий': '#78350F',
  'Бузковий': '#C084FC',
  'Салатовий': '#84CC16',
  'Фуксія': '#D946EF',
  'Золотий': '#CA8A04',
  'Бежевий': '#D2B48C',
  'Світло-сірий': '#D1D5DB',
  // English
  'Black': '#1A1A1A',
  'White': '#F5F5F5',
  'Silver': '#C0C0C0',
  'Orange': '#FF6B00',
  'Green': '#2E8B57',
  'Red': '#DC2626',
  'Blue': '#2563EB',
  'Gray': '#808080',
  'Grey': '#808080',
  'Brown': '#78350F',
  'Navy': '#1E3A5F',
};

const MAX_VISIBLE_COLORS = 4;

/** Resolve a color name to a hex value, with fuzzy keyword fallback */
function resolveColorHex(name: string): string | null {
  if (COLOR_HEX_MAP[name]) return COLOR_HEX_MAP[name];
  const lower = name.toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key.toLowerCase())) return hex;
  }
  // Last resort: try to detect common substrings
  if (lower.includes('black') || lower.includes('чорн')) return '#1A1A1A';
  if (lower.includes('white') || lower.includes('біл')) return '#F5F5F5';
  if (lower.includes('green') || lower.includes('зелен')) return '#2E8B57';
  if (lower.includes('blue') || lower.includes('син')) return '#2563EB';
  if (lower.includes('orange') || lower.includes('помаранч')) return '#FF6B00';
  if (lower.includes('red') || lower.includes('черв')) return '#DC2626';
  if (lower.includes('gray') || lower.includes('grey') || lower.includes('сір')) return '#808080';
  if (lower.includes('brown') || lower.includes('коричн')) return '#78350F';
  if (lower.includes('silver') || lower.includes('срібл')) return '#C0C0C0';
  if (lower.includes('gold') || lower.includes('золот')) return '#CA8A04';
  return null;
}

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  showCartButton?: boolean;
}

export function ProductCard({ product, compact, showCartButton = true }: ProductCardProps) {
  const router = useRouter();
  const { toggleFavorite, isFavorite, toggleCompare, isInCompare, addToCart, isInCart } = useApp();
  const favorite = isFavorite(product.id);
  const compared = isInCompare(product.id);
  const inCart = isInCart(product.id);

  const handleFavorite = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(product.id);
  };

  const handleCompare = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleCompare(product.id);
  };

  const handleCart = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!inCart) {
      addToCart({
        productId: product.id,
        quantity: 1,
        color: '#1A1A1A',
        size: product.sizes[0] ?? '',
      });
      Alert.alert('Додано у кошик', 'Товар успішно додано у ваш кошик.', [
        { text: 'OK', style: 'cancel' }
      ]);
    } else {
      router.push('/(tabs)/cart');
    }
  };

  const handlePress = () => {
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  };

  const ratingVal = product.rating > 0 ? product.rating : 4.9;
  const reviewVal = product.reviewCount > 0 ? product.reviewCount : 128;
  const seriesLabel = product.series && product.series !== 'Garmin' ? `GARMIN ${product.series.toUpperCase()}` : 'GARMIN';

  const discountPercent = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : product.discount ?? 0;

  // Resolve color swatches
  const resolvedColors = (product.colors || [])
    .map(c => ({ name: c, hex: resolveColorHex(c) }))
    .filter((c): c is { name: string; hex: string } => c.hex !== null);
  const visibleColors = resolvedColors.slice(0, MAX_VISIBLE_COLORS);
  const overflowCount = resolvedColors.length - MAX_VISIBLE_COLORS;

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.darkCard,
          pressed && { opacity: 0.94, transform: [{ scale: 0.98 }] },
        ]}
        onPress={handlePress}
      >
        {/* Header row: Gray micro-text series label & Compare + Heart Icons */}
        <View style={styles.topRow}>
          <Text style={styles.graySeriesLabel}>{seriesLabel}</Text>

          <View style={styles.topRightActions}>
            <Pressable style={styles.iconBtnHeader} onPress={handleCompare} hitSlop={8}>
              <Ionicons
                name={compared ? 'git-compare' : 'git-compare-outline'}
                size={20}
                color={compared ? '#FF5500' : '#8E8E93'}
              />
            </Pressable>
            <Pressable style={styles.iconBtnHeader} onPress={handleFavorite} hitSlop={8}>
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={favorite ? '#FF5500' : '#8E8E93'}
              />
            </Pressable>
          </View>
        </View>

        {/* White island image container with 160px height & 16px side margin */}
        <View style={styles.whiteImageBox} pointerEvents="box-none">
          <ProductImage
            product={product}
            style={styles.productImage}
            resizeMode="contain"
            iconSize={46}
          />
        </View>

        {/* Info Content */}
        <View style={styles.infoContent}>
          {/* Regular thin 15px title */}
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Star Rating Row */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#FFB800" />
            <Text style={styles.ratingText}>
              {ratingVal} <Text style={styles.reviewCount}>({reviewVal})</Text>
            </Text>
          </View>

          {/* Color Swatches Row */}
          {visibleColors.length > 0 && (
            <View style={styles.colorSwatchRow}>
              {visibleColors.map((c, i) => (
                <View
                  key={`${c.name}-${i}`}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c.hex },
                    c.hex === '#F5F5F5' || c.hex === '#D1D5DB'
                      ? styles.colorDotLight
                      : null,
                  ]}
                />
              ))}
              {overflowCount > 0 && (
                <Text style={styles.colorOverflow}>+{overflowCount}</Text>
              )}
            </View>
          )}

          {/* Price, Old Price, Discount Percentage & Optional Circular Cart Button */}
          <View style={styles.bottomRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{formatPrice(product.price)}</Text>
              {product.oldPrice ? (
                <Text style={styles.oldPriceText}>{formatPrice(product.oldPrice)}</Text>
              ) : null}
              {discountPercent > 0 && (
                <Text style={styles.discountBadge}>-{discountPercent}%</Text>
              )}
            </View>

            {showCartButton && (
              <Pressable
                style={({ pressed }) => [
                  styles.cartCircleBtn,
                  inCart && styles.cartCircleBtnActive,
                  pressed && { transform: [{ scale: 0.92 }] },
                ]}
                onPress={handleCart}
                hitSlop={6}
              >
                <Ionicons
                  name={inCart ? 'checkmark' : 'cart-outline'}
                  size={20}
                  color="#FFFFFF"
                />
              </Pressable>
            )}
          </View>

          {/* Micro Benefits Line */}
          <View style={styles.benefitsRow}>
            <Text style={styles.benefitsText}>
              Гарантія 24 міс. • Безкоштовна доставка
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
  darkCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    marginBottom: 8,
  },
  graySeriesLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: FONTS.condensedBold,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtnHeader: {
    padding: 4,
  },
  whiteImageBox: {
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  infoContent: {
    marginTop: 8,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F2F2F7',
    lineHeight: 20,
    letterSpacing: 0.4,
    fontFamily: FONTS.condensedBold,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EBEBF5',
    fontFamily: FONTS.medium,
  },
  reviewCount: {
    fontSize: 11,
    color: '#8E8E93',
    fontFamily: FONTS.regular,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 4,
    minHeight: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF5500',
    fontFamily: FONTS.bold,
  },
  oldPriceText: {
    fontSize: 13,
    color: '#6C6C70',
    textDecorationLine: 'line-through',
    marginLeft: 8,
    fontFamily: FONTS.regular,
  },
  discountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5500',
    marginLeft: 6,
    fontFamily: FONTS.bold,
  },
  cartCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5500',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  cartCircleBtnActive: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
  },
  colorSwatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  colorDotLight: {
    borderColor: 'rgba(0,0,0,0.2)',
  },
  colorOverflow: {
    fontSize: 11,
    color: '#8E8E93',
    fontFamily: FONTS.medium,
    marginLeft: 2,
  },
  benefitsRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  benefitsText: {
    fontSize: 11,
    color: '#8E8E93',
    fontFamily: FONTS.regular,
  },
});
