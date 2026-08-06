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

export default function PublicOfferScreen() {
  const router = useRouter();

  const handlePhonePress = () => {
    void Linking.openURL('tel:+380671022571');
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
          Публічна оферта
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
            <Ionicons name="document-text" size={32} color="#FF6400" />
          </View>
          <Text style={styles.bannerTitle}>Договір публічної оферти</Text>
          <Text style={styles.bannerSubtitle}>
            Правила купівлі-продажу оригінальних пристроїв та аксесуарів Garmin
          </Text>
          <Text style={styles.updatedDate}>GARMIN Sport Time • Версія від 2026 року</Text>
        </View>

        {/* Section 1 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="scale-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>1. Загальні положення</Text>
          </View>
          <Text style={styles.sectionText}>
            Цей Договір є офіційною публічною офертою (пропозицією) Інтернет-магазину GARMIN Sport Time укладатися договору купівлі-продажу товарів дистанційним способом відповідно до ст. 633, 641 Цивільного кодексу України. Цей документ має належну юридичну силу і є рівносильним укладенню письмового договору.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="watch-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>2. Предмет Договору</Text>
          </View>
          <Text style={styles.sectionText}>
            Продавець зобов'язується передати у власність Покупця оригінальну продукцію Garmin (смарт-годинники, велокомп'ютери, нагрудні датчики серцевого ритму, аксесуари та комплектуючі), а Покупець зобов'язується оплатити та прийняти Товар на умовах цього Договору.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cart-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>3. Оформлення та прийняття замовлення</Text>
          </View>
          <Text style={styles.sectionText}>
            Замовлення вважається акцептованим (прийнятим) Покупцем з моменту натискання кнопки «Оформити замовлення» в застосунку або після здійснення онлайн-оплати Товару. Оформлюючи замовлення, Покупець підтверджує ознайомлення та повну згоду з умовами даного Договору та характеристики купованого Товару.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>4. Ціна та порядок оплати</Text>
          </View>
          <Text style={styles.sectionText}>
            Усі ціни на Товари вказані у національній валюті України — гривні (UAH). Розрахунок здійснюється одним із наступних способів:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Безготівкова онлайн-оплата банківською картою (MonoPay / LiqPay / WayForPay);</Text>
            <Text style={styles.bulletItem}>• Оплата післяплатою (накладений платіж) при отриманні Товару у відділенні «Нова Пошта»;</Text>
            <Text style={styles.bulletItem}>• Оплата частинами відповідно до умов банків-партнерів.</Text>
          </View>
        </View>

        {/* Section 5 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>5. Доставка товару</Text>
          </View>
          <Text style={styles.sectionText}>
            Доставка здійснюється логістичною службою «Нова Пошта» по всій території України (у відділення, поштомати або адресною кур'єрською доставкою). При отриманні Покупець зобов’язаний у присутності представника перевізника перевірити цілісність упаковки, зовнішній вигляд та комплектність Товару.
          </Text>
        </View>

        {/* Section 6 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>6. Відповідальність сторін</Text>
          </View>
          <Text style={styles.sectionText}>
            Сторони несуть відповідальність за невиконання зобов'язань згідно з чинним законодавством України. Продавець не несе відповідальності за затримки доставки з вини поштової служби або внаслідок форс-мажорних обставин (військові дії, стихійні лиха, збої в електромережах чи зв'язку).
          </Text>
        </View>

        {/* Section 7 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>7. Реквізити Продавця</Text>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Назва:</Text>
              <Text style={styles.detailValue}>ФОП «GARMIN Sport Time»</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Код ЄДРПОУ:</Text>
              <Text style={styles.detailValue}>3124567890</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Адреса:</Text>
              <Text style={styles.detailValue}>м. Запоріжжя, вул. Нижньодніпровська, 21</Text>
            </View>

            <Pressable style={styles.detailRowPressable} onPress={handlePhonePress}>
              <Text style={styles.detailLabel}>Телефон:</Text>
              <Text style={styles.detailValueHighlight}>067 102-25-71 (+380671022571)</Text>
            </Pressable>

            <Pressable style={styles.detailRowPressable} onPress={handleEmailPress}>
              <Text style={styles.detailLabel}>E-mail:</Text>
              <Text style={styles.detailValueHighlight}>support@sporttime.ua</Text>
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
  detailsList: {
    marginTop: 6,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222225',
  },
  detailRowPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222225',
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
    color: '#FF6400',
    fontSize: 13,
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
