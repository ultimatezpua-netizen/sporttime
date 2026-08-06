import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@/components/SafeIonicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { formatPrice, getProductById, PRODUCTS } from '@/data/products';
import { ProductImage } from '@/components/ProductImage';
import { ProductCard } from '@/components/ProductCard';
import { Header } from '@/components/Header';
import { FONTS } from '@/constants/typography';

export default function CartScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, clearCart, promoCode, promoDiscount, applyPromo, clearPromo } = useApp();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 84 + 16 : insets.bottom + 80 + 16;

  const cartItems = cart.map(ci => ({
    ...ci,
    product: getProductById(ci.productId),
  })).filter(ci => !!ci.product);

  const subtotal = cartItems.reduce((sum, ci) => sum + (ci.product?.price ?? 0) * ci.quantity, 0);
  const discount = Math.floor(subtotal * promoDiscount);
  const delivery = subtotal > 30000 ? 0 : 149;
  const total = subtotal - discount + delivery;

  const popularHits = useMemo(() => {
    return PRODUCTS.filter(p => p.series === 'Fenix' || p.series === 'Forerunner').slice(0, 4);
  }, []);

  const handleClearCart = () => {
    if (Platform.OS === 'web') {
      const confirmClear = typeof window !== 'undefined' ? window.confirm('Ви дійсно бажаєте видалити всі товари з кошика?') : true;
      if (confirmClear) {
        clearCart();
      }
    } else {
      Alert.alert(
        'Очистити кошик?',
        'Ви дійсно бажаєте видалити всі товари?',
        [
          { text: 'Скасувати', style: 'cancel' },
          { text: 'Очистити', style: 'destructive', onPress: () => clearCart() },
        ]
      );
    }
  };

  const handleApplyPromo = () => {
    if (promoCode) {
      clearPromo();
      setPromoInput('');
      setPromoError('');
      return;
    }
    const ok = applyPromo(promoInput.trim());
    if (!ok) {
      setPromoError('Невірний промокод');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setPromoError('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack title="Кошик" />

        <ScrollView
          style={styles.emptyScrollView}
          contentContainerStyle={[styles.emptyContainer, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Cart Icon */}
          <Ionicons name="cart-outline" size={54} color="#FF5500" style={{ marginBottom: 16 }} />

          {/* Title & Subtitle */}
          <Text style={styles.emptyTitle}>Кошик порожній</Text>
          <Text style={styles.emptySubtitle}>
            Ви ще не додали жодного товару. Оберіть свій ідеальний смарт-годинник у каталозі!
          </Text>

          {/* Catalog Button */}
          <Pressable
            style={({ pressed }) => [
              styles.catalogBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push('/catalog')}
          >
            <Text style={styles.catalogBtnText}>Перейти до каталогу</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>

          {/* Recommended Section */}
          <View style={styles.hitsSection}>
            <Text style={styles.hitsTitle}>Рекомендовані моделі</Text>
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Кошик ({cartItems.length})
        </Text>
        <TouchableOpacity
          onPress={handleClearCart}
          activeOpacity={0.7}
          style={{ padding: 8, flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={{ color: '#FF5500', fontSize: 14, fontWeight: '500', fontFamily: FONTS.medium }}>
            Очистити
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={ci => ci.productId}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: ci }) => (
          <View style={styles.cartItemCard}>
            {/* Top Right Delete Icon */}
            <TouchableOpacity
              style={styles.deleteIconTopRight}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                removeFromCart(ci.productId);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color="#8E8E93" />
            </TouchableOpacity>

            <View style={styles.cartItemTop}>
              <View style={styles.productImagePlaceholder}>
                {ci.product && (
                  <ProductImage
                    product={ci.product}
                    style={styles.cartProductImage}
                    resizeMode="contain"
                    iconSize={32}
                  />
                )}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {ci.product?.name}
                </Text>
                <Text style={styles.itemMeta}>
                  {ci.color} · {ci.size}
                </Text>
              </View>
            </View>

            {/* Bottom Row: Price & Quantity Stepper */}
            <View style={styles.bottomItemRow}>
              <Text style={styles.itemPrice}>
                {formatPrice((ci.product?.price ?? 0) * ci.quantity)}
              </Text>

              <View style={styles.qtyStepperRow}>
                <TouchableOpacity
                  style={styles.qtySquareBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateQuantity(ci.productId, ci.quantity - 1);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={14} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.qtyCountText}>{ci.quantity}</Text>

                <TouchableOpacity
                  style={styles.qtySquareBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateQuantity(ci.productId, ci.quantity + 1);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            {/* Promo Card */}
            <View style={styles.promoCard}>
              <Text style={styles.promoLabel}>Промокод</Text>
              {promoCode ? (
                <View style={styles.promoApplied}>
                  <View style={styles.promoActiveBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                    <Text style={styles.promoActiveText}>
                      {promoCode} — -{Math.round(promoDiscount * 100)}%
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { clearPromo(); setPromoInput(''); setPromoError(''); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.promoInputRow}>
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Введіть промокод"
                    placeholderTextColor="#8E8E93"
                    value={promoInput}
                    onChangeText={t => { setPromoInput(t); setPromoError(''); }}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity style={styles.promoApplyBtn} onPress={handleApplyPromo} activeOpacity={0.8}>
                    <Text style={styles.promoApplyText}>Застосувати</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!!promoError && <Text style={styles.promoErrorText}>{promoError}</Text>}
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Підсумок</Text>
              <SummaryRow label="Товари" value={formatPrice(subtotal)} />
              {discount > 0 && <SummaryRow label="Знижка" value={`-${formatPrice(discount)}`} accent />}
              <SummaryRow
                label="Доставка"
                value={delivery === 0 ? 'Безкоштовно' : formatPrice(delivery)}
                green={delivery === 0}
              />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Разом</Text>
                <Text style={styles.totalValue}>{formatPrice(total)}</Text>
              </View>
            </View>

            {delivery > 0 && (
              <View style={styles.freeShippingHint}>
                <Ionicons name="gift-outline" size={14} color="#FF5500" />
                <Text style={styles.freeShippingText}>
                  До безкоштовної доставки ще {formatPrice(30000 - subtotal)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push('/checkout')}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={18} color="#FFFFFF" />
              <Text style={styles.checkoutBtnText}>Оформити замовлення</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

function SummaryRow({ label, value, accent, green }: { label: string; value: string; accent?: boolean; green?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          accent && { color: '#EF4444' },
          green && { color: '#22C55E' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', fontFamily: FONTS.bold },
  list: { padding: 16, gap: 14 },

  /* Cart Item Card */
  cartItemCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 14,
    gap: 12,
    position: 'relative',
  },
  deleteIconTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 4,
  },
  cartItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 24,
  },
  productImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cartProductImage: { width: '100%', height: '100%' },
  itemInfo: { flex: 1, gap: 4 },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F2F2F7',
    lineHeight: 18,
    fontFamily: FONTS.medium,
  },
  itemMeta: { fontSize: 12, color: '#8E8E93', fontFamily: FONTS.regular },
  bottomItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF5500',
    fontFamily: FONTS.bold,
  },
  qtyStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtySquareBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyCountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    minWidth: 20,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },

  /* Footer & Summary */
  footer: { gap: 14, paddingTop: 6 },
  promoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 14,
    gap: 10,
  },
  promoLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: FONTS.bold },
  promoInputRow: { flexDirection: 'row', gap: 8 },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    backgroundColor: '#121212',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: FONTS.regular,
  },
  promoApplyBtn: {
    backgroundColor: '#FF5500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  promoApplyText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', fontFamily: FONTS.bold },
  promoApplied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promoActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
    backgroundColor: '#22C55E20',
  },
  promoActiveText: { fontSize: 13, fontWeight: '700', color: '#22C55E', fontFamily: FONTS.bold },
  promoErrorText: { color: '#EF4444', fontSize: 12, marginTop: 2, fontFamily: FONTS.regular },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 14,
    gap: 10,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: FONTS.bold },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#8E8E93', fontFamily: FONTS.regular },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: FONTS.bold },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    marginTop: 2,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: FONTS.bold },
  totalValue: { fontSize: 22, fontWeight: '700', color: '#FF5500', fontFamily: FONTS.bold },
  freeShippingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  freeShippingText: { fontSize: 12, color: '#8E8E93', flex: 1, fontFamily: FONTS.regular },
  checkoutBtn: {
    height: 48,
    borderRadius: 24,
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
  checkoutBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: FONTS.bold },

  /* Empty state styles */
  emptyScrollView: { flex: 1 },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
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
