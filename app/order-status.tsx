import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';

export default function OrderStatusScreen() {
  const router = useRouter();
  const { clearCart } = useApp();
  const params = useLocalSearchParams<{
    status?: string;
    orderId?: string;
    amount?: string;
    paymentMethod?: string;
  }>();

  const status = (params.status as 'success' | 'error' | 'pending') || 'success';
  const orderId = params.orderId || 'ST-1042';
  const rawAmount = params.amount || '0';
  const paymentMethod = params.paymentMethod || 'Онлайн-оплата';

  const formattedAmount =
    Number(rawAmount) > 0
      ? `${Number(rawAmount).toLocaleString('uk-UA')} ₴`
      : typeof rawAmount === 'string' && rawAmount.includes('₴')
      ? rawAmount
      : 'Оплачено';

  // Clear cart upon successful order creation/payment
  useEffect(() => {
    if (status === 'success') {
      clearCart();
    }
  }, [status, clearCart]);

  const handleSupportCall = () => {
    void Linking.openURL('tel:+380671022571');
  };

  const isSuccess = status === 'success';
  const isPending = status === 'pending';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isSuccess ? 'Статус замовлення' : isPending ? 'Обробка замовлення' : 'Помилка оформлення'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSuccess ? (
          /* SUCCESS STATE */
          <View style={styles.card}>
            <View style={[styles.iconCircle, styles.successIconCircle]}>
              <Ionicons name="checkmark-circle" size={54} color="#30D158" />
            </View>

            <Text style={styles.statusTitle}>Дякуємо! Замовлення №{orderId} прийнято!</Text>
            <Text style={styles.statusDescription}>
              Ваше замовлення зареєстровано в системі та передано на збірку.
            </Text>

            {/* Details Card */}
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Номер замовлення:</Text>
                <Text style={styles.detailValue}>№{orderId}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Сума до сплати:</Text>
                <Text style={styles.detailValueHighlight}>{formattedAmount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Спосіб оплати:</Text>
                <Text style={styles.detailValue}>{paymentMethod}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Доставка:</Text>
                <Text style={styles.detailValue}>Нова Пошта</Text>
              </View>

              <Pressable style={styles.detailRowPressable} onPress={handleSupportCall}>
                <Text style={styles.detailLabel}>Служба підтримки:</Text>
                <Text style={styles.detailPhoneText}>067 102-25-71</Text>
              </Pressable>
            </View>

            {/* Push Notification Banner */}
            <View style={styles.pushNotificationBanner}>
              <Ionicons name="notifications-outline" size={20} color="#FF6400" />
              <Text style={styles.pushNotificationText}>
                Ми надішлемо вам Push-сповіщення, як тільки посилка буде відправлена!
              </Text>
            </View>

            {/* Success Action Buttons */}
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => router.replace('/(tabs)')}
            >
              <Ionicons name="home-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>На головну</Text>
            </Pressable>
          </View>
        ) : isPending ? (
          /* PENDING STATE */
          <View style={styles.card}>
            <View style={[styles.iconCircle, styles.pendingIconCircle]}>
              <Ionicons name="time-outline" size={54} color="#FF9500" />
            </View>

            <Text style={styles.statusTitle}>Обробка замовлення №{orderId}...</Text>
            <Text style={styles.statusDescription}>
              Замовлення обробляється менеджером. Зачекайте сповіщення.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => router.replace('/(tabs)')}
            >
              <Ionicons name="home-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>На головну</Text>
            </Pressable>
          </View>
        ) : (
          /* ERROR STATE */
          <View style={styles.card}>
            <View style={[styles.iconCircle, styles.errorIconCircle]}>
              <Ionicons name="close-circle" size={54} color="#FF453A" />
            </View>

            <Text style={styles.statusTitle}>Не вдалося оформити замовлення</Text>
            <Text style={styles.statusDescription}>
              Сталася помилка під час обробки транзакції. Спробуйте ще раз або зверніться до підтримки.
            </Text>

            {/* Error Action Buttons */}
            <Pressable
              style={({ pressed }) => [styles.primaryButton, styles.errorPrimaryButton, pressed && styles.pressed]}
              onPress={() => router.replace('/(tabs)/cart')}
            >
              <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Повернутися до кошика</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              onPress={handleSupportCall}
            >
              <Ionicons name="call-outline" size={18} color="#FF6400" />
              <Text style={styles.secondaryButtonText}>Зателефонувати в підтримку (+380671022571)</Text>
            </Pressable>
          </View>
        )}

        {/* Footer Note */}
        <View style={styles.footerNoteContainer}>
          <Text style={styles.footerNote}>
            © 2026 GARMIN Sport Time. Всі права захищено.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F22',
    backgroundColor: '#0B0B0C',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 32,
  },
  card: {
    backgroundColor: '#161618',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  successIconCircle: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  pendingIconCircle: {
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  errorIconCircle: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusDescription: {
    color: '#C7C7CC',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#222225',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  detailValueHighlight: {
    color: '#30D158',
    fontSize: 14,
    fontWeight: '700',
  },
  detailPhoneText: {
    color: '#FF6400',
    fontSize: 13,
    fontWeight: '700',
  },
  pushNotificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 100, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 0, 0.3)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  pushNotificationText: {
    color: '#FF6400',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6400',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  errorPrimaryButton: {
    backgroundColor: '#FF453A',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#222225',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  secondaryButtonText: {
    color: '#FF6400',
    fontSize: 13,
    fontWeight: '700',
  },
  footerNoteContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerNote: {
    color: '#636366',
    fontSize: 12,
    textAlign: 'center',
  },
});
