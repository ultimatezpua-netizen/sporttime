import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/SafeIonicons';
import { useApp } from '@/context/AppContext';
import { EmptyState, PrimaryButton, ScreenHeader, Surface } from '@/components/AppUI';
import { FONTS } from '@/constants/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerOrder, getOrdersByPhone } from '@/services/ordersClient';
import { ShieldCheckIcon, ArrowRightIcon } from '@/components/ProfileIcons';
import { safeParseJSON } from '@/utils/safeStorage';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPrice(n: number): string {
  if (!n) return '0 ₴';
  return n.toLocaleString('uk-UA') + ' ₴';
}

function statusColor(status: string, colors: any): string {
  const s = (status || '').toLowerCase();
  if (s.includes('скасов') || s.includes('cancel')) return '#ef4444';
  if (s.includes('виконан') || s.includes('доставлен') || s.includes('completed') || s.includes('delivered')) return '#22c55e';
  if (s.includes('оплачен') || s.includes('paid') || s.includes('прийнято')) return '#3b82f6';
  return colors.primary;
}

export default function OrdersScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom + 24;

  const { customerPhone, setCustomerPhone } = useApp();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [phonePrompt, setPhonePrompt] = useState(!customerPhone);

  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const fetchOrders = useCallback(
    async (phone: string, silent = false) => {
      if (!silent) setLoading(true);

      let serverOrders: CustomerOrder[] = [];
      if (phone) {
        try {
          const data = await getOrdersByPhone(phone);
          if (Array.isArray(data)) {
            serverOrders = data;
          }
        } catch (err) {
          console.warn("Server orders fetch notice:", err);
        }
      }

      let localOrders: CustomerOrder[] = [];
      try {
        const [raw1, raw2] = await Promise.all([
          AsyncStorage.getItem('user_orders'),
          AsyncStorage.getItem('@sporttime/orders'),
        ]);
        const rawLocal = raw1 || raw2;
        if (rawLocal) {
          const parsed = safeParseJSON<any[]>(rawLocal, []);
          if (Array.isArray(parsed)) {
            const cleanTargetPhone = phone ? phone.replace(/\D/g, '') : '';
            localOrders = parsed.filter((o: any) => {
              if (!o || typeof o !== 'object') return false;
              if (!o?.phone || !cleanTargetPhone) return true;
              const cleanOrderPhone = String(o.phone).replace(/\D/g, '');
              return cleanOrderPhone.includes(cleanTargetPhone) || cleanTargetPhone.includes(cleanOrderPhone);
            });
          }
        }
      } catch (e) {
        console.warn("Failed reading local orders for list", e);
      }

      const mergedMap = new Map<string, CustomerOrder>();
      [...localOrders, ...serverOrders].forEach((ord: any) => {
        if (!ord || typeof ord !== 'object') return;
        const rawKey = ord?.id || ord?.orderId || ord?.orderNumber;
        const key = rawKey ? String(rawKey) : '';
        if (key && !mergedMap.has(key)) {
          mergedMap.set(key, {
            id: key,
            orderNumber: String(ord?.orderNumber || ord?.number || key),
            status: String(ord?.status || 'Прийнято в обробку'),
            createdAt: String(ord?.createdAt || ord?.date || new Date().toISOString()),
            total: Number(ord?.total ?? ord?.totals?.total ?? 0) || 0,
            clientName: String(ord?.clientName || ord?.customer?.name || ''),
            items: Array.isArray(ord?.items) ? ord.items : [],
            statusId: Number(ord?.statusId) || 1,
          });
        }
      });

      const finalOrders = Array.from(mergedMap.values());

      if (isMountedRef.current) {
        setOrders(finalOrders);
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (customerPhone && !phonePrompt) {
      void fetchOrders(customerPhone);
    } else if (!customerPhone) {
      void fetchOrders('', true);
    }
  }, [customerPhone, phonePrompt, fetchOrders]);

  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/\D/g, '');
    if (clean.startsWith('380')) {
      clean = clean.slice(3);
    } else if (clean.startsWith('0')) {
      clean = clean.slice(1);
    }
    setPhoneDigits(clean.slice(0, 9));
  };

  const handlePhoneSubmit = async () => {
    const digits = phoneDigits.trim();
    if (!digits || digits.length < 9) {
      Alert.alert('Помилка', 'Введіть 9 цифр вашого номера телефону');
      return;
    }
    const fullPhone = '+380' + digits;
    await setCustomerPhone(fullPhone);
    setPhonePrompt(false);
    void fetchOrders(fullPhone);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchOrders(customerPhone, true);
  };

  // Phone prompt card screen
  if (phonePrompt && orders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Мої замовлення" colors={colors} />
        <ScrollView contentContainerStyle={[styles.promptContent, { paddingBottom: bottomPad }]}>
          <View style={styles.promptCard}>
            <ShieldCheckIcon color="#FF5500" size={40} />
            <Text style={styles.promptTitle}>
              Вхід та пошук замовлень
            </Text>
            <Text style={styles.promptSubtitle}>
              Введіть номер телефону, вказаний при оформленні замовлення
            </Text>

            <View style={[styles.phoneInputContainer, isFocused && styles.phoneInputFocused]}>
              <View style={styles.prefixBadge}>
                <Text style={styles.prefixText}>+380</Text>
              </View>
              <TextInput
                style={styles.phoneInputField}
                placeholder="XX XXX XX XX"
                placeholderTextColor="#8E8E93"
                value={phoneDigits}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handlePhoneSubmit}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                maxLength={9}
                autoFocus
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
              onPress={handlePhoneSubmit}
            >
              <Text style={styles.submitBtnText}>Отримати код / Знайти</Text>
              <ArrowRightIcon color="#FFFFFF" size={18} />
            </Pressable>

            <Text style={styles.securityText}>
              🔒 Ваші персональні дані надійно захищені
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Loading
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Мої замовлення" colors={colors} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Завантаження…</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="Мої замовлення"
          subtitle={customerPhone}
          colors={colors}
        />
        <EmptyState
          icon="receipt-outline"
          title="Замовлень не знайдено"
          description={`Замовлень для номера ${customerPhone || ''} не знайдено.`}
          colors={colors}
          action={
            <View style={{ gap: 10 }}>
              <PrimaryButton
                label="Відкрити каталог"
                icon="grid-outline"
                onPress={() => router.push('/catalog')}
                colors={colors}
                style={styles.emptyButton}
              />
              <Pressable onPress={() => { setPhonePrompt(true); setPhoneDigits(''); }} style={{ alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: FONTS.medium }}>Змінити номер телефону</Text>
              </Pressable>
            </View>
          }
        />
      </View>
    );
  }

  // Orders list
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Мої замовлення"
        subtitle={`${orders.length} замовл. ${customerPhone ? '· ' + customerPhone : ''}`}
        colors={colors}
      />
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            colors={colors}
            onPress={() => router.push(`/order/${order.id}`)}
          />
        ))}
        <Pressable onPress={() => { setPhonePrompt(true); setPhoneDigits(''); }} style={{ alignItems: 'center', marginTop: 8, paddingVertical: 12 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: FONTS.medium }}>Змінити номер телефону</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function OrderCard({
  order,
  colors,
  onPress,
}: {
  order: CustomerOrder;
  colors: any;
  onPress: () => void;
}) {
  const badgeColor = statusColor(order.status, colors);
  const itemCount = (order.items || []).length;
  return (
    <Pressable onPress={onPress} android_ripple={{ color: colors.muted }}>
      <Surface colors={colors} style={styles.orderCard}>
        <View style={styles.orderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.orderNumber, { color: colors.foreground }]}>
              Замовлення №{order.orderNumber || order.id}
            </Text>
            <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
              {formatDate(order.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badgeColor + '18', borderColor: badgeColor + '40' }]}>
            <Text style={[styles.statusText, { color: badgeColor }]}>{order.status || 'Прийнято'}</Text>
          </View>
        </View>
        <View style={[styles.orderDivider, { backgroundColor: colors.border }]} />
        <View style={styles.orderFooter}>
          <Text style={[styles.orderMeta, { color: colors.mutedForeground }]}>
            {itemCount} {itemCount === 1 ? 'товар' : itemCount < 5 ? 'товари' : 'товарів'}
          </Text>
          <Text style={[styles.orderTotal, { color: colors.foreground }]}>
            {formatPrice(order.total)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 14, fontFamily: FONTS.regular },
  list: { padding: 16, gap: 10 },
  emptyButton: { marginTop: 8 },
  promptContent: { padding: 16, flexGrow: 1, justifyContent: 'center' },
  promptCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 24,
    alignItems: 'center',
    gap: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  promptSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
    fontFamily: FONTS.regular,
  },
  phoneInputContainer: {
    width: '100%',
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  phoneInputFocused: {
    borderColor: '#FF5500',
  },
  prefixBadge: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#2C2C2E',
    marginRight: 10,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  phoneInputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: FONTS.medium,
  },
  submitBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF5500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    elevation: 4,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.bold,
  },
  securityText: {
    color: '#636366',
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  orderCard: { padding: 14 },
  orderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  orderNumber: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.bold },
  orderDate: { fontSize: 12, marginTop: 2, fontFamily: FONTS.regular },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '700', fontFamily: FONTS.bold },
  orderDivider: { height: 1, marginVertical: 10 },
  orderFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderMeta: { flex: 1, fontSize: 13, fontFamily: FONTS.regular },
  orderTotal: { fontSize: 15, fontWeight: '700', marginRight: 4, fontFamily: FONTS.bold },
});
