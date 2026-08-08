import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { GarminLogo } from './GarminLogo';

interface HeaderProps {
  onMenuPress?: () => void;
  cartCount?: number;
  showBack?: boolean;
  title?: string;
  onSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuPress, cartCount = 0, onSearch }) => {
  const insets = useSafeAreaInsets();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Главная панель шапки */}
      <View style={styles.topBar}>
        {/* Слева: Бургер-меню и Лупа */}
        <View style={styles.leftGroup}>
          <Pressable style={styles.iconBtn} onPress={onMenuPress} hitSlop={8}>
            <Feather name="menu" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              setIsSearchOpen(!isSearchOpen);
              onSearch?.();
            }}
            hitSlop={8}
          >
            <Feather name="search" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Центр: Логотип Garmin */}
        <View style={styles.centerSection}>
          <GarminLogo width={110} height={18} color="#FFFFFF" />
        </View>

        {/* Справа: Профиль и Корзина */}
        <View style={styles.rightGroup}>
          <Pressable style={styles.iconBtn} hitSlop={8}>
            <Feather name="user" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.iconBtn} hitSlop={8}>
            <Feather name="shopping-bag" size={20} color="#FFFFFF" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Выпадающая панель поиска по нажатию на лупу */}
      {isSearchOpen && (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputWrapper}>
            <Feather name="search" size={18} color="#666666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search garmin.com"
              placeholderTextColor="#888888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    flex: 1,
  },
  iconBtn: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#FF6B00',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 2,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 0,
  },
});

export default Header;
