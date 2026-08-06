import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OrderTrackingScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 16 : insets.bottom + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/')} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Мої замовлення</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.empty, { backgroundColor: colors.background }]}>
          <Ionicons name="receipt-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Замовлень немає</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Локальне відстеження вимкнено. Статуси будуть доступні після офіційної синхронізації Хорошопа.
          </Text>
          <Pressable style={[styles.shopBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/catalog')}>
            <Text style={styles.shopBtnText}>Перейти до каталогу</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700' as const, textAlign: 'center' as const },
  content: { padding: 16, gap: 16 },
  orderCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 16, fontWeight: '700' as const },
  orderDate: { fontSize: 12, marginTop: 2 },
  orderTotal: { fontSize: 18, fontWeight: '700' as const, textAlign: 'right' as const },
  orderPayment: { fontSize: 11, textAlign: 'right' as const, marginTop: 2 },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  deliveryText: { fontSize: 12, flex: 1 },
  timeline: { gap: 0 },
  timelineStep: { flexDirection: 'row', gap: 12, position: 'relative' },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 28,
    width: 2,
    height: 28,
    zIndex: 0,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    flexShrink: 0,
    marginBottom: 4,
  },
  timelineLabel: { flex: 1, paddingVertical: 6, gap: 4 },
  timelineLabelText: { fontSize: 13, lineHeight: 18 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' as const },
  activeBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '700' as const },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  deliveredText: { fontSize: 13, fontWeight: '700' as const, color: '#22C55E' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const },
  emptyText: { fontSize: 14, textAlign: 'center' as const, lineHeight: 20 },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  shopBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' as const },
});
