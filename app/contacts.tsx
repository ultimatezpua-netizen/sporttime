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

export default function ContactsScreen() {
  const router = useRouter();

  const handleCall = () => {
    void Linking.openURL('tel:+380671022571');
  };

  const handleViber = () => {
    void Linking.openURL('viber://chat?number=%2B380671022571');
  };

  const handleWhatsApp = () => {
    void Linking.openURL('https://wa.me/380671022571');
  };

  const handleTelegram = () => {
    void Linking.openURL('https://t.me/+380671022571');
  };

  const handleMapRoute = () => {
    void Linking.openURL('https://www.google.com/maps/search/?api=1&query=47.8414828,35.1112069');
  };

  const handleEmailPress = () => {
    void Linking.openURL('mailto:support@sporttime.ua');
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
          Контакти та реквізити
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
            <Ionicons name="business" size={32} color="#FF6400" />
          </View>
          <Text style={styles.bannerTitle}>GARMIN Sport Time</Text>
          <Text style={styles.bannerSubtitle}>
            Офіційний інтернет-магазин смарт-годинників та спортивних пристроїв Garmin в Україні
          </Text>
          <Text style={styles.updatedDate}>Служба підтримки клієнтів • м. Запоріжжя</Text>
        </View>

        {/* Quick Action Buttons Row */}
        <View style={styles.actionButtonsGrid}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.callBtn, pressed && styles.pressed]}
            onPress={handleCall}
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Дзвінок</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.telegramBtn, pressed && styles.pressed]}
            onPress={handleTelegram}
          >
            <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Telegram</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.viberBtn, pressed && styles.pressed]}
            onPress={handleViber}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Viber</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.whatsappBtn, pressed && styles.pressed]}
            onPress={handleWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>WhatsApp</Text>
          </Pressable>
        </View>

        {/* Google Maps Route Button */}
        <Pressable
          style={({ pressed }) => [styles.mapRouteButton, pressed && styles.pressed]}
          onPress={handleMapRoute}
        >
          <Ionicons name="map-outline" size={20} color="#FF6400" />
          <Text style={styles.mapRouteButtonText}>Прокласти маршрут / Карта (Google Maps)</Text>
          <Ionicons name="open-outline" size={16} color="#8E8E93" />
        </Pressable>

        {/* Section 1: Support & Sales */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="headset-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>1. Служба підтримки та продажів</Text>
          </View>
          
          <View style={styles.detailsList}>
            <Pressable style={styles.detailRowPressable} onPress={handleCall}>
              <View style={styles.detailIconBox}>
                <Ionicons name="call-outline" size={18} color="#FF6400" />
              </View>
              <View style={styles.detailTextGroup}>
                <Text style={styles.detailLabel}>Телефон гарячої лінії та менеджерів:</Text>
                <Text style={styles.detailValueHighlight}>067 102-25-71 (+380 67 102 25 71)</Text>
              </View>
            </Pressable>

            <Pressable style={styles.detailRowPressable} onPress={handleTelegram}>
              <View style={styles.detailIconBox}>
                <Ionicons name="paper-plane-outline" size={18} color="#2AABEE" />
              </View>
              <View style={styles.detailTextGroup}>
                <Text style={styles.detailLabel}>Telegram месенджер:</Text>
                <Text style={styles.detailValueHighlight}>t.me/+380671022571</Text>
              </View>
            </Pressable>

            <Pressable style={styles.detailRowPressable} onPress={handleViber}>
              <View style={styles.detailIconBox}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#7360F2" />
              </View>
              <View style={styles.detailTextGroup}>
                <Text style={styles.detailLabel}>Viber месенджер:</Text>
                <Text style={styles.detailValueHighlight}>viber://chat?number=%2B380671022571</Text>
              </View>
            </Pressable>

            <Pressable style={styles.detailRowPressable} onPress={handleWhatsApp}>
              <View style={styles.detailIconBox}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              </View>
              <View style={styles.detailTextGroup}>
                <Text style={styles.detailLabel}>WhatsApp месенджер:</Text>
                <Text style={styles.detailValueHighlight}>wa.me/380671022571</Text>
              </View>
            </Pressable>

            <Pressable style={styles.detailRowPressable} onPress={handleEmailPress}>
              <View style={styles.detailIconBox}>
                <Ionicons name="mail-outline" size={18} color="#FF6400" />
              </View>
              <View style={styles.detailTextGroup}>
                <Text style={styles.detailLabel}>Email клієнтської підтримки:</Text>
                <Text style={styles.detailValueHighlight}>support@sporttime.ua</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Section 2: Working Hours */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>2. Графік роботи</Text>
          </View>

          <View style={styles.scheduleList}>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleDays}>Понеділок – П'ятниця:</Text>
              <Text style={styles.scheduleHours}>09:00 – 17:00</Text>
            </View>

            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleDays}>Субота – Неділя:</Text>
              <Text style={styles.scheduleOff}>Вихідний</Text>
            </View>

            <View style={styles.scheduleRowHighlight}>
              <Ionicons name="infinite" size={18} color="#FF6400" />
              <Text style={styles.scheduleHighlightText}>
                Прийом онлайн-замовлень через застосунок: 24/7 (цілодобово)
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Official Business Requisites */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>3. Офіційні реквізити Продавця (для еквайрингу)</Text>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Суб'єкт господарювання:</Text>
              <Text style={styles.detailValue}>ФОП / ТОВ «СПОРТ ТАЙМ УКРАЇНА»</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Код ЄДРПОУ / ІПН:</Text>
              <Text style={styles.detailValue}>1234567890</Text>
            </View>

            <Pressable style={styles.detailRowPressable} onPress={handleMapRoute}>
              <View style={styles.detailIconBox}>
                <Ionicons name="location-outline" size={18} color="#FF6400" />
              </View>
              <View style={styles.detailTextGroup}>
                <Text style={styles.detailLabel}>Фізична адреса (шоурум / склад):</Text>
                <Text style={styles.detailValueHighlight}>м. Запоріжжя, вул. Нижньодніпровська, 21</Text>
              </View>
            </Pressable>
          </View>
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
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  callBtn: {
    backgroundColor: '#FF6400',
  },
  telegramBtn: {
    backgroundColor: '#2AABEE',
  },
  viberBtn: {
    backgroundColor: '#7360F2',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mapRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#161618',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 0, 0.4)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  mapRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
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
  detailsList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'column',
    gap: 4,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#222225',
  },
  detailRowPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222225',
  },
  detailIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 100, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextGroup: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  detailValueHighlight: {
    color: '#FF6400',
    fontSize: 14,
    fontWeight: '700',
  },
  scheduleList: {
    gap: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222225',
  },
  scheduleDays: {
    color: '#C7C7CC',
    fontSize: 13,
    fontWeight: '500',
  },
  scheduleHours: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleOff: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleRowHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 100, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 0, 0.25)',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  scheduleHighlightText: {
    color: '#FF6400',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
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
