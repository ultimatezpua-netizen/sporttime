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

export default function ReturnsScreen() {
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
          Повернення та обмін
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
            <Ionicons name="refresh-circle-outline" size={34} color="#FF6400" />
          </View>
          <Text style={styles.bannerTitle}>Повернення та обмін</Text>
          <Text style={styles.bannerSubtitle}>
            100% захист покупця та проста процедура повернення товарів Garmin
          </Text>
          <Text style={styles.updatedDate}>GARMIN Sport Time • Офіційна гарантія</Text>
        </View>

        {/* Section 1 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>1. Право на повернення (14 днів)</Text>
          </View>
          <Text style={styles.sectionText}>
            Відповідно до ст. 9 Закону України «Про захист прав споживачів», Покупець має право повернути або обміняти товар належної якості протягом 14 днів, не враховуючи дня купівлі.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-done-circle-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>2. Умови для повернення товару належної якості</Text>
          </View>
          <Text style={styles.sectionText}>
            Повернення або обмін здійснюється за дотримання наступних вимог:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bulletHighlight}>Товар не був у використанні:</Text> відсутні будь-які сліди експлуатації годинника, подряпини, потертості на корпусі, безелі або склоблоці;
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bulletHighlight}>Збережено товарний вигляд:</Text> захисні заводські плівки, фірмові ярлики та повну комплектацію (оригінальний зарядний кабель, додаткові ремінці, інструкція користувача);
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bulletHighlight}>Цілісність упаковки:</Text> збережено оригінальну фірмову коробку Garmin та розрахунковий документ (товарний чек / квитанцію).
            </Text>
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="paper-plane-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>3. Порядок оформлення повернення</Text>
          </View>
          <Text style={styles.sectionText}>
            Для швидкого та зручного оформлення процедури повернення дотримуйтесь алгоритму:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Зверніться до служби підтримки за номером гарячої лінії або напишіть на електронну пошту <Text style={styles.linkText} onPress={handleEmailPress}>support@sporttime.ua</Text>;
            </Text>
            <Text style={styles.bulletItem}>
              • Заповніть коротку заяву на повернення товару із зазначенням причини та реквізитів банківської картки;
            </Text>
            <Text style={styles.bulletItem}>
              • Надішліть товар службою «Нова Пошта» за вказаними менеджером реквізитами (транспортні витрати сплачує відправник).
            </Text>
          </View>
        </View>

        {/* Section 4 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>4. Повернення коштів</Text>
          </View>
          <Text style={styles.sectionText}>
            Повернення коштів здійснюється на банківську картку Покупця протягом 1–3 робочих днів після отримання Товару та успішного підтвердження його належного стану сервісним центром GARMIN Sport Time.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>5. Гарантійне обслуговування</Text>
          </View>
          <Text style={styles.sectionText}>
            На всі смарт-годинники та пристрої Garmin надається офіційна гарантія. У разі виявлення заводського браку або несправності протягом гарантійного терміну авторизований сервісний центр здійснює безкоштовний діагностичний огляд, гарантійний ремонт або заміну пристрою на новий.
          </Text>

          <View style={styles.contactRowGroup}>
            <Pressable style={styles.contactChip} onPress={handlePhonePress}>
              <Ionicons name="call-outline" size={16} color="#FF6400" />
              <Text style={styles.contactChipText}>067 102-25-71</Text>
            </Pressable>

            <Pressable style={styles.contactChip} onPress={handleEmailPress}>
              <Ionicons name="mail-outline" size={16} color="#FF6400" />
              <Text style={styles.contactChipText}>support@sporttime.ua</Text>
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
    gap: 8,
  },
  bulletItem: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 19,
    paddingLeft: 4,
  },
  bulletHighlight: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  linkText: {
    color: '#FF6400',
    fontWeight: '600',
  },
  contactRowGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222225',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  contactChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
