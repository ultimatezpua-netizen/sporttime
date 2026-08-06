import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/SafeIonicons';
import { useApp } from '@/context/AppContext';

export default function OrderConfirmationScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clearCart, lastOrder } = useApp();

  const { orderId, orderNumber, paymentMethod } = useLocalSearchParams<{
    orderId: string;
    orderNumber: string;
    paymentMethod: 'card' | 'cash';
  }>();

  const isCard = paymentMethod === 'card';
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom + 24;

  // Clear cart once on mount
  useEffect(() => {
    clearCart();
  }, []);

  const goToOrder = () => {
    if (orderId) {
      router.replace({
        pathname: '/order/[id]',
        params: { id: orderId, paymentMethod: paymentMethod ?? 'cash' },
      });
    } else {
      router.replace('/orders');
    }
  };

  const goToCatalog = () => {
    router.replace('/catalog');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={styles.body}>
        {/* Icon */}
        <View style={[styles.iconRing, { backgroundColor: '#22C55E18', borderColor: '#22C55E40' }]}>
          <View style={[styles.iconInner, { backgroundColor: '#22C55E22' }]}>
            <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isCard ? 'Оплата пройшла успішно' : 'Замовлення підтверджено'}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isCard
            ? 'Ваш платіж прийнято. Ми обробимо замовлення найближчим часом.'
            : 'Замовлення прийнято. Оплату проведете при отриманні.'}
        </Text>

        {/* Order number */}
        {!!orderNumber && (
          <View style={[styles.orderBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.orderBadgeLabel, { color: colors.mutedForeground }]}>Номер замовлення</Text>
            <Text style={[styles.orderBadgeNumber, { color: colors.foreground }]}>#{orderNumber}</Text>
          </View>
        )}

        {/* If we have a lastOrder stored in context, show items and totals here so the
            confirmation is informative even after the cart is cleared. */}
        {lastOrder && (
          <View style={{ width: '100%', marginTop: 14 }}>
            {lastOrder.items.map((it) => (
              <View key={`${it.productId}-${it.quantity}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ color: colors.foreground }}>{it.name} × {it.quantity}</Text>
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>{(it.price * it.quantity).toLocaleString('uk-UA')} ₴</Text>
              </View>
            ))}
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: colors.mutedForeground }}>До сплати</Text>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{lastOrder.totals.total.toLocaleString('uk-UA')} ₴</Text>
            </View>
            <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>Доставка: {lastOrder.deliveryMethod === 'nova_poshta' ? 'Нова Пошта' : 'Кур’єрська доставка'}</Text>
          </View>
        )}

        {/* Payment method pill */}
        <View style={[
          styles.paymentPill,
          {
            backgroundColor: isCard ? '#3B82F618' : '#F5A62318',
            borderColor: isCard ? '#3B82F640' : '#F5A62340',
          },
        ]}>
          <Ionicons
            name={isCard ? 'card-outline' : 'cash-outline'}
            size={15}
            color={isCard ? '#3B82F6' : '#F5A623'}
          />
          <Text style={[styles.paymentPillText, { color: isCard ? '#3B82F6' : '#F5A623' }]}>
            {isCard ? 'Оплачено онлайн карткою' : 'Накладний платіж — оплата при отриманні'}
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 10, borderTopColor: colors.border }]}>
        {!!orderId && (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={goToOrder}
          >
            <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Переглянути замовлення</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={goToCatalog}
        >
          <Ionicons name="storefront-outline" size={18} color={colors.foreground} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>До каталогу</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 18 },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '700' as const, textAlign: 'center' as const },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center' as const, maxWidth: 300 },
  orderBadge: {
    alignItems: 'center',
    gap: 4,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 4,
  },
  orderBadgeLabel: { fontSize: 12, fontWeight: '700' as const },
  orderBadgeNumber: { fontSize: 22, fontWeight: '700' as const },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  paymentPillText: { fontSize: 13, fontWeight: '700' as const },
  footer: { padding: 16, gap: 10, borderTopWidth: 1 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' as const },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700' as const },
});
