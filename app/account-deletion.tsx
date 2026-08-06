import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountDeletionScreen() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailRequest = () => {
    const subject = encodeURIComponent('Запит на видалення акаунта');
    const body = encodeURIComponent(
      'Доброго дня! Прошу повністю видалити мій обліковий запис та всі персональні дані з бази даних GARMIN Sport Time.'
    );
    void Linking.openURL(`mailto:privacy@sporttime.ua?subject=${subject}&body=${body}`);
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Підтвердження видалення',
      'Ви дійсно бажаєте видалити свій обліковий запис? Цю дію неможливо буде скасувати.',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити акаунт',
          style: 'destructive',
          onPress: () => {
            setIsSubmitted(true);
            handleEmailRequest();
          },
        },
      ]
    );
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
          Видалення акаунта
        </Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning-outline" size={32} color="#FF453A" />
          </View>
          <Text style={styles.bannerTitle}>Видалення акаунта</Text>
          <Text style={styles.bannerSubtitle}>
            Ви маєте право в будь-який момент вимагати повного видалення вашого облікового запису та персональних даних з баз даних GARMIN Sport Time.
          </Text>
        </View>

        {/* Section: What will be deleted */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trash-outline" size={20} color="#FF453A" />
            <Text style={styles.sectionTitle}>Що буде видалено остаточно:</Text>
          </View>
          <View style={styles.bulletList}>
            <View style={styles.bulletRow}>
              <Ionicons name="close-circle" size={16} color="#FF453A" />
              <Text style={styles.bulletText}>Персональний профіль користувача (ПІБ, телефон, e-mail);</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="close-circle" size={16} color="#FF453A" />
              <Text style={styles.bulletText}>Історія збережених адрес та поштових відділень доставки;</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="close-circle" size={16} color="#FF453A" />
              <Text style={styles.bulletText}>Персональні списки обраних товарів та кошик покупок.</Text>
            </View>
          </View>
        </View>

        {/* Section: What will be kept legally */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#FF6400" />
            <Text style={styles.sectionTitle}>Збереження згідно із законодавством:</Text>
          </View>
          <Text style={styles.sectionText}>
            Фінансова та бухгалтерська інформація щодо вже виконаних замовлень (товарні чеки, квитанції про оплату) зберігається протягом терміну, чітко встановленого податковим та фінансовим законодавством України.
          </Text>
        </View>

        {/* Deletion Form & Buttons */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Надіслати запит на видалення</Text>
          <Text style={styles.actionDescription}>
            Натиснувши кнопку нижче, ви створите офіційне звернення до нашої служби безпеки з запитом на повне стирання ваших даних.
          </Text>

          {isSubmitted && (
            <View style={styles.submittedBox}>
              <Ionicons name="checkmark-circle" size={20} color="#30D158" />
              <Text style={styles.submittedText}>
                Запит надіслано. Очікуйте підтвердження на e-mail протягом 24 годин.
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            onPress={handleDeletePress}
          >
            <Ionicons name="trash-bin-outline" size={18} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Видалити мій акаунт</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.emailButton, pressed && styles.pressed]}
            onPress={handleEmailRequest}
          >
            <Ionicons name="mail-unread-outline" size={18} color="#FF6400" />
            <Text style={styles.emailButtonText}>Надіслати e-mail на privacy@sporttime.ua</Text>
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
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bannerSubtitle: {
    color: '#C7C7CC',
    fontSize: 13,
    lineHeight: 19,
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
  sectionText: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 19,
  },
  bulletList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletText: {
    color: '#C7C7CC',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  actionCard: {
    backgroundColor: '#161618',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  actionDescription: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  submittedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  submittedText: {
    color: '#30D158',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF453A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#222225',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  emailButtonText: {
    color: '#FF6400',
    fontSize: 13,
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
