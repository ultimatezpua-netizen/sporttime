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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { FONTS } from '@/constants/typography';
import GarminLogo from './GarminLogo';

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

  const drawerItems =
    drawerPage === 'main'
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
  const cartDisplayCount = cartCount > 99 ? '99+' : String(cartCount);

  return (
    <>
      <View style={[styles.container, { paddingTop: topPad }]}>
        {/* СЛЕВА: 2 ПЛОТНЫЕ ОРАНЖЕВЫЕ ПОЛОСКИ И ЯРКИЙ ПОИСК */}
        <View style={styles.leftActions}>
          <Pressable
            onPress={onMenuPress}
            style={styles.iconCircleBox}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showBack ? 'Назад' : 'Відкрити меню'}
          >
            {showBack ? (
              <Ionicons name="arrow-back" size={22} color="#FF5500" />
            ) : (
              <View style={styles.twoLinesIcon}>
                <View style={styles.line} />
                <View style={styles.line} />
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setIsSearchVisible(!isSearchVisible);
              onSearch?.();
            }}
            style={styles.iconCircleBox}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Пошук"
          >
            <Ionicons name="search-sharp" size={20} color="#FF5500" />
          </Pressable>
        </View>

        {/* ЦЕНТР: ЛОГОТИП GARMIN */}
        <Pressable onPress={() => router.push('/')} style={styles.logoPressable}>
          <GarminLogo width={130} height={22} color="#FF5500" />
        </Pressable>

        {/* СПРАВА: ПЛОТНАЯ ТЕЛЕЖКА И ПРОФИЛЬ В КРУЖОЧКЕ */}
        <View style={styles.rightActions}>
          <Pressable
            onPress={() => router.push('/(tabs)/cart')}
            style={styles.cartIconWrapper}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Кошик, товарів: ${cartDisplayCount}`}
          >
            <View style={styles.iconCircleBox}>
              <Ionicons name="cart-sharp" size={22} color="#FF5500" />
            </View>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartDisplayCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.profileCircleBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Профіль"
          >
            <Ionicons name="person-sharp" size={17} color="#FF5500" />
          </Pressable>
        </View>
      </View>

      {/* ВЫПАДАЮЩИЙ ПОИСК */}
      {isSearchVisible && (
        <View style={styles.searchPanel}>
          <Ionicons name="search" size={20} color="#FF5500" style={styles.searchPanelIcon} />
          <TextInput
            style={styles.searchPanelInput}
            placeholder="Search garmin.com"
            placeholderTextColor="#8E8E93"
            autoFocus
            returnKeyType="search"
          />
        </View>
      )}

      {/* ШТОРКА МЕНЮ СЛЕВА */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.modalRoot}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.drawerSafeArea}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Меню</Text>
              <Pressable onPress={closeDrawer} hitSlop={8}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </Pressable>
            </View>

            <View style={styles.drawerSearchBox}>
              <Ionicons name="search-outline" size={18} color="#FF5500" style={styles.searchIcon} />
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
          </SafeAreaView>

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
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoLinesIcon: {
    width: 20,
    height: 12,
    justifyContent: 'space-between',
  },
  line: {
    width: 20,
    height: 3,
    backgroundColor: '#FF5500',
    borderRadius: 2,
  },
  logoPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartIconWrapper: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5500',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#0B0B0C',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: FONTS.bold,
  },
  profileCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchPanelIcon: {
    marginRight: 8,
  },
  searchPanelInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.regular,
  },

  /* DRAWER STYLES */
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerSafeArea: {
    width: 300,
    backgroundColor: '#121214',
  },
  drawer: {
    flex: 1,
    backgroundColor: '#121214',
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: '#2C2C2E',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 85, 0, 0.18)',
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
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 0, 0.18)',
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
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 0, 0.08)',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255, 85, 0, 0.12)',
  },
  menuLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 85, 0, 0.18)',
    paddingTop: 16,
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
    backgroundColor: 'rgba(255, 85, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 0, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messengerBtnPressed: {
    backgroundColor: 'rgba(255, 85, 0, 0.18)',
  },
});

export default Header;