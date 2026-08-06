import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/SafeIonicons';
import { Surface } from '@/components/AppUI';
import { useApp } from '@/context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CustomerOrder,
  getOrderById,
  OrdersClientError,
} from '@/services/ordersClient';
import { safeParseJSON } from '@/utils/safeStorage';

export interface ExtendedOrderDetails extends CustomerOrder {
  orderId?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  deliveryMethod?: string;
  paymentMethod?: string;
  totals?: {
    subtotal: number;
    discount: number;
    delivery: number;
    total: number;
  };
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

export function validateAndParseOrder(res: any): ExtendedOrderDetails | null {
  console.log("Backend Response:", res);

  if (!res) {
    throw new Error("Сервер повернув порожню відповідь");
  }

  if (typeof res === 'string') {
    const trimmed = res.trim();
    if (trimmed.toLowerCase() === 'success') {
      throw new Error("Сервер повернув 'Success' без деталей замовлення");
    }
    if (trimmed.toLowerCase().includes('error')) {
      throw new Error(trimmed);
    }
    try {
      res = JSON.parse(res);
    } catch {
      throw new Error(`Сервер повернув текстову відповідь: "${trimmed}"`);
    }
  }

  if (res && typeof res === 'object') {
    if (res.status === 'error' || res.error || res.success === false) {
      const errorMsg = res.message || res.error || res.errorMessage || res.reason || "Замовлення не знайдено";
      throw new Error(String(errorMsg));
    }
  }

  const orderData = res.data || res.order || res.result || res;
  if (orderData && (orderData.id || orderData.orderId || orderData.orderNumber)) {
    return orderData;
  }

  return null;
}

export default function OrderDetailScreen() {
  const { id, paymentMethod } = useLocalSearchParams<{ id: string; paymentMethod?: string }>();
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom + 24;
  const { customerPhone } = useApp();

  const [order, setOrder] = useState<ExtendedOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    // 🛑 1 & 2. Спочатку перевіряємо ДЛЯ ЛЮБОГО orderId наявність у AsyncStorage (user_orders чи @sporttime/orders)
    try {
      const [raw1, raw2] = await Promise.all([
        AsyncStorage.getItem('user_orders'),
        AsyncStorage.getItem('@sporttime/orders'),
      ]);
      const localRaw = raw1 || raw2;
      if (localRaw) {
        const localOrders = safeParseJSON<any[]>(localRaw, []);
        if (Array.isArray(localOrders)) {
          const foundLocal = localOrders.find(
            (o: any) => o?.id === id || o?.orderId === id || o?.orderNumber === id,
          );

          if (foundLocal) {
            console.log("Order found in AsyncStorage:", foundLocal);
            setOrder(foundLocal);
            if (isMountedRef.current) setLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to check AsyncStorage for order", e);
    }

    if (!customerPhone) {
      if (isMountedRef.current) setLoading(false);
      return;
    }

    try {
      const rawData = await getOrderById(id, customerPhone);
      const parsedOrder = validateAndParseOrder(rawData);
      if (isMountedRef.current) {
        if (parsedOrder) {
          setOrder(parsedOrder);
        } else {
          setError('Дані замовлення відсутні у відповіді сервера');
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const msg =
          err instanceof OrdersClientError
            ? err.code === 'not_found'
              ? 'Замовлення не знайдено або не належить вашому номеру телефону.'
              : err.message
            : err?.message || 'Помилка завантаження замовлення';
        setError(msg);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [id, customerPhone]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  const badge = order ? statusColor(order.status || 'Прийнято', colors) : colors.primary;
  const isCardPayment = (order?.paymentMethod || paymentMethod) === 'card' || (order?.paymentMethod || '').toLowerCase().includes('онлайн');
  const displayPaymentMethod = order?.paymentMethod || (isCardPayment ? 'Оплата карткою онлайн' : 'Накладний платіж');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              if (router.canGoBack()) { router.back(); } else { router.replace('/orders'); }
            } else {
              router.replace('/orders');
            }
          }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {order ? `Замовлення №${order.orderNumber || order.id || id}` : id ? `Замовлення #${id}` : 'Деталі замовлення'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Завантаження…</Text>
        </View>
      )}

      {/* Error / No phone */}
      {!loading && !order && (error || !customerPhone) && (
        <View style={styles.centered}>
          <Ionicons name="information-circle-outline" size={44} color={colors.primary} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            {!customerPhone && !id?.startsWith('ORD-') ? 'Номер телефону не вказано' : 'Замовлення не знайдено'}
          </Text>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            {error || 'Не вдалося завантажити деталі замовлення з сервера.'}
          </Text>
          <Pressable onPress={() => router.replace('/orders')} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              До списку замовлень
            </Text>
          </Pressable>
          {error && (
            <Pressable onPress={fetchOrder} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Спробувати ще раз</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* 3. Красивое отображение деталей заказа */}
      {!loading && order && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Status card */}
          <Surface colors={colors} style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: badge + '18', borderColor: badge + '40' }]}>
                <Ionicons name="ellipse" size={8} color={badge} />
                <Text style={[styles.statusText, { color: badge }]}>{order.status || 'Прийнято в обробку'}</Text>
              </View>
              <View style={[
                styles.paymentBadge,
                {
                  backgroundColor: isCardPayment ? '#3B82F618' : '#F5A62318',
                  borderColor: isCardPayment ? '#3B82F640' : '#F5A62340',
                },
              ]}>
                <Ionicons
                  name={isCardPayment ? 'card-outline' : 'cash-outline'}
                  size={12}
                  color={isCardPayment ? '#3B82F6' : '#F5A623'}
                />
                <Text style={[styles.paymentBadgeText, { color: isCardPayment ? '#3B82F6' : '#F5A623' }]}>
                  {displayPaymentMethod}
                </Text>
              </View>
            </View>
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              Створено: {formatDate(order.createdAt)}
            </Text>
          </Surface>

          {/* Customer & Delivery Information */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            КЛІЄНТ ТА ДОСТАВКА
          </Text>
          <Surface colors={colors} style={styles.infoCard}>
            {order.clientName ? (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Одержувач:</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{order.clientName}</Text>
              </View>
            ) : null}

            {order.phone ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Телефон:</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{order.phone}</Text>
              </View>
            ) : null}

            {order.email ? (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Email:</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{order.email}</Text>
              </View>
            ) : null}

            {order.deliveryMethod ? (
              <View style={styles.infoRow}>
                <Ionicons name="cube-outline" size={16} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Доставка:</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{order.deliveryMethod}</Text>
              </View>
            ) : null}

            {order.city || order.address ? (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Адреса:</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                  {[order.city, order.address].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
          </Surface>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                ТОВАРИ · {order.items.length}
              </Text>
              <Surface colors={colors} style={styles.itemsCard}>
                {order.items.map((item: any, idx: number) => (
                  <View key={item.id || item.productId || idx}>
                    {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    <View style={styles.itemRow}>
                      <View style={[styles.itemIconBox, { backgroundColor: colors.primary + '12' }]}>
                        <Ionicons name="watch-outline" size={18} color={colors.primary} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                          {item.name}
                        </Text>
                        {(item.color || item.size) && (
                          <Text style={[styles.itemSku, { color: colors.mutedForeground }]}>
                            {[item.color, item.size].filter(Boolean).join(' · ')}
                          </Text>
                        )}
                        {item.sku ? (
                          <Text style={[styles.itemSku, { color: colors.mutedForeground }]}>
                            SKU: {item.sku}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>
                          {item.quantity} × {formatPrice(item.price)}
                        </Text>
                        <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                          {formatPrice(item.total || item.price * item.quantity)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Surface>
            </>
          )}

          {/* Total Breakdown */}
          <Surface colors={colors} style={styles.totalCard}>
            <View style={styles.totalBreakdown}>
              {order.totals && (
                <>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Вартість товарів</Text>
                    <Text style={[styles.totalRowValue, { color: colors.foreground }]}>{formatPrice(order.totals.subtotal)}</Text>
                  </View>
                  {order.totals.discount > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Знижка</Text>
                      <Text style={{ color: '#22c55e', fontWeight: '700' }}>-{formatPrice(order.totals.discount)}</Text>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Доставка</Text>
                    <Text style={[styles.totalRowValue, { color: colors.foreground }]}>
                      {order.totals.delivery === 0 ? 'Безкоштовно' : formatPrice(order.totals.delivery)}
                    </Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 6 }]} />
                </>
              )}
              <View style={styles.totalRow}>
                <Text style={[styles.mainTotalLabel, { color: colors.foreground }]}>Сума замовлення</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  {formatPrice(order.total || order.totals?.total || 0)}
                </Text>
              </View>
            </View>
          </Surface>

          {/* Back button */}
          <Pressable
            onPress={() => router.replace('/orders')}
            style={[styles.backBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back-outline" size={16} color={colors.foreground} />
            <Text style={[styles.backBtnText, { color: colors.foreground }]}>
              До списку замовлень
            </Text>
          </Pressable>
        </ScrollView>
      )}
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
    gap: 8,
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  hint: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 320 },
  content: { padding: 16, gap: 12 },

  statusCard: { padding: 18, gap: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 13, fontWeight: '700' },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  paymentBadgeText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 13 },

  infoCard: { padding: 14, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, width: 80 },
  infoValue: { fontSize: 13, fontWeight: '600', flex: 1 },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: 4, marginLeft: 2 },
  itemsCard: { padding: 14, gap: 0 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  itemIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  itemSku: { fontSize: 12 },
  itemQty: { fontSize: 12 },
  itemPrice: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: -14 },

  totalCard: { padding: 18 },
  totalBreakdown: { gap: 6 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 13 },
  totalRowValue: { fontSize: 13, fontWeight: '600' },
  mainTotalLabel: { fontSize: 15, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '700' },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  backBtnText: { fontSize: 15, fontWeight: '700' },
});
