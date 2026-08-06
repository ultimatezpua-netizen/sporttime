import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/SafeIonicons';
import { useApp, type PaymentMethod } from '@/context/AppContext';
import { ScreenHeader, Surface } from '@/components/AppUI';

const OPTIONS: { id: PaymentMethod; label: string; description: string; icon: string }[] = [
  { id: 'card', label: 'Онлайн карткою', description: 'Visa, Mastercard та Apple Pay', icon: 'card-outline' },
  { id: 'cash', label: 'Накладний платіж', description: 'Оплата під час отримання', icon: 'cash-outline' },
];

export default function PaymentScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { paymentMethod, setPaymentMethod } = useApp();
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom + 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Оплата" subtitle="Безпечний спосіб розрахунку" colors={colors} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.notice, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '45' }]}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.foreground }]}>Платіжні дані не зберігаються у застосунку. Підключення платіжного провайдера виконується через API.</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Спосіб оплати за замовчуванням</Text>
        <Surface colors={colors} style={styles.optionsCard}>
          {OPTIONS.map((option, index) => {
            const selected = paymentMethod === option.id;
            return (
              <View key={option.id}>
                <OptionRow option={option} selected={selected} colors={colors} onPress={() => { setPaymentMethod(option.id); router.canGoBack() ? router.back() : router.push('/'); }} />
                {index < OPTIONS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            );
          })}
        </Surface>
        <Text style={[styles.footnote, { color: colors.mutedForeground }]}>Спосіб можна змінити під час оформлення кожного замовлення.</Text>
      </ScrollView>
    </View>
  );
}

function OptionRow({ option, selected, colors, onPress }: { option: typeof OPTIONS[number]; selected: boolean; colors: any; onPress: () => void }) {
  return (
    <Pressable style={styles.optionRow} onPress={onPress}>
      <View style={[styles.optionIcon, { backgroundColor: selected ? colors.primary + '18' : colors.muted }]}>
        <Ionicons name={option.icon as any} size={21} color={selected ? colors.primary : colors.mutedForeground} />
      </View>
      <View style={styles.optionCopy}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{option.label}</Text><Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>{option.description}</Text></View>
      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? colors.primary : colors.border} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 14 },
  notice: { padding: 13, borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, marginTop: 5 },
  optionsCard: { paddingHorizontal: 14 },
  optionRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionCopy: { flex: 1, gap: 4 },
  optionTitle: { fontSize: 14, fontWeight: '700' as const },
  optionDescription: { fontSize: 12 },
  divider: { height: 1 },
  footnote: { fontSize: 12, lineHeight: 18 },
});