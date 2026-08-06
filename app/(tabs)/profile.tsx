import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import {
  Alert,
  Image,
  InteractionManager,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/constants/theme';
import { Ionicons } from '@/components/SafeIonicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { FONTS } from '@/constants/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeParseJSON } from '@/utils/safeStorage';
import { CustomerOrder, getOrdersByPhone } from '@/services/ordersClient';
import {
  UserIcon,
  PackageXIcon,
  PackageIcon,
  HeartIcon,
  CreditCardIcon,
  SettingsIcon,
  HeadphonesIcon,
} from '@/components/ProfileIcons';
import { WarrantySetup } from '@/components/WarrantySetup';

export default function ProfileScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favorites, customerPhone, setCustomerPhone } = useApp();
  const bottomPad = Platform.OS === 'web' ? 100 : insets.bottom + 92;

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'warranty'>('profile');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const isMountedRef = useRef(true);
  const syncedPhoneRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function loadUserData() {
      try {
        const [name, email] = await Promise.all([
          AsyncStorage.getItem('user_name'),
          AsyncStorage.getItem('user_email'),
        ]);
        if (name) setUserName(name);
        if (email) setUserEmail(email);
      } catch (e) {
        console.warn('Failed to load user name/email from AsyncStorage:', e);
      }
    }
    void loadUserData();
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      let savedPhone = customerPhone || '';
      if (!savedPhone) {
        try {
          const [p1, p2, p3] = await Promise.all([
            AsyncStorage.getItem('user_phone'),
            AsyncStorage.getItem('customer_phone'),
            AsyncStorage.getItem('auth_phone'),
          ]);
          savedPhone = p1 || p2 || p3 || '';
        } catch {
          savedPhone = '';
        }
      }

      const effectivePhone =
        savedPhone && savedPhone !== 'undefined' && savedPhone !== 'null' ? savedPhone.trim() : '';

      if (
        effectivePhone &&
        effectivePhone !== customerPhone &&
        syncedPhoneRef.current !== effectivePhone
      ) {
        syncedPhoneRef.current = effectivePhone;
        void setCustomerPhone(effectivePhone);
      }

      let fetched: CustomerOrder[] = [];
      if (effectivePhone) {
        try {
          const data = await getOrdersByPhone(effectivePhone);
          if (Array.isArray(data)) {
            fetched = data.filter((item: any) => item && typeof item === 'object');
          }
        } catch (fetchErr) {
          console.warn('Profile getOrdersByPhone non-critical warning:', fetchErr);
          fetched = [];
        }
      }

      let localOrders: CustomerOrder[] = [];
      try {
        const [raw1, raw2] = await Promise.all([
          AsyncStorage.getItem('user_orders'),
          AsyncStorage.getItem('@sporttime/orders'),
        ]);
        const rawLocal = raw1 || raw2;
        if (rawLocal && typeof rawLocal === 'string') {
          const parsed = safeParseJSON<any[]>(rawLocal, []);
          if (Array.isArray(parsed)) {
            const cleanTarget = effectivePhone ? effectivePhone.replace(/\D/g, '') : '';
            localOrders = parsed.filter((o: any) => {
              if (!o || typeof o !== 'object') return false;
              if (!o?.phone || !cleanTarget) return true;
              const cleanOrderPhone = String(o.phone).replace(/\D/g, '');
              return cleanOrderPhone.includes(cleanTarget) || cleanTarget.includes(cleanOrderPhone);
            });
          }
        }
      } catch (parseErr) {
        console.warn('Failed parsing local orders in profile, falling back to empty list:', parseErr);
        localOrders = [];
      }

      const safeFetched = Array.isArray(fetched) ? fetched : [];
      const safeLocal = Array.isArray(localOrders) ? localOrders : [];

      const mergedMap = new Map<string, CustomerOrder>();
      [...safeLocal, ...safeFetched].forEach((ord: any) => {
        if (!ord || typeof ord !== 'object') return;
        const rawKey = ord?.id || ord?.orderId || ord?.orderNumber;
        const key = rawKey ? String(rawKey) : '';
        if (key && !mergedMap.has(key)) {
          mergedMap.set(key, {
            id: key,
            orderNumber: String(ord?.orderNumber || ord?.number || key),
            status: String(ord?.status || 'Прийнято в обробку'),
            createdAt: String(ord?.createdAt || ord?.date || new Date().toISOString()),
            total: Number(ord?.total ?? ord?.totals?.total ?? 0) || 0,
            clientName: String(ord?.clientName || ord?.customer?.name || ''),
            items: Array.isArray(ord?.items) ? ord.items : [],
            statusId: Number(ord?.statusId) || 1,
          });
        }
      });

      if (isMountedRef.current) {
        setOrders(Array.from(mergedMap.values()));
      }
    } catch (criticalErr) {
      console.warn('Profile refreshOrders fallback triggered:', criticalErr);
      if (isMountedRef.current) {
        setOrders([]);
      }
    }
  }, [customerPhone, setCustomerPhone]);

  useEffect(() => {
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (isMountedRef.current && !cancelled) {
        void refreshOrders();
      }
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [refreshOrders]);

  const activePhone = useMemo(
    () => customerPhone || '',
    [customerPhone]
  );

  const latestOrder = useMemo(() => (orders.length > 0 ? orders[0] : null), [orders]);

  const handleTabProfile = useCallback(() => setActiveTab('profile'), []);
  const handleTabWarranty = useCallback(() => setActiveTab('warranty'), []);

  const handleOrdersNav = useCallback(() => router.push('/orders'), [router]);
  const handlePaymentNav = useCallback(() => router.push('/payment'), [router]);
  const handleFavoritesNav = useCallback(() => router.push('/(tabs)/favorites'), [router]);
  const handleLatestOrderNav = useCallback(() => {
    if (latestOrder?.id) {
      router.push(`/order/${latestOrder.id}`);
    }
  }, [latestOrder, router]);



  const handleOpenSupport = useCallback(async () => {
    try {
      await WebBrowser.openBrowserAsync('https://support.garmin.com/');
    } catch (error) {
      console.error('Failed to open browser:', error);
    }
  }, []);

  const favoritesCount = favorites.length;

  const packageIcon = useMemo(() => <PackageIcon color="#FF5500" size={20} />, []);
  const heartIcon = useMemo(() => <HeartIcon color="#FF5500" size={20} />, []);
  const creditCardIcon = useMemo(() => <CreditCardIcon color="#FF5500" size={20} />, []);
  const headphonesIcon = useMemo(() => <HeadphonesIcon color="#FF5500" size={20} />, []);
  const trashIcon = useMemo(() => <Ionicons name="trash-outline" color="#FF453A" size={20} />, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="ПРОФІЛЬ" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Garmin Top Switch Tabs */}
        <View style={styles.topTabsRow}>
          <Pressable
            style={[styles.topTabBtn, activeTab === 'profile' && styles.topTabBtnActive]}
            onPress={handleTabProfile}
          >
            <Text style={[styles.topTabText, activeTab === 'profile' && styles.topTabTextActive]}>
              ПРОФІЛЬ
            </Text>
          </Pressable>
          <Pressable
            style={[styles.topTabBtn, activeTab === 'warranty' && styles.topTabBtnActive]}
            onPress={handleTabWarranty}
          >
            <Text style={[styles.topTabText, activeTab === 'warranty' && styles.topTabTextActive]}>
              ГАРАНТІЯ ТА НАЛАШТУВАННЯ
            </Text>
          </Pressable>
        </View>

        {activeTab === 'profile' ? (
          <>
            {/* 1. Account Details Section (ДАНІ ОБЛІКОВОГО ЗАПИСУ) */}
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.garminSectionTitle}>ДАНІ ОБЛІКОВОГО ЗАПИСУ</Text>
            </View>

            <View style={styles.accountDataCard}>
              <View style={{ gap: 10 }}>
                <Text style={styles.accountDataRow}>
                  <Text style={styles.accountDataLabel}>Ім'я: </Text>
                  <Text style={styles.accountDataValue}>{userName || 'Garmin User'}</Text>
                </Text>
                <Text style={styles.accountDataRow}>
                  <Text style={styles.accountDataLabel}>Електронна пошта: </Text>
                  <Text style={styles.accountDataValue}>{userEmail || 'customer@garmin.ua'}</Text>
                </Text>
                <Text style={styles.accountDataRow}>
                  <Text style={styles.accountDataLabel}>Телефон: </Text>
                  <Text style={styles.accountDataValue}>{activePhone || '+380 XX XXX XX XX'}</Text>
                </Text>
              </View>
            </View>

            {/* 3. Top Stats Bar (3 cards) */}
            <View style={styles.statsRow}>
              <Pressable style={styles.statCard} onPress={handleOrdersNav}>
                <Text style={[{ fontSize: 24, fontWeight: '700', color: '#FF5500' }, styles.statNumber]}>
                  {orders.length}
                </Text>
                <Text style={styles.statLabel}>Замовлення</Text>
              </Pressable>

              <Pressable style={styles.statCard} onPress={handlePaymentNav}>
                <Text style={[{ fontSize: 24, fontWeight: '700', color: '#FF5500' }, styles.statNumber]}>
                  0 ₴
                </Text>
                <Text style={styles.statLabel}>Бонуси</Text>
              </Pressable>

              <Pressable style={styles.statCard} onPress={handleFavoritesNav}>
                <Text style={[{ fontSize: 24, fontWeight: '700', color: '#FF5500' }, styles.statNumber]}>
                  {favoritesCount}
                </Text>
                <Text style={styles.statLabel}>Обрані</Text>
              </Pressable>
            </View>

            {/* 4. Latest Order Compact Card */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderBox}>
                <Text style={styles.garminSectionTitle}>ОСТАННЄ ЗАМОВЛЕННЯ</Text>
              </View>
              {latestOrder ? (
                <Pressable style={styles.latestOrderCard} onPress={handleLatestOrderNav}>
                  <View style={styles.latestOrderLeft}>
                    {packageIcon}
                    <View>
                      <Text style={styles.latestOrderNum}>
                        №{latestOrder.orderNumber || latestOrder.id}
                      </Text>
                      <Text style={styles.latestOrderStatus}>{latestOrder.status}</Text>
                    </View>
                  </View>
                  <View style={styles.latestOrderRight}>
                    <Text style={styles.latestOrderTotal}>
                      {latestOrder.total ? `${latestOrder.total.toLocaleString('uk-UA')} ₴` : '—'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                  </View>
                </Pressable>
              ) : (
                <View style={styles.noOrdersCard}>
                  <PackageXIcon color="#8E8E93" size={18} />
                  <Text style={styles.noOrdersText}>У вас немає активних замовлень</Text>
                </View>
              )}
            </View>

            {/* 5. Settings Menu List */}
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.garminSectionTitle}>АДРЕСИ ДОСТАВКИ ТА НАЛАШТУВАННЯ</Text>
            </View>
            <View style={styles.menuGroupCard}>
              <MenuItemRow
                iconComponent={packageIcon}
                label="Всі замовлення"
                onPress={handleOrdersNav}
              />
              <MenuItemRow
                iconComponent={heartIcon}
                label="Обрані товари"
                badgeCount={favoritesCount}
                onPress={handleFavoritesNav}
              />
              <MenuItemRow
                iconComponent={creditCardIcon}
                label="Способи оплати та бонуси"
                onPress={handlePaymentNav}
              />
              <MenuItemRow
                iconComponent={headphonesIcon}
                label="Служба підтримки Garmin"
                onPress={handleOpenSupport}
              />
              <MenuItemRow
                iconComponent={trashIcon}
                label="Видалення акаунта"
                isLast
                onPress={() => router.push('/account-deletion')}
              />
            </View>
          </>
        ) : (
          <WarrantySetup />
        )}

        <Text style={styles.versionText}>SPORTTIME UA · Garmin Official Store</Text>

        {/* Legal links */}
        <View style={styles.legalLinksContainer}>
          <TouchableOpacity onPress={() => {}} activeOpacity={0.75}>
            <Text style={styles.legalLinkText}>Політика конфіденційності</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>·</Text>
          <TouchableOpacity onPress={() => {}} activeOpacity={0.75}>
            <Text style={styles.legalLinkText}>Умови використання</Text>
          </TouchableOpacity>
        </View>

        {/* Developer branding */}
        <View style={styles.devBrandingContainer}>
          <Text style={styles.devBrandingLabel}>Developed by Wild Developer</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://t.me/wil2dev')}
            activeOpacity={0.75}
          >
            <Image
              source={require('../../assets/images/dev-logo.jpeg')}
              style={styles.devBrandingLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const MenuItemRow = memo(function MenuItemRow({
  iconComponent,
  label,
  badgeCount,
  onPress,
  isLast = false,
}: {
  iconComponent: React.ReactNode;
  label: string;
  badgeCount?: number;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItemRow,
        !isLast && styles.menuItemBorder,
        pressed && { backgroundColor: '#2C2C2E50' },
      ]}
      onPress={onPress}
    >
      {iconComponent}
      <Text style={styles.menuItemLabel}>{label}</Text>
      <View style={styles.flexSpacer} />
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{badgeCount}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
    </Pressable>
  );
});



const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg },

  /* Top Switch Tabs */
  topTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.subtleBorder,
    marginBottom: theme.spacing.sm,
  },
  topTabBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabBtnActive: {
    borderBottomColor: theme.colors.electricCyan,
  },
  topTabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.colors.secondaryText,
    // system font weight used
  },
  topTabTextActive: {
    color: theme.colors.primaryText,
  },

  /* 1. Header Card */
  userHeaderCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.subtleBorder,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  userHeaderInfo: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  userHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primaryText,
  },
  userHeaderSubtitle: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    lineHeight: 16,
  },

  /* Garmin Brand Section Header */
  sectionHeaderBox: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  garminSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.colors.primaryText,
  },

  /* Account Details Section */
  accountDataCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.subtleBorder,
    padding: theme.spacing.lg,
  },
  accountDataRow: {
    fontSize: 14,
    lineHeight: 22,
  },
  accountDataLabel: {
    color: theme.colors.secondaryText,
  },
  accountDataValue: {
    color: theme.colors.primaryText,
    fontWeight: '600',
  },

  /* Garmin Control Outline Buttons */
  garminOutlineBtn: {
    borderWidth: 1,
    borderColor: theme.colors.primaryText,
    backgroundColor: 'transparent',
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  garminOutlineBtnText: {
    color: theme.colors.primaryText,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  /* 3. Stats Bar */
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.subtleBorder,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.electricCyan,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    marginTop: theme.spacing.sm,
  },

  /* 4. Section & Order Block */
  sectionBlock: {
    gap: theme.spacing.md,
  },
  noOrdersCard: {
    height: 60,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.subtleBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  noOrdersText: {
    fontSize: 13,
    color: theme.colors.secondaryText,
  },
  latestOrderCard: {
    minHeight: 60,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.subtleBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  latestOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  latestOrderNum: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryText,
  },
  latestOrderStatus: {
    fontSize: 12,
    color: theme.colors.electricCyan,
  },
  latestOrderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  latestOrderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primaryText,
  },

  /* 5. Settings Menu List */
  menuGroupCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.subtleBorder,
    overflow: 'hidden',
  },
  menuItemRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.subtleBorder,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.primaryText,
  },
  flexSpacer: {
    flex: 1,
  },
  badgePill: {
    backgroundColor: theme.colors.highVisLime,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryText,
  },

  /* Form "ЗАВЕСТИ АКАУНТ" Styles */
  registerCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.subtleBorder,
    padding: 18,
    gap: theme.spacing.md,
  },
  registerDescription: {
    fontSize: 13,
    color: theme.colors.secondaryText,
    lineHeight: 18,
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primaryText,
  },
  requiredAsterisk: {
    color: '#FF453A',
    fontWeight: '700',
  },
  garminInput: {
    height: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    backgroundColor: theme.colors.cardBackground,
    color: theme.colors.primaryText,
    paddingHorizontal: theme.spacing.lg,
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  squareCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareCheckboxChecked: {
    backgroundColor: theme.colors.electricCyan,
    borderColor: theme.colors.electricCyan,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.secondaryText,
    lineHeight: 16,
  },
  garlicPrimaryBoxBtn: {
    height: 48,
    borderRadius: 2,
    backgroundColor: theme.colors.electricCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  garlicPrimaryBoxBtnText: {
    color: theme.colors.primaryText,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#6C6C70',
    marginTop: theme.spacing.sm,
  },
  legalLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  legalLinkText: {
    fontSize: 12,
    color: theme.colors.secondaryText,
  },
  legalSeparator: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    marginHorizontal: 4,
  },
  devBrandingContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  devBrandingLabel: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    marginBottom: theme.spacing.md,
    letterSpacing: 0.3,
  },
  devBrandingLogo: {
    width: 60,
    height: 60,
  },
});
