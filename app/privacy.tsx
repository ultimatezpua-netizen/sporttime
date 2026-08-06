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

export default function PrivacyScreen() {
  const router = useRouter();

  const handleEmailPress = () => {
    void Linking.openURL('mailto:privacy@sporttime.ua');
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
          Політика конфіденційності
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
            <Ionicons name="shield-checkmark" size={32} color="#FF6400" />
          </View>
          <Text style={styles.bannerTitle}>GARMIN Sport Time</Text>
          <Text style={styles.bannerSubtitle}>
            Захист ваших персональних даних є нашим беззаперечним пріоритетом.
          </Text>
          <Text style={styles.updatedDate}>Останнє оновлення: 5 серпня 2026 року</Text>
        </View>

        {/* Section 1 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>1. Загальні положення</Text>
          </View>
          <Text style={styles.sectionText}>
            Взаємодія з застосунком та сайтом GARMIN Sport Time регулюється Законом України «Про захист персональних даних». Користуючись нашим сервісом, ви погоджуєтеся з умовами цієї Політики конфіденційності та даєте згоду на обробку персональних даних у зазначених межах.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>2. Які дані ми збираємо</Text>
          </View>
          <Text style={styles.sectionText}>
            Для забезпечення якісного обслуговування ми збираємо такі дані:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Прізвище, ім'я та по батькові (ПІБ);</Text>
            <Text style={styles.bulletItem}>• Контактний номер телефону та e-mail;</Text>
            <Text style={styles.bulletItem}>• Адресу доставки (зокрема номер відділення або поштомату ТОВ «Нова Пошта»);</Text>
            <Text style={styles.bulletItem}>• Історію замовлень та переглянутих товарів для формування індивідуальних пропозицій.</Text>
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>3. Мета обробки даних</Text>
          </View>
          <Text style={styles.sectionText}>
            Зібрана інформація використовується виключно для таких цілей:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Швидке оформлення, обробка та доставка ваших замовлень;</Text>
            <Text style={styles.bulletItem}>• Надання офіційного гарантійного та сервісного обслуговування годинників Garmin;</Text>
            <Text style={styles.bulletItem}>• Надсилання push-сповіщень та SMS про статус доставки та стан сервісного запиту.</Text>
          </View>
        </View>

        {/* Section 4 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="share-social-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>4. Передача даних третім особам</Text>
          </View>
          <Text style={styles.sectionText}>
            Ми не продаємо та не передаємо персональні дані стороннім організаціям у маркетингових цілях. Передача даних здійснюється виключно авторизованим партнерам для виконання замовлення:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Логістичним операторам (ТОВ «Нова Пошта») для адресної доставки або відправки у відділення;</Text>
            <Text style={styles.bulletItem}>• Сертифікованим платіжним сервісам для безпечного проведення електронних транзакцій.</Text>
          </View>
        </View>

        {/* Section 5 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>5. Захист та видалення даних</Text>
          </View>
          <Text style={styles.sectionText}>
            Всі персональні дані зберігаються на захищених серверах із використанням сучасних протоколів шифрування (SSL/TLS). Користувач має право в будь-який момент відкликати згоду на обробку даних або надіслати запит на повне видалення свого облікового запису та історії замовлень.
          </Text>
        </View>

        {/* Section 6 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>6. Контакти</Text>
          </View>
          <Text style={styles.sectionText}>
            З будь-якими запитаннями, скаргами або пропозиціями щодо захисту персональних даних та видалення акаунта ви можете звернутися до нашої служби підтримки:
          </Text>

          <Pressable
            style={({ pressed }) => [styles.contactButton, pressed && styles.pressed]}
            onPress={handleEmailPress}
          >
            <Ionicons name="mail-unread-outline" size={18} color="#FF6400" />
            <Text style={styles.contactEmail}>privacy@sporttime.ua</Text>
          </Pressable>
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
    marginBottom: 10,
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
  bulletList: {
    marginTop: 8,
    gap: 6,
  },
  bulletItem: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 19,
    paddingLeft: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#222225',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  contactEmail: {
    color: '#FF6400',
    fontSize: 14,
    fontWeight: '700',
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
