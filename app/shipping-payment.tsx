import React from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ShippingPaymentScreen() {
  const router = useRouter();

  const handleMapRoute = () => {
    void Linking.openURL('https://www.google.com/maps/search/?api=1&query=47.8414828,35.1112069');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.canGoBack() ? router.back() : router.push('/')}
          hitSlop={12}
          accessibilityLabel="Назад"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Оплата та доставка
        </Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section */}
        <View style={styles.bannerCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="car-outline" size={34} color="#FF6400" />
          </View>
          <Text style={styles.bannerTitle}>Оплата та доставка</Text>
          <Text style={styles.bannerSubtitle}>
            Швидка доставка по Україні та безпечні методи оплати пристроїв Garmin
          </Text>
          <Text style={styles.updatedDate}>GARMIN Sport Time • Офіційні стандарти сервісу</Text>
        </View>

        {/* Section 1: Shipping Methods */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>1. Способи доставки</Text>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.deliveryOptionBox}>
              <View style={styles.optionHeader}>
                <Ionicons name="paper-plane" size={18} color="#FF6400" />
                <Text style={styles.optionTitle}>Нова Пошта (по всій Україні)</Text>
              </View>
              <Text style={styles.optionText}>
                Доставка у зручне відділення, поштомат або кур'єром за вказаною адресою.
              </Text>
              <View style={styles.highlightBadge}>
                <Ionicons name="flash-outline" size={14} color="#FF6400" />
                <Text style={styles.highlightBadgeText}>
                  Відправка замовлень, оформлених до 15:00 — в той самий день!
                </Text>
              </View>
            </View>

            <Pressable style={styles.deliveryOptionBoxPressable} onPress={handleMapRoute}>
              <View style={styles.optionHeader}>
                <Ionicons name="storefront-outline" size={18} color="#FF6400" />
                <Text style={styles.optionTitle}>Самовивіз із шоуруму / пункту видачі</Text>
              </View>
              <Text style={styles.optionText}>
                м. Запоріжжя, вул. Нижньодніпровська, 21 (Пн – Пт: 09:00 – 17:00).
              </Text>
              <View style={styles.linkMapRow}>
                <Text style={styles.linkMapText}>Показати на картах Google Maps</Text>
                <Ionicons name="open-outline" size={14} color="#FF6400" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Section 2: Payment Methods */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>2. Способи оплати</Text>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentIconBox}>
                <Ionicons name="phone-portrait-outline" size={18} color="#30D158" />
              </View>
              <View style={styles.paymentTextGroup}>
                <Text style={styles.paymentTitle}>Онлайн-оплата карткою (без комісії)</Text>
                <Text style={styles.paymentDesc}>
                  MonoPay, LiqPay, WayForPay (Visa, Mastercard, Apple Pay, Google Pay).
                </Text>
              </View>
            </View>

            <View style={styles.paymentRow}>
              <View style={styles.paymentIconBox}>
                <Ionicons name="wallet-outline" size={18} color="#FF9500" />
              </View>
              <View style={styles.paymentTextGroup}>
                <Text style={styles.paymentTitle}>Післяплата (накладений платіж)</Text>
                <Text style={styles.paymentDesc}>
                  Оплата готівкою або карткою у відділенні «Нова Пошта» після огляду товару.
                </Text>
              </View>
            </View>

            <View style={styles.paymentRow}>
              <View style={styles.paymentIconBox}>
                <Ionicons name="pie-chart-outline" size={18} color="#5E5CE6" />
              </View>
              <View style={styles.paymentTextGroup}>
                <Text style={styles.paymentTitle}>Оплата частинами / Розстрочка</Text>
                <Text style={styles.paymentDesc}>
                  Вигідна безвідсоткова розстрочка від Monobank та ПриватБанк.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 3: Parcel Inspection Recommendation */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>3. Перевірка при отриманні</Text>
          </View>
          <Text style={styles.sectionText}>
            Рекомендуємо Покупцю перевіряти цілісність фірмової упаковки Garmin, відсутність механічних пошкоджень, наявність офіційного гарантійного талона та повну комплектацію безпосередньо у присутності співробітника поштової служби.
          </Text>
        </View>

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F22',
    backgroundColor: '#0B0B0C',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#161618',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  pressed: {
    opacity: 0.75,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  headerRightPlaceholder: {
    width: 38,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 32,
  },
  bannerCard: {
    backgroundColor: '#161618',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 100, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 0, 0.25)',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  updatedDate: {
    color: '#FF6400',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#161618',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  sectionText: {
    color: '#C7C7CC',
    fontSize: 13,
    lineHeight: 20,
  },
  detailsList: {
    gap: 12,
  },
  deliveryOptionBox: {
    backgroundColor: '#222225',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  deliveryOptionBoxPressable: {
    backgroundColor: '#222225',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  optionText: {
    color: '#C7C7CC',
    fontSize: 13,
    lineHeight: 18,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 100, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 0, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  highlightBadgeText: {
    color: '#FF6400',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  linkMapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  linkMapText: {
    color: '#FF6400',
    fontSize: 12,
    fontWeight: '700',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222225',
  },
  paymentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222225',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  paymentTextGroup: {
    flex: 1,
    gap: 4,
  },
  paymentTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  paymentDesc: {
    color: '#8E8E93',
    fontSize: 12,
    lineHeight: 17,
  },
  footerNoteContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerNote: {
    color: '#636366',
    fontSize: 12,
    textAlign: 'center',
  },
});
