import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { formatPrice, getProductById } from '@/data/products';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeParseJSON, safeStringifyJSON } from '@/utils/safeStorage';
import { createOrder, OrderApiError } from '@/services/orderApi';
import { NovaPoshtaSelector } from '@/components/NovaPoshtaSelector';
import { usePushNotifications } from '@/hooks/usePushNotifications';

type Delivery = 'nova_poshta' | 'courier';

export type PaymentMethodType = 'CASH_ON_DELIVERY' | 'ONLINE_PAYMENT';

export interface PaymentMethodConfig {
  id: PaymentMethodType;
  title: string;
  subtitle: string;
  icon: string;
  isActive: boolean;
}

export const PAYMENT_METHODS_CONFIG: PaymentMethodConfig[] = [
  {
    id: 'CASH_ON_DELIVERY',
    title: 'Оплата при отриманні (Нова Пошта)',
    subtitle: 'Оплата готівкою або карткою у відділенні при отриманні',
    icon: 'cash-outline',
    isActive: true,
  },
  {
    id: 'ONLINE_PAYMENT',
    title: 'Оплата карткою онлайн',
    subtitle: 'Visa, Mastercard / Apple Pay',
    icon: 'card-outline',
    isActive: false,
  },
];

const UKRAINE_CITIES = [
  'Київ',
  'Харків',
  'Одеса',
  'Дніпро',
  'Запоріжжя',
  'Львів',
  'Кривий Ріг',
  'Миколаїв',
  'Вінниця',
  'Полтава',
  'Чернігів',
  'Черкаси',
  'Житомир',
  'Суми',
  'Хмельницький',
  'Чернівці',
  'Рівне',
  'Кропивницький',
  'Івано-Франківськ',
  'Кременчук',
  'Тернопіль',
  'Луцьк',
  'Біла Церква',
  'Ужгород',
];

const POPULAR_CITIES = ['Київ', 'Львів', 'Одеса', 'Дніпро', 'Харків'];

function formatUkrainePhone(text: string): string {
  const digits = text.replace(/\D/g, '');
  let rest = digits;
  if (rest.startsWith('380')) {
    rest = rest.slice(3);
  } else if (rest.startsWith('0')) {
    rest = rest.slice(1);
  }
  rest = rest.slice(0, 9);

  if (!rest) return '+380';

  let formatted = '+380';
  if (rest.length > 0) formatted += ` (${rest.slice(0, 2)}`;
  if (rest.length >= 2) formatted += `) ${rest.slice(2, 5)}`;
  if (rest.length >= 5) formatted += `-${rest.slice(5, 7)}`;
  if (rest.length >= 7) formatted += `-${rest.slice(7, 9)}`;
  return formatted;
}

export default function CheckoutScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart, promoCode, promoDiscount, setCustomerPhone, setLastOrder } = useApp();
  const { expoPushToken } = usePushNotifications();

  // Active payment methods configuration
  const activePaymentMethods = PAYMENT_METHODS_CONFIG.filter(m => m.isActive);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>(
    activePaymentMethods[0]?.id ?? 'CASH_ON_DELIVERY',
  );

  const [delivery, setDelivery] = useState<Delivery>('nova_poshta');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 16 : insets.bottom + 16;

  const cartItems = cart.map(ci => ({ ...ci, product: getProductById(ci.productId) })).filter(ci => !!ci.product);
  const subtotal = cartItems.reduce((sum, ci) => sum + (ci.product?.price ?? 0) * ci.quantity, 0);
  const discount = Math.floor(subtotal * promoDiscount);
  const deliveryCost = delivery === 'courier' ? 199 : subtotal > 30000 ? 0 : 149;
  const total = subtotal - discount + deliveryCost;

  const filteredCities = city.trim()
    ? UKRAINE_CITIES.filter(c => c.toLowerCase().includes(city.trim().toLowerCase()))
    : [];

  const handlePhoneChange = (text: string) => {
    setPhone(formatUkrainePhone(text));
  };

  const handleSubmit = async () => {
    // 1. Name validation
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Помилка', 'Будь ласка, введіть ваше ім\'я та прізвище');
      return;
    }

    // 2. Phone validation (+380 and 9 digits)
    const rawPhoneDigits = phone.replace(/\D/g, '');
    if (rawPhoneDigits.length !== 12 || !rawPhoneDigits.startsWith('380')) {
      Alert.alert('Помилка', 'Введіть коректний номер телефону України (+380 XX XXX XX XX)');
      return;
    }
    const cleanPhone = `+${rawPhoneDigits}`;

    // 3. Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      Alert.alert('Помилка', 'Будь ласка, введіть діючу електронну пошту (наприклад, name@example.com)');
      return;
    }

    // 4. City validation
    if (!city.trim()) {
      Alert.alert('Помилка', 'Будь ласка, вкажіть місто доставки');
      return;
    }

    // 5. Address / Department validation
    if (!address.trim()) {
      Alert.alert(
        'Помилка',
        delivery === 'nova_poshta'
          ? 'Будь ласка, вкажіть номер або адресу відділення Нової Пошти'
          : 'Будь ласка, вкажіть адресу доставки',
      );
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Кошик порожній', 'Додайте товари і спробуйте знову');
      return;
    }

    setLoading(true);

    try {
      if (cleanPhone) {
        void setCustomerPhone(cleanPhone);
        try {
          await Promise.all([
            AsyncStorage.setItem('user_phone', cleanPhone),
            AsyncStorage.setItem('customer_phone', cleanPhone),
            AsyncStorage.setItem('auth_phone', cleanPhone),
            AsyncStorage.setItem('is_authenticated', 'true'),
          ]);
        } catch (storageErr) {
          console.warn('AsyncStorage phone save warning:', storageErr);
        }
      }

      // Scalable payment method handling via switch/case
      switch (selectedPaymentMethod) {
        case 'CASH_ON_DELIVERY': {
          const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const now = new Date();
          const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const isoDate = now.toISOString();

          const customerNameStr = name.trim();
          const deliveryMethodStr = delivery === 'nova_poshta' ? 'Нова Пошта' : 'Кур\'єр';
          const deliveryFullStr = `${deliveryMethodStr} (${address.trim()})`;
          const paymentMethodStr = selectedPaymentMethod === 'CASH_ON_DELIVERY' ? 'Накладний платіж' : 'Онлайн карткою';
          const formattedProductsStr = cartItems
            .map(ci => `${ci.product?.name ?? 'Товар'} × ${ci.quantity} (${formatPrice((ci.product?.price ?? 0) * ci.quantity)})`)
            .join('; ');

          const payload = {
            // Strict Google Sheets Columns A -> K Order
            createdAt: formattedDate || isoDate,
            orderNumber: orderId,
            customerName: customerNameStr,
            phone: cleanPhone,
            email: email.trim(),
            city: city.trim(),
            delivery: deliveryFullStr,
            payment: paymentMethodStr,
            products: formattedProductsStr,
            total,
            status: 'Нове',
            pushToken: expoPushToken || undefined,

            // Structured fallback objects
            orderId,
            customer: {
              name: customerNameStr,
              phone: cleanPhone,
              email: email.trim(),
              city: city.trim(),
            },
            deliveryDetails: {
              method: deliveryMethodStr,
              address: address.trim(),
            },
            paymentDetails: {
              method: paymentMethodStr,
            },
            items: cartItems.map(ci => ({
              productId: ci.productId || '',
              name: ci.product?.name ?? '',
              quantity: ci.quantity || 1,
              price: ci.product?.price ?? 0,
              color: ci.color || '',
              size: ci.size || '',
              total: (ci.product?.price ?? 0) * (ci.quantity || 1),
            })),
            totals: { subtotal, discount, delivery: deliveryCost, total },
            promoCode: promoCode || undefined,
          };

          console.log("Sending order payload:", payload);

          // Submit order to Google Apps Script / Backend (with 8s timeout inside orderApi)
          const result = await createOrder(payload);

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);

          // Save local record only after successful server creation
          const safeOrderId = String(result?.orderId || orderId);
          const safeOrderNum = String(result?.orderNumber || orderId);

          const newOrderRecord = {
            id: safeOrderId,
            orderId: safeOrderId,
            orderNumber: safeOrderNum,
            status: 'Прийнято в обробку',
            createdAt: new Date().toISOString(),
            clientName: customerNameStr,
            phone: cleanPhone,
            email: email.trim(),
            city: city.trim(),
            address: address.trim(),
            deliveryMethod: deliveryMethodStr,
            paymentMethod: paymentMethodStr,
            items: cartItems.map((ci, idx) => ({
              id: `${ci.productId || 'item'}-${idx}`,
              productId: ci.productId || '',
              name: ci.product?.name ?? '',
              quantity: ci.quantity || 1,
              price: ci.product?.price ?? 0,
              color: ci.color || '',
              size: ci.size || '',
              total: (ci.product?.price ?? 0) * (ci.quantity || 1),
            })),
            totals: { subtotal, discount, delivery: deliveryCost, total },
            total,
          };

          try {
            setLastOrder({
              orderId: safeOrderId,
              orderNumber: safeOrderNum,
              items: cartItems.map(ci => ({
                productId: ci.productId || '',
                name: ci.product?.name ?? '',
                quantity: ci.quantity || 1,
                price: ci.product?.price ?? 0,
                color: ci.color || '',
                size: ci.size || '',
              })),
              totals: { subtotal, discount, delivery: deliveryCost, total },
              paymentMethod: 'cash',
              deliveryMethod: delivery,
            });
          } catch (lastOrderErr) {
            console.warn('Failed to setLastOrder state:', lastOrderErr);
          }

          try {
            const [raw1, raw2] = await Promise.all([
              AsyncStorage.getItem('user_orders'),
              AsyncStorage.getItem('@sporttime/orders'),
            ]);
            const existingRaw = raw1 || raw2;
            let existingOrders: any[] = [];
            if (existingRaw) {
              const parsed = safeParseJSON<any[]>(existingRaw, []);
              if (Array.isArray(parsed)) {
                existingOrders = parsed.filter((item: any) => item && typeof item === 'object');
              }
            }
            const updatedOrders = [newOrderRecord, ...existingOrders];
            const validJson = safeStringifyJSON(updatedOrders, '[]');
            await Promise.all([
              AsyncStorage.setItem('user_orders', validJson),
              AsyncStorage.setItem('@sporttime/orders', validJson),
            ]);
          } catch (storageErr) {
            console.warn('Failed to set order copy in AsyncStorage:', storageErr);
          }

          if (result?.paymentUrl) {
            try {
              await Linking.openURL(result.paymentUrl);
            } catch {
              Alert.alert('Оплата', 'Не вдалося відкрити сторінку оплати. Замовлення створено.');
            }
          }

          router.replace({
            pathname: '/order-status',
            params: {
              status: 'success',
              orderId: safeOrderNum || safeOrderId,
              amount: String(total),
              paymentMethod: paymentMethodStr,
            },
          });
          break;
        }

        case 'ONLINE_PAYMENT': {
          Alert.alert('Оплата карткою', 'Оплата карткою буде доступна незабаром.');
          break;
        }

        default: {
          Alert.alert('Помилка', 'Обрано непідтримуваний спосіб оплати.');
          break;
        }
      }
    } catch (err: any) {
      console.error('Order checkout error:', err);
      const message = err?.message || 'Помилка відправки замовлення. Будь ласка, спробуйте ще раз.';
      Alert.alert(
        'Помилка оформлення замовлення',
        message,
        [
          { text: 'Скасувати', style: 'cancel' },
          { text: 'Спробувати ще раз', onPress: handleSubmit },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              if (router.canGoBack()) { router.back(); } else { router.replace('/'); }
            } else {
              router.replace('/');
            }
          }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Оформлення замовлення</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 80 }]} showsVerticalScrollIndicator={false}>
        {/* Contacts */}
        <Section title="Контактні дані" colors={colors}>
          <FormField
            label="Ім'я та прізвище *"
            value={name}
            onChangeText={setName}
            placeholder="Олександр Петренко"
            colors={colors}
          />
          <FormField
            label="Номер телефону *"
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="+380 (XX) XXX-XX-XX"
            keyboardType="phone-pad"
            colors={colors}
          />
          <FormField
            label="Електронна пошта *"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            keyboardType="email-address"
            colors={colors}
          />
        </Section>

        {/* Delivery via NovaPoshtaSelector Widget */}
        <NovaPoshtaSelector
          initialCity={city || 'Запоріжжя'}
          initialDeliveryType={delivery === 'courier' ? 'courier' : 'warehouse'}
          initialWarehouseOrAddress={address || 'Відділення №21 (до 30 кг): вул. Нижньодніпровська, 21'}
          onChange={(data) => {
            setCity(data.city);
            setDelivery(data.deliveryType === 'courier' ? 'courier' : 'nova_poshta');
            setAddress(data.warehouseOrAddress);
          }}
        />

        {/* Scalable Dynamic Payment Section */}
        <Section title="Спосіб оплати" colors={colors}>
          {activePaymentMethods.map(method => (
            <PaymentOption
              key={method.id}
              id={method.id}
              label={method.title}
              subtitle={method.subtitle}
              icon={method.icon}
              selected={selectedPaymentMethod === method.id}
              onPress={() => setSelectedPaymentMethod(method.id)}
              colors={colors}
            />
          ))}
        </Section>

        {/* Summary */}
        <Section title="Ваше замовлення" colors={colors}>
          {cartItems.map(ci => (
            <View key={ci.productId} style={styles.orderItem}>
              <Text style={[styles.orderItemName, { color: colors.foreground }]} numberOfLines={1}>
                {ci.product?.name} × {ci.quantity}
              </Text>
              <Text style={[styles.orderItemPrice, { color: colors.foreground }]}>
                {formatPrice((ci.product?.price ?? 0) * ci.quantity)}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {discount > 0 && (
            <View style={styles.orderItem}>
              <Text style={[styles.orderItemName, { color: colors.mutedForeground }]}>Знижка за промокодом</Text>
              <Text style={{ color: '#22C55E', fontWeight: '700' as const }}>-{formatPrice(discount)}</Text>
            </View>
          )}
          <View style={styles.orderItem}>
            <Text style={[styles.orderItemName, { color: colors.mutedForeground }]}>Доставка</Text>
            <Text style={[styles.orderItemPrice, { color: colors.foreground }]}>
              {deliveryCost === 0 ? 'Безкоштовно' : formatPrice(deliveryCost)}
            </Text>
          </View>
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>До сплати</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatPrice(total)}</Text>
          </View>
        </Section>
      </ScrollView>

      {/* Confirm button */}
      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: bottomPad + 10, backgroundColor: colors.background }]}>
        <Pressable
          disabled={loading || name.trim().length < 2 || phone.replace(/\D/g, '').length !== 12 || !city.trim() || !address.trim()}
          style={({ pressed }) => [
            styles.confirmBtn,
            {
              backgroundColor: loading || name.trim().length < 2 || phone.replace(/\D/g, '').length !== 12 || !city.trim() || !address.trim() ? '#3A3A3C' : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleSubmit}
        >
          {loading ? (
            <Text style={styles.confirmText}>Оформлення…</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.confirmText}>
                {name.trim().length < 2
                  ? 'Введіть ім\'я та прізвище'
                  : phone.replace(/\D/g, '').length !== 12
                  ? 'Введіть номер телефону'
                  : !city.trim() || !address.trim()
                  ? 'Оберіть місто та відділення Нової Пошти'
                  : `Підтвердити замовлення · ${formatPrice(total)}`}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function FormField({ label, value, onChangeText, onFocus, placeholder, keyboardType, colors }: any) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}

function DeliveryOption({ label, subtitle, icon, price, selected, onPress, colors }: any) {
  return (
    <Pressable
      style={[styles.option, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '15' : 'transparent' }]}
      onPress={onPress}
    >
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
        {selected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
      </View>
      <Ionicons name={icon} size={20} color={selected ? colors.primary : colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.optionSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <Text style={[styles.optionPrice, { color: colors.foreground }]}>{price}</Text>
    </Pressable>
  );
}

function PaymentOption({ label, subtitle, icon, selected, onPress, colors }: any) {
  return (
    <Pressable
      style={[styles.option, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '15' : 'transparent' }]}
      onPress={onPress}
    >
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
        {selected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
      </View>
      <Ionicons name={icon as any} size={20} color={selected ? colors.primary : colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.optionSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700' as const, textAlign: 'center' as const },
  content: { padding: 16, gap: 16 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  field: { paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700' as const },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  citySection: { gap: 6 },
  quickCitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  cityChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  suggestions: {
    marginHorizontal: 14,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: -2,
    marginBottom: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  suggestionText: { fontSize: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderTopWidth: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionLabel: { fontSize: 14, fontWeight: '700' as const },
  optionSubtitle: { fontSize: 12, marginTop: 2 },
  optionPrice: { fontSize: 14, fontWeight: '700' as const },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  orderItemName: { fontSize: 13, flex: 1, marginRight: 8 },
  orderItemPrice: { fontSize: 13, fontWeight: '700' as const },
  divider: { height: 1, marginVertical: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderTopWidth: 1 },
  totalLabel: { fontSize: 16, fontWeight: '700' as const },
  totalValue: { fontSize: 20, fontWeight: '700' as const },
  footer: { padding: 16, borderTopWidth: 1 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' as const },
});
