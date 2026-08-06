import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/SafeIonicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type colorsType from '@/constants/colors';

type Colors = typeof colorsType.light;

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  action,
  colors,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: React.ReactNode;
  colors: Colors;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
      {showBack ? (
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}
      <View style={styles.headerCopy}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {action ?? <View style={styles.iconButton} />}
    </View>
  );
}

export function Surface({
  children,
  colors,
  style,
}: {
  children: React.ReactNode;
  colors: Colors;
  style?: ViewStyle;
}) {
  return <View style={[styles.surface, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
}

export function SectionHeading({
  title,
  caption,
  colors,
}: {
  title: string;
  caption?: string;
  colors: Colors;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {caption && <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>{caption}</Text>}
    </View>
  );
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  colors,
  disabled = false,
  style,
}: {
  label: string;
  icon?: string;
  onPress: (event: GestureResponderEvent) => void;
  colors: Colors;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: disabled ? colors.muted : colors.primary, opacity: pressed ? 0.84 : 1 },
        style,
      ]}
    >
      {icon && <Ionicons name={icon as any} size={18} color={disabled ? colors.mutedForeground : colors.primaryForeground} />}
      <Text style={[styles.primaryButtonText, { color: disabled ? colors.mutedForeground : colors.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  colors: Colors;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon as any} size={34} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>{description}</Text>
      {action}
    </View>
  );
}

export function StatusPill({ label, color, colors }: { label: string; color?: string; colors: Colors }) {
  const tone = color ?? colors.primary;
  return (
    <View style={[styles.statusPill, { backgroundColor: `${tone}20`, borderColor: tone }]}>
      <View style={[styles.statusDot, { backgroundColor: tone }]} />
      <Text style={[styles.statusText, { color: tone }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 19, fontWeight: '700' as const },
  headerSubtitle: { fontSize: 11 },
  surface: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionHeading: { gap: 3 },
  sectionTitle: { fontSize: 17, fontWeight: '700' as const },
  sectionCaption: { fontSize: 12 },
  primaryButton: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: { fontSize: 14, fontWeight: '700' as const },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  emptyIcon: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, textAlign: 'center' },
  emptyDescription: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 310 },
  statusPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' as const },
});