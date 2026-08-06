import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/SafeIonicons';
import { ScreenHeader, Surface } from '@/components/AppUI';
import { useSettings, type AppLanguage, type ThemePreference } from '@/context/SettingsContext';

const HOROSHOP_CONTACTS_URL = 'https://sporttimeua.com/kontaktna-informatsiya/';

// TODO: after the in-app WebView is added, open the official contacts page
// inside the app so Back returns directly to Settings.
export default function SettingsScreen() {
  const router = useRouter();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const {
    language,
    theme,
    orderNotifications,
    marketingNotifications,
    setLanguage,
    setTheme,
    setOrderNotifications,
    setMarketingNotifications,
  } = useSettings();
  const [picker, setPicker] = useState<'language' | 'theme' | null>(null);
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom + 24;
  const labels = LANGUAGE_LABELS[language];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={labels.settings} colors={colors} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{labels.notifications}</Text>
        <Surface colors={colors} style={styles.card}>
          <ToggleRow icon="notifications-outline" title={labels.orderStatus} description={labels.orderDescription} value={orderNotifications} onChange={setOrderNotifications} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ToggleRow icon="megaphone-outline" title={labels.marketing} description={labels.marketingDescription} value={marketingNotifications} onChange={setMarketingNotifications} colors={colors} />
        </Surface>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{labels.app}</Text>
        <Surface colors={colors} style={styles.card}>
          <PickerRow icon="language-outline" title={labels.language} value={LANGUAGE_OPTIONS.find(option => option.value === language)?.label ?? ''} onPress={() => setPicker('language')} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PickerRow icon={theme === 'dark' ? 'moon-outline' : 'sunny-outline'} title={labels.theme} value={theme === 'dark' ? labels.dark : labels.light} onPress={() => setPicker('theme')} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PickerRow icon="information-circle-outline" title={labels.version} value="1.0.1" colors={colors} />
        </Surface>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{labels.support}</Text>
        <Surface colors={colors} style={styles.card}>
          <Pressable style={styles.linkRow} onPress={() => void WebBrowser.openBrowserAsync(HOROSHOP_CONTACTS_URL)}>
            <Ionicons name="help-circle-outline" size={20} color={colors.foreground} />
            <Text style={[styles.linkTitle, { color: colors.foreground }]}>{labels.help}</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} />
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/warranty')}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.foreground} />
            <Text style={[styles.linkTitle, { color: colors.foreground }]}>Гарантія та сервіс</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.linkRow} onPress={() => router.push('/shipping-payment')}>
            <Ionicons name="car-outline" size={20} color={colors.foreground} />
            <Text style={[styles.linkTitle, { color: colors.foreground }]}>Оплата та доставка</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.linkRow} onPress={() => router.push('/contacts')}>
            <Ionicons name="call-outline" size={20} color={colors.foreground} />
            <Text style={[styles.linkTitle, { color: colors.foreground }]}>Контакти та реквізити</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.linkRow} onPress={() => router.push('/privacy')}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.foreground} />
            <Text style={[styles.linkTitle, { color: colors.foreground }]}>Політика конфіденційності</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.linkRow} onPress={() => router.push('/terms')}>
            <Ionicons name="document-text-outline" size={20} color={colors.foreground} />
            <Text style={[styles.linkTitle, { color: colors.foreground }]}>Публічна оферта</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.linkRow} onPress={() => router.push('/returns')}>
            <Ionicons name="refresh-circle-outline" size={20} color={colors.foreground} />
            <Text style={[styles.linkTitle, { color: colors.foreground }]}>Повернення та обмін</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.linkRow} onPress={() => router.push('/account-deletion')}>
            <Ionicons name="trash-outline" size={20} color="#FF453A" />
            <Text style={[styles.linkTitle, { color: '#FF453A' }]}>Видалення акаунта</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} />
          </Pressable>
        </Surface>
      </ScrollView>
      <PickerModal
        kind={picker}
        language={language}
        theme={theme}
        onLanguageChange={setLanguage}
        onThemeChange={setTheme}
        onClose={() => setPicker(null)}
        labels={labels}
        colors={colors}
      />
    </View>
  );
}

const LANGUAGE_OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: 'uk', label: 'Українська' },
  { value: 'pl', label: 'Polski' },
  { value: 'en', label: 'English' },
];

const THEME_OPTIONS: { value: ThemePreference; labelKey: 'dark' | 'light' }[] = [
  { value: 'dark', labelKey: 'dark' },
  { value: 'light', labelKey: 'light' },
];

const LANGUAGE_LABELS = {
  uk: { settings: 'Налаштування', notifications: 'Сповіщення', orderStatus: 'Статус замовлення', orderDescription: 'Оновлення щодо доставки та отримання', marketing: 'Новинки та акції', marketingDescription: 'Тільки важливі пропозиції SportTime', app: 'Додаток', language: 'Мова', theme: 'Тема', dark: 'Чорна', light: 'Біла', version: 'Версія', support: 'Підтримка', help: 'Допомога та контакти', chooseLanguage: 'Оберіть мову', chooseTheme: 'Оберіть тему', close: 'Закрити' },
  pl: { settings: 'Ustawienia', notifications: 'Powiadomienia', orderStatus: 'Status zamówienia', orderDescription: 'Aktualizacje dostawy i odbioru', marketing: 'Nowości i promocje', marketingDescription: 'Tylko ważne oferty SportTime', app: 'Aplikacja', language: 'Język', theme: 'Motyw', dark: 'Czarny', light: 'Biały', version: 'Wersja', support: 'Wsparcie', help: 'Pomoc i kontakt', chooseLanguage: 'Wybierz język', chooseTheme: 'Wybierz motyw', close: 'Zamknij' },
  en: { settings: 'Settings', notifications: 'Notifications', orderStatus: 'Order status', orderDescription: 'Delivery and pickup updates', marketing: 'New products and promotions', marketingDescription: 'Only important SportTime offers', app: 'App', language: 'Language', theme: 'Theme', dark: 'Black', light: 'White', version: 'Version', support: 'Support', help: 'Help and contacts', chooseLanguage: 'Choose language', chooseTheme: 'Choose theme', close: 'Close' },
} as const;

function ToggleRow({ icon, title, description, value, onChange, colors }: { icon: string; title: string; description: string; value: boolean; onChange: (value: boolean) => void; colors: any }) {
  return (
    <View style={styles.toggleRow}>
      <Ionicons name={icon as any} size={20} color={colors.primary} />
      <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.rowDescription, { color: colors.mutedForeground }]}>{description}</Text></View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.muted, true: colors.primary + '80' }} thumbColor={value ? colors.primary : colors.mutedForeground} />
    </View>
  );
}
function PickerRow({ icon, title, value, onPress, colors }: { icon: string; title: string; value: string; onPress?: () => void; colors: any }) {
  const content = <><Ionicons name={icon as any} size={20} color={colors.foreground} /><Text style={[styles.rowTitle, { color: colors.foreground, flex: 1 }]}>{title}</Text><Text style={[styles.value, { color: colors.mutedForeground }]}>{value}</Text>{onPress && <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} />}</>;
  return onPress ? <Pressable onPress={onPress} style={styles.toggleRow}>{content}</Pressable> : <View style={styles.toggleRow}>{content}</View>;
}

function PickerModal({ kind, language, theme, onLanguageChange, onThemeChange, onClose, labels, colors }: { kind: 'language' | 'theme' | null; language: AppLanguage; theme: ThemePreference; onLanguageChange: (value: AppLanguage) => void; onThemeChange: (value: ThemePreference) => void; onClose: () => void; labels: (typeof LANGUAGE_LABELS)[AppLanguage]; colors: any }) {
  if (!kind) return null;
  const isLanguage = kind === 'language';
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => undefined}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{isLanguage ? labels.chooseLanguage : labels.chooseTheme}</Text>
          {(isLanguage ? LANGUAGE_OPTIONS : THEME_OPTIONS).map(option => {
            const value = option.value as AppLanguage & ThemePreference;
            const selected = isLanguage ? language === value : theme === value;
            const title = isLanguage ? (option as { label: string }).label : labels[(option as { labelKey: 'dark' | 'light' }).labelKey];
            return <Pressable key={value} onPress={() => { if (isLanguage) onLanguageChange(value as AppLanguage); else onThemeChange(value as ThemePreference); onClose(); }} style={[styles.modalOption, { borderBottomColor: colors.border }]}><Text style={[styles.modalOptionText, { color: selected ? colors.primary : colors.foreground }]}>{title}</Text>{selected && <Ionicons name="checkmark" size={20} color={colors.primary} />}</Pressable>;
          })}
          <Pressable onPress={onClose} style={styles.modalClose}><Text style={{ color: colors.mutedForeground }}>{labels.close}</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, marginTop: 6 },
  card: { paddingHorizontal: 14 },
  toggleRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 14, fontWeight: '700' as const },
  rowDescription: { fontSize: 11, lineHeight: 16 },
  value: { fontSize: 12 },
  divider: { height: 1 },
  linkRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkTitle: { flex: 1, fontSize: 14, fontWeight: '700' as const },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', paddingTop: 18 },
  modalTitle: { fontSize: 17, fontWeight: '700' as const, paddingHorizontal: 18, paddingBottom: 10 },
  modalOption: { minHeight: 50, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  modalOptionText: { fontSize: 15, fontWeight: '700' as const },
  modalClose: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});