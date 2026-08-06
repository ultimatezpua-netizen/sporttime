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

export default function WarrantyScreen() {
  const router = useRouter();

  const handleCall = () => {
    void Linking.openURL('tel:+380671022571');
  };

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
          Гарантія та сервіс
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
            <Ionicons name="shield-checkmark" size={34} color="#FF6400" />
          </View>
          <Text style={styles.bannerTitle}>Офіційна гарантія Garmin</Text>
          <Text style={styles.bannerSubtitle}>
            100% оригінальна продукція з повною сервісною підтримкою по Україні
          </Text>
          <Text style={styles.updatedDate}>GARMIN Sport Time • Офіційний сервіс</Text>
        </View>

        {/* Section 1: Official Warranty */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ribbon-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>1. Офіційна гарантія</Text>
          </View>
          <Text style={styles.sectionText}>
            На всі смарт-годинники, велосипедні комп'ютери, навігатори та аксесуари Garmin, придбані в магазині GARMIN Sport Time, надається офіційна гарантія терміном від 12 до 24 місяців (залежно від конкретної моделі та пристрою).
          </Text>
        </View>

        {/* Section 2: Required Documents */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>2. Документи для гарантійного обслуговування</Text>
          </View>
          <Text style={styles.sectionText}>
            Для прийому пристрою на гарантійну діагностику необхідно надати:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FF6400" />
              <Text style={styles.bulletText}>
                Фірмовий гарантійний талон з датою продажу та печаткою продавця;
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FF6400" />
              <Text style={styles.bulletText}>
                Розрахунковий документ (фіскальний чек або квитанцію про оплату).
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Covered Cases */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>3. Гарантійні випадки</Text>
          </View>
          <Text style={styles.sectionText}>
            Безкоштовний сервісний ремонт або повна заміна пристрою на новий здійснюється у разі виявлення виробничого браку або програмного збою з вини заводу-виробника протягом усього гарантійного терміну.
          </Text>
        </View>

        {/* Section 4: What is NOT covered */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={20} color="#FF453A" />
            <Text style={styles.sectionTitle}>4. Що не підлягає гарантійному ремонту</Text>
          </View>
          <View style={styles.bulletList}>
            <View style={styles.bulletRow}>
              <Ionicons name="close-circle-outline" size={18} color="#FF453A" />
              <Text style={styles.bulletText}>
                Механічні пошкодження (тріщини дисплея, сколи корпусу, деформації після падіння або ударів);
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="close-circle-outline" size={18} color="#FF453A" />
              <Text style={styles.bulletText}>
                Пошкодження, викликані перевищенням допустимого рівня водозахисту пристрою (глибоководні занурення або сауна);
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="close-circle-outline" size={18} color="#FF453A" />
              <Text style={styles.bulletText}>
                Сліди несанкціонованого розтину сторонніми майстрами або використання модифікованого програмного забезпечення.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 5: Service Center */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="build-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>5. Авторизований сервісний центр</Text>
          </View>
          <Text style={styles.sectionText}>
            Для консультації, діагностики або відправки годинника на гарантійне обслуговування звертайтесь до наших спеціалістів:
          </Text>

          <View style={styles.contactRowGroup}>
            <Pressable style={styles.contactChip} onPress={handleCall}>
              <Ionicons name="call-outline" size={16} color="#FF6400" />
              <Text style={styles.contactChipText}>067 102-25-71</Text>
            </Pressable>

            <Pressable style={styles.contactChip} onPress={handleMapRoute}>
              <Ionicons name="location-outline" size={16} color="#FF6400" />
              <Text style={styles.contactChipText}>м. Запоріжжя, вул. Нижньодніпровська, 21</Text>
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
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  contactRowGroup: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#222225',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  contactChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
