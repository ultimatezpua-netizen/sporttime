import React, { memo, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@/components/SafeIonicons';
import { useApp } from '@/context/AppContext';
import { FONTS } from '@/constants/typography';
import { GarminLogo } from './GarminLogo';

interface HeaderProps {
  showBack?: boolean;
  title?: string;
  onSearch?: () => void;
}

type DrawerPage =
  | 'main'
  | 'catalog'
  | 'garmin'
  | 'garmin-series'
  | 'garmin-purpose'
  | 'accessories'
  | 'cycling'
  | 'outdoor';

type DrawerItem = {
  label: string;
  page?: DrawerPage;
  route?: string;
  category?: string;
};

const MAIN_MENU_ITEMS: DrawerItem[] = [
  { label: 'Головна', route: '/' },
  { label: 'Каталог', page: 'catalog' },
  { label: 'Порівняння моделей', route: '/compare' },
  { label: 'Обрані', route: '/(tabs)/favorites' },
  { label: 'Кошик', route: '/(tabs)/cart' },
  { label: 'Профіль', route: '/(tabs)/profile' },
];

const GARMIN_SERIES_ITEMS: DrawerItem[] = [
  ['1099', 'Garmin Fenix'],
  ['1100', 'Garmin Epix'],
  ['1101', 'Garmin Descent'],
  ['1102', 'Garmin Enduro'],
  ['1103', 'Garmin Forerunner'],
  ['1104', 'Garmin Instinct'],
  ['1105', 'Garmin Lily'],
  ['1106', 'Garmin MARQ'],
  ['1107', 'Garmin Quatix'],
  ['1108', 'Garmin Tactix'],
  ['1109', 'Garmin Venu'],
  ['1110', 'Garmin Vivoactive'],
  ['1111', 'Garmin Vivofit'],
  ['1112', 'Garmin Vivomove'],
  ['1113', 'Garmin Vivosmart'],
  ['1121', 'Garmin Bounce'],
].map(([category, label]) => ({ label, category }));

const GARMIN_PURPOSE_ITEMS: DrawerItem[] = [
  ['1114', 'Жіночі смартгодинники'],
  ['1116', 'Тактичні смартгодинники'],
  ['1117', 'Спортивні смартгодинники'],
  ['1118', 'Повсякденні смартгодинники'],
  ['1119', 'Преміум смартгодинники'],
].map(([category, label]) => ({ label, category }));

const CATALOG_MENU_ITEMS: DrawerItem[] = [
  { label: 'Garmin', page: 'garmin' },
  { label: 'Suunto', category: '1122' },
  { label: 'Coros', category: '1123' },
  { label: 'Аксесуари до смартгодинників', page: 'accessories' },
  { label: 'Велокомп’ютери та аксесуари', page: 'cycling' },
  { label: 'Ґаджети для активного відпочинку', page: 'outdoor' },
];

const GARMIN_MENU_ITEMS: DrawerItem[] = [
  { label: 'Смартгодинники за серіями', page: 'garmin-series' },
  { label: 'Смартгодинники за призначенням', page: 'garmin-purpose' },
];

const ACCESSORY_MENU_ITEMS: DrawerItem[] = [
  ['1092', 'Ремінці'],
  ['1093', 'Зарядні пристрої'],
  ['1094', 'Кріплення'],
  ['1095', 'Захисне скло'],
  ['1096', 'Безель'],
  ['1097', 'Датчики'],
].map(([category, label]) => ({ label, category }));

const CYCLING_MENU_ITEMS: DrawerItem[] = [
  ['1098', 'Велокомп’ютери Garmin'],
  ['1087', 'Датчики для велокомп’ютерів'],
  ['1082', 'Ліхтарі'],
].map(([category, label]) => ({ label, category }));

const OUTDOOR_MENU_ITEMS: DrawerItem[] = [
  { label: 'Навігатори', category: '1088' },
  { label: 'Ехолоти', category: '1083' },
];

const DRAWER_PAGE_TITLES: Record<Exclude<DrawerPage, 'main'>, string> = {
  catalog: 'Каталог',
  garmin: 'Garmin',
  'garmin-series': 'Смартгодинники за серіями',
  'garmin-purpose': 'Смартгодинники за призначенням',
  accessories: 'Аксесуари до смартгодинників',
  cycling: 'Велокомп’ютери та аксесуари',
  outdoor: 'Ґаджети для активного відпочинку',
};

export const Header = memo(function Header({ showBack = false, title, onSearch }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartCount } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState<DrawerPage>('main');
  const [drawerSearchQuery, setDrawerSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const topPad = Platform.OS === 'web' ? 10 : insets.top + 6;

  const openDrawer = () => {
    setDrawerPage('main');
    setMenuOpen(true);
  };

  const closeDrawer = () => {
    setMenuOpen(false);
    setDrawerPage('main');
  };

  const navigateFromMenu = (item: DrawerItem) => {
    if (item.page) {
      setDrawerPage(item.page);
      return;
    }
    closeDrawer();
    if (item.category) {
      router.push({ pathname: '/catalog', params: { category: item.category } } as never);
    } else if (item.route) {
      router.push(item.route as never);
    }
  };

  const goBackInDrawer = () => {
    const parentPages: Record<Exclude<DrawerPage, 'main' | 'catalog'>, DrawerPage> = {
      garmin: 'catalog',
      'garmin-series': 'garmin',
      'garmin-purpose': 'garmin',
      accessories: 'catalog',
      cycling: 'catalog',
      outdoor: 'catalog',
    };
    if (drawerPage === 'catalog') {
      setDrawerPage('main');
      return;
    }
    if (drawerPage === 'main') return;
    setDrawerPage(parentPages[drawerPage]);
  };

  const handleDrawerSearchSubmit = () => {
    if (drawerSearchQuery.trim()) {
      closeDrawer();
      router.push({ pathname: '/catalog', params: { q: drawerSearchQuery.trim() } } as never);
    }
  };

  const handlePhoneCall = () => {
    void Linking.openURL('tel:+380671022571').catch(() => {});
  };

  const handleTelegram = () => {
    void Linking.openURL('https://t.me/+380671022571').catch(() => {});
  };

  const handleViber = () => {
    void Linking.openURL('viber://chat?number=%2B380671022571').catch(() => {
      void Linking.openURL('https://viber.click/380671022571').catch(() => {});
    });
  };

  const handleWhatsApp = () => {
    void Linking.openURL('https://wa.me/380671022571').catch(() => {});
  };

  const drawerItems = drawerPage === 'main'
    ? MAIN_MENU_ITEMS
    : drawerPage === 'catalog'
      ? CATALOG_MENU_ITEMS
      : drawerPage === 'garmin'
        ? GARMIN_MENU_ITEMS
        : drawerPage === 'garmin-series'
          ? GARMIN_SERIES_ITEMS
          : drawerPage === 'garmin-purpose'
            ? GARMIN_PURPOSE_ITEMS
            : drawerPage === 'accessories'
              ? ACCESSORY_MENU_ITEMS
              : drawerPage === 'cycling'
                ? CYCLING_MENU_ITEMS
                : OUTDOOR_MENU_ITEMS;

  const renderDrawerItem = (item: DrawerItem) => (
    <Pressable
      key={item.label}
      onPress={() => navigateFromMenu(item)}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <Text style={styles.menuLabel}>{item.label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
    </Pressable>
  );

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const onMenuPress = showBack ? handleBackPress : openDrawer;
  const cartDisplayCount = cartCount > 0 ? (cartCount > 9 ? '9+' : String(cartCount)) : '0';

  return (
    <>
      <View style={[styles.container, { paddingTop: topPad }]}> 
        {/* LEFT: BURGER / BACK */}
        <Pressable
          onPress={onMenuPress}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={showBack ? 'Назад' : 'Відкрити меню'}
        >
          <Feather name={showBack ? 'arrow-left' : 'menu'} size={22} color="#FFFFFF" />
        </Pressable>

        {/* CENTER: LOGО */}
        <Pressable onPress={() => router.push('/')} style={styles.logoPressable}>
          <GarminLogo width={110} height={18} color="#FFFFFF" />
        </Pressable>

        {/* RIGHT: SEARCH, CART, PROFILE */}
        <View style={styles.rightActions}>
          <Pressable
            onPress={() => {
              setIsSearchVisible(!isSearchVisible);
              onSearch?.();
            }}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Пошук"
          >
            <Feather name="search" size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/cart')}
            style={styles.cartIconWrapper}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Кошик, товарів: ${cartDisplayCount}`}
          >
            <Feather name="shopping-bag" size={20} color="#FFFFFF" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartDisplayCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Профіль"
          >
            <Feather name="user" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* SEARCH PANEL */}
      {isSearchVisible && (
        <View style={styles.searchPanel}>
          <Feather name="search" size={18} color="#1C1C1E" style={styles.searchPanelIcon} />
          <TextInput
            style={styles.searchPanelInput}
            placeholder="Search garmin.com"
            placeholderTextColor="#6E6E73"
            autoFocus
            returnKeyType="search"
          />
        </View>
      )}

      {/* LEFT DRAWER MODAL */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.modalRoot}>
          {/* DRAWER PANEL (LEFT SIDE) */}
          <View style={[styles.drawer, { paddingTop: topPad + 6 }]}> 
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Меню</Text>
              <Pressable onPress={closeDrawer} hitSlop={8}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </Pressable>
            </View>

            <View style={styles.drawerSearchBox}>
              <Ionicons name="search-outline" size={18} color="#8E8E93" style={styles.searchIcon} />
              <TextInput
                style={styles.drawerSearchInput}
                placeholder="Пошук моделей та аксесуарів..."
                placeholderTextColor="#8E8E93"
                value={drawerSearchQuery}
                onChangeText={setDrawerSearchQuery}
                onSubmitEditing={handleDrawerSearchSubmit}
                returnKeyType="search"
              />
            </View>

            {drawerPage !== 'main' && (
              <View style={styles.drawerPageHeader}>
                <Pressable
                  onPress={goBackInDrawer}
                  style={styles.drawerPageBack}
                  hitSlop={8}
                  accessibilityLabel="Назад у меню"
                >
                  <Ionicons name="arrow-back-outline" size={22} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.drawerPageTitle} numberOfLines={1}>
                  {DRAWER_PAGE_TITLES[drawerPage]}
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.drawerScroll}
              contentContainerStyle={styles.menuList}
              showsVerticalScrollIndicator={false}
            >
              {drawerItems.map(renderDrawerItem)}
            </ScrollView>

            <View style={styles.drawerFooter}>
              <Pressable onPress={() => { closeDrawer(); router.push('/contacts'); }} hitSlop={6}>
                <Text style={styles.drawerFooterTitle}>КОНТАКТИ ТА РЕКВІЗИТИ ›</Text>
              </Pressable>
              <Pressable onPress={handlePhoneCall} hitSlop={6}>
                <Text style={styles.drawerFooterPhone}>067 102-25-71</Text>
              </Pressable>

              <View style={styles.messengerRow}>
                <Pressable
                  onPress={handlePhoneCall}
                  style={({ pressed }) => [styles.messengerBtn, pressed && styles.messengerBtnPressed]}
                  hitSlop={6}
                >
                  <FontAwesome5 name="phone-alt" size={17} color="#FF5500" />
                </Pressable>

                <Pressable
                  onPress={handleTelegram}
                  style={({ pressed }) => [styles.messengerBtn, pressed && styles.messengerBtnPressed]}
                  hitSlop={6}
                >
                  <FontAwesome5 name="telegram-plane" size={21} color="#FF5500" />
                </Pressable>

                <Pressable
                  onPress={handleViber}
                  style={({ pressed }) => [styles.messengerBtn, pressed && styles.messengerBtnPressed]}
                  hitSlop={6}
                >
                  <FontAwesome5 name="viber" size={21} color="#FF5500" />
                </Pressable>

                <Pressable
                  onPress={handleWhatsApp}
                  style={({ pressed }) => [styles.messengerBtn, pressed && styles.messengerBtnPressed]}
                  hitSlop={6}
                >
                  <FontAwesome5 name="whatsapp" size={21} color="#FF5500" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* SCRIM BACKDROP (RIGHT SIDE) */}
          <Pressable style={styles.scrim} onPress={() => setMenuOpen(false)} />
        </View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0B0C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  iconBtn: {
    padding: 4,
  },
  logoPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cartIconWrapper: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#FF6B00',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  searchPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchPanelIcon: {
    marginRight: 8,
  },
  searchPanelInput: {
    flex: 1,
    color: '#1C1C1E',
    fontSize: 15,
    fontFamily: FONTS.regular,
  },

  /* LEFT DRAWER MODAL STYLES */
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    width: 300,
    backgroundColor: '#161618',
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: '#2C2C2E',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  drawerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  drawerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0B0C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    paddingHorizontal: 10,
    marginVertical: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  drawerSearchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  drawerPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  drawerPageBack: {
    padding: 4,
  },
  drawerPageTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  drawerScroll: {
    flex: 1,
  },
  menuList: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#242426',
  },
  menuItemPressed: {
    backgroundColor: '#242426',
  },
  menuLabel: {
    color: '#E5E5EA',
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 14,
    gap: 8,
  },
  drawerFooterTitle: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.5,
  },
  drawerFooterPhone: {
    color: '#FF5500',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  messengerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  messengerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0B0B0C',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messengerBtnPressed: {
    backgroundColor: '#242426',
  },
});

export default Header;
