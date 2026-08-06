import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { getProductById, PRODUCTS, Product } from '@/data/products';
import { ProductImage } from '@/components/ProductImage';

// Default comparative specs generator for Garmin watches
function getWatchSpecs(product: Product) {
  const nameLower = product.name.toLowerCase();

  let battery = '14 днів';
  let display = 'AMOLED Сенсорний';
  let water = '10 ATM (100 м)';
  let maps = 'Попередньо завантажені (Україна + Європа)';
  let size = '47 мм';
  let material = 'Титановий безель + Сапфірове скло';
  let weight = '70 г';
  let flashlight = 'Так (Світлодіодний LED)';
  let musicPay = 'Garmin Pay + Музика (32 ГБ)';

  if (nameLower.includes('fenix 8') || nameLower.includes('fēnix 8')) {
    battery = 'До 29 днів (Solar) / 16 днів (AMOLED)';
    display = 'AMOLED / Sapphire Solar (1.4")';
    water = '10 ATM (100 м) + Занурення до 40 м';
    maps = 'Повні топографічні TopoActive (Wi-Fi)';
    size = product.name.includes('51mm') ? '51 мм' : product.name.includes('43mm') ? '43 мм' : '47 мм';
    material = 'DLC Титан + Сапфірове кришталеве скло';
    weight = '85 г';
    flashlight = 'Так (Яскравий LED з регулюванням)';
    musicPay = 'Garmin Pay + 32 ГБ Музика + Динамік/Мікрофон';
  } else if (nameLower.includes('epix')) {
    battery = 'До 31 дня (Smartwatch mode)';
    display = 'AMOLED Чіткий кольоровий (1.4")';
    water = '10 ATM (100 м)';
    maps = 'Топографічні карти TopoActive';
    size = '51 мм';
    material = 'Титановий корпус + Сапфір';
    weight = '88 г';
    flashlight = 'Так (Вбудований LED)';
    musicPay = 'Garmin Pay + Музика 32 ГБ';
  } else if (nameLower.includes('forerunner 965')) {
    battery = 'До 23 днів';
    display = 'AMOLED Сенсорний 1.4" (454×454)';
    water = '5 ATM (50 м)';
    maps = 'Вбудовані кольорові карти TopoActive';
    size = '47 мм';
    material = 'Титановий безель + Corning Gorilla Glass DX';
    weight = '53 г (Надлегкий для бігу)';
    flashlight = 'Ні (Екранний спалах)';
    musicPay = 'Garmin Pay + Музика 32 ГБ';
  } else if (nameLower.includes('instinct')) {
    battery = 'Необмежено (Сонячна батарея Solar)';
    display = 'Monochrome MIP (Monochrome Solar)';
    water = '10 ATM (100 м) Стандарт MIL-STD-810G';
    maps = 'Точкові треки Breadcrumb (без карт)';
    size = '50 мм (Tactical / Camo)';
    material = 'Армований полімер + Power Glass';
    weight = '67 г';
    flashlight = 'Так (LED Зелений/Білий)';
    musicPay = 'Garmin Pay (без музичного плеєра)';
  } else if (nameLower.includes('venu')) {
    battery = 'До 14 днів';
    display = 'AMOLED Яскравий (1.4")';
    water = '5 ATM (50 м)';
    maps = 'Ні';
    size = '45 мм';
    material = 'Алюмінієвий безель + Gorilla Glass 3';
    weight = '46 г';
    flashlight = 'Ні';
    musicPay = 'Garmin Pay + Музика (8 ГБ)';
  }

  return {
    battery,
    display,
    water,
    maps,
    size,
    material,
    weight,
    flashlight,
    musicPay,
  };
}

export default function CompareScreen() {
  const router = useRouter();
  const { compareList, toggleCompare, clearCompare, addToCart } = useApp();
  const [highlightDiffs, setHighlightDiffs] = useState(true);

  // Suggested default IDs if user has fewer than 2 items selected
  const defaultProductIds = ['fenix-8-51mm', 'epix-pro-gen-2-51mm', 'forerunner-965'];
  const activeIds = compareList.length >= 1 ? compareList.slice(0, 3) : defaultProductIds;

  const compareProducts = activeIds
    .map(id => getProductById(id) || PRODUCTS.find(p => p.id === id))
    .filter((p): p is Product => !!p);

  const productSpecs = compareProducts.map(p => getWatchSpecs(p));

  const specRows = [
    { key: 'battery', label: 'Час роботи акумулятора' },
    { key: 'display', label: 'Дисплей та роздільна здатність' },
    { key: 'water', label: 'Водозахист (Стандарт)' },
    { key: 'maps', label: 'Топографічні карти' },
    { key: 'size', label: 'Розмір корпусу' },
    { key: 'material', label: 'Матеріал безеля та скла' },
    { key: 'weight', label: 'Вага пристрою' },
    { key: 'flashlight', label: 'Вбудований LED-ліхтарик' },
    { key: 'musicPay', label: 'Garmin Pay та Музика' },
  ];

  const handleAddToCart = (product: Product) => {
    addToCart({
      productId: product.id,
      quantity: 1,
      color: product.colors?.[0] || 'Стандарт',
      size: product.sizes?.[0] || '47mm',
    });
    router.push('/(tabs)/cart');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.push('/')}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Порівняння характеристик
        </Text>
        {compareList.length > 0 ? (
          <Pressable onPress={clearCompare} hitSlop={8}>
            <Text style={styles.clearText}>Очистити</Text>
          </Pressable>
        ) : (
          <View style={styles.headerRightPlaceholder} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="stats-chart" size={26} color="#FF6400" />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={styles.bannerTitle}>Порівняльна таблиця Garmin</Text>
              <Text style={styles.bannerSubtitle}>
                Оберіть до 3 моделей для детального порівняння параметрів
              </Text>
            </View>
          </View>

          {/* Highlight Differences Toggle */}
          <View style={styles.toggleRow}>
            <Ionicons name="eye-outline" size={18} color="#FF6400" />
            <Text style={styles.toggleLabel}>Підсвічувати відмінності</Text>
            <Switch
              value={highlightDiffs}
              onValueChange={setHighlightDiffs}
              trackColor={{ false: '#2C2C2E', true: '#FF6400' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Quick Add Model Pills if compareList is small */}
        {compareList.length < 3 && (
          <View style={styles.quickAddCard}>
            <Text style={styles.quickAddTitle}>Додати модель до порівняння:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {PRODUCTS.filter(p => !activeIds.includes(p.id)).slice(0, 6).map(p => (
                <Pressable
                  key={p.id}
                  style={styles.quickChip}
                  onPress={() => toggleCompare(p.id)}
                >
                  <Ionicons name="add" size={14} color="#FF6400" />
                  <Text style={styles.quickChipText}>{p.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Comparison Matrix Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
          <View style={styles.tableContainer}>
            {/* Table Header: Devices Columns */}
            <View style={styles.tableHeaderRow}>
              <View style={styles.featureColumnHeader}>
                <Text style={styles.featureColumnTitle}>Параметр / Модель</Text>
              </View>

              {compareProducts.map(product => (
                <View key={product.id} style={styles.productColumnHeader}>
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => toggleCompare(product.id)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                  </Pressable>

                  <Pressable
                    style={styles.productImageContainer}
                    onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } } as never)}
                  >
                    <ProductImage product={product} style={styles.productImg} resizeMode="contain" iconSize={30} />
                  </Pressable>

                  <Text style={styles.productTitle} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>{product.price.toLocaleString('uk-UA')} ₴</Text>

                  <Pressable
                    style={({ pressed }) => [styles.buyBtn, pressed && styles.pressed]}
                    onPress={() => handleAddToCart(product)}
                  >
                    <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.buyBtnText}>Купити</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Spec Rows */}
            {specRows.map((row, rowIndex) => {
              const values = productSpecs.map(s => s[row.key as keyof typeof s]);
              const isDifferent = new Set(values).size > 1;
              const shouldHighlight = highlightDiffs && isDifferent;

              return (
                <View
                  key={row.key}
                  style={[
                    styles.tableBodyRow,
                    rowIndex % 2 === 1 && styles.tableBodyRowAlt,
                    shouldHighlight && styles.tableBodyRowHighlight,
                  ]}
                >
                  <View style={styles.featureCell}>
                    <Text style={[styles.featureText, shouldHighlight && styles.featureTextHighlight]}>
                      {row.label}
                    </Text>
                  </View>

                  {values.map((val, colIdx) => (
                    <View key={`${row.key}-${colIdx}`} style={styles.productCell}>
                      <Text
                        style={[
                          styles.valueText,
                          shouldHighlight && styles.valueTextHighlight,
                        ]}
                      >
                        {val}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer Note */}
        <View style={styles.footerNoteContainer}>
          <Text style={styles.footerNote}>
            © 2026 GARMIN Sport Time. Офіційні специфікації виробника Garmin Inc.
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
  clearText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '600',
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
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    gap: 12,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 100, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 0, 0.25)',
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  bannerSubtitle: {
    color: '#8E8E93',
    fontSize: 12,
    lineHeight: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#222225',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  quickAddCard: {
    backgroundColor: '#161618',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    gap: 8,
  },
  quickAddTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#222225',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  quickChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tableScroll: {
    marginBottom: 16,
  },
  tableContainer: {
    backgroundColor: '#161618',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1F1F22',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  featureColumnHeader: {
    width: 140,
    padding: 12,
    justifyContent: 'flex-end',
    borderRightWidth: 1,
    borderRightColor: '#2C2C2E',
  },
  featureColumnTitle: {
    color: '#FF6400',
    fontSize: 13,
    fontWeight: '700',
  },
  productColumnHeader: {
    width: 155,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: '#2C2C2E',
    gap: 6,
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
  productImageContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  productTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    height: 36,
  },
  productPrice: {
    color: '#FF6400',
    fontSize: 14,
    fontWeight: '800',
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FF6400',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
    width: '100%',
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tableBodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222225',
  },
  tableBodyRowAlt: {
    backgroundColor: '#19191C',
  },
  tableBodyRowHighlight: {
    backgroundColor: 'rgba(255, 100, 0, 0.08)',
  },
  featureCell: {
    width: 140,
    padding: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#2C2C2E',
  },
  featureText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  featureTextHighlight: {
    color: '#FF6400',
    fontWeight: '700',
  },
  productCell: {
    width: 155,
    padding: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#2C2C2E',
  },
  valueText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
  },
  valueTextHighlight: {
    color: '#FF6400',
    fontWeight: '700',
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
