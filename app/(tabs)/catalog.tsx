import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@/components/SafeIonicons';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { formatPrice, Product, PRODUCTS, Series } from '@/data/products';
import { FONTS } from '@/constants/typography';

type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'rating';

const SORT_LABELS: Record<SortOption, string> = {
  popular: 'Популярні',
  price_asc: 'Спочатку дешевші',
  price_desc: 'Спочатку дорожчі',
  rating: 'За рейтингом',
};

const SERIES_CHIPS: Series[] = ['Fenix', 'Forerunner', 'Instinct', 'Epix', 'Venu', 'Tactix'];
const SERIES_PRIORITY: Record<string, number> = {
  Fenix: 6,
  Forerunner: 5,
  Instinct: 4,
  Venu: 3,
  Epix: 2,
  Tactix: 1,
};

type CatalogCategoryKey = 'all' | 'watches' | 'watch-accessories';

type CatalogTag = {
  key: string;
  label: string;
  type: 'all' | 'sale' | 'series' | 'category';
  series?: Series;
  category?: CatalogCategoryKey;
};

const CATALOG_TAGS: CatalogTag[] = [
  { key: 'all', label: 'Усі', type: 'all' },
  { key: 'sale', label: '🔥 Акції', type: 'sale' },
  { key: 'Fenix', label: 'Fenix', type: 'series', series: 'Fenix' },
  { key: 'Forerunner', label: 'Forerunner', type: 'series', series: 'Forerunner' },
  { key: 'Instinct', label: 'Instinct', type: 'series', series: 'Instinct' },
  { key: 'Epix', label: 'Epix', type: 'series', series: 'Epix' },
  { key: 'Venu', label: 'Venu', type: 'series', series: 'Venu' },
  { key: 'Tactix', label: 'Tactix', type: 'series', series: 'Tactix' },
  { key: 'accessories', label: 'Аксесуари', type: 'category', category: 'watch-accessories' },
];

function extractFacetOptions(products: Product[]) {
  const sizeSet = new Set<string>();
  const materialSet = new Set<string>();

  products.forEach(p => {
    (p.sizes || []).forEach(s => sizeSet.add(s));
    if (p.material) materialSet.add(p.material);
  });

  return [
    { key: 'size', label: 'Розмір корпусу', options: Array.from(sizeSet) },
    { key: 'material', label: 'Матеріал безеля / корпусу', options: Array.from(materialSet) },
  ].filter(f => f.options.length > 0);
}

export default function CatalogScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { compareList } = useApp();
  const searchInputRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{ q?: string; series?: string; category?: string }>();

  const initialSeries = params.series && SERIES_CHIPS.includes(params.series as Series) ? (params.series as Series) : null;
  const initialCategory: CatalogCategoryKey = params.category === 'watch-accessories' ? 'watch-accessories' : 'all';

  const [selectedCategory, setSelectedCategory] = useState<CatalogCategoryKey>(initialCategory);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(initialSeries);
  const [showOnlySale, setShowOnlySale] = useState(false);
  const [searchQuery, setSearchQuery] = useState(params.q ?? '');
  const [sort, setSort] = useState<SortOption>('popular');

  const [showAmoled, setShowAmoled] = useState(false);
  const [showSolar, setShowSolar] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string | undefined>>({});

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 100 : insets.bottom + 92;

  const handleHeaderSearch = () => {
    searchInputRef.current?.focus();
  };

  const handleTagPress = (tag: CatalogTag) => {
    if (tag.type === 'all') {
      setSelectedCategory('all');
      setSelectedSeries(null);
      setShowOnlySale(false);
    } else if (tag.type === 'sale') {
      setShowOnlySale(current => !current);
      setSelectedCategory('all');
      setSelectedSeries(null);
    } else if (tag.type === 'series' && tag.series) {
      setShowOnlySale(false);
      setSelectedCategory('watches');
      setSelectedSeries(current => current === tag.series ? null : tag.series!);
    } else if (tag.type === 'category' && tag.category) {
      setShowOnlySale(false);
      setSelectedCategory(current => current === tag.category ? 'all' : tag.category!);
      setSelectedSeries(null);
    }
  };

  const isTagSelected = (tag: CatalogTag) => {
    if (tag.type === 'all') {
      return selectedCategory === 'all' && selectedSeries === null && !showOnlySale;
    }
    if (tag.type === 'sale') {
      return showOnlySale;
    }
    if (tag.type === 'series') {
      return selectedSeries === tag.series;
    }
    if (tag.type === 'category') {
      return selectedCategory === tag.category;
    }
    return false;
  };

  const resetFilters = () => {
    setShowAmoled(false);
    setShowSolar(false);
    setShowInStock(false);
    setShowOnlySale(false);
    setSelectedFacets({});
    setSelectedSeries(null);
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const activeFiltersCount =
    (showAmoled ? 1 : 0) +
    (showSolar ? 1 : 0) +
    (showInStock ? 1 : 0) +
    (showOnlySale ? 1 : 0) +
    Object.values(selectedFacets).filter(Boolean).length;

  const facetOptions = useMemo(() => extractFacetOptions(PRODUCTS), []);

  const filtered = useMemo(() => {
    let result = PRODUCTS;

    if (showOnlySale) {
      result = result.filter(
        p => (p.oldPrice && p.oldPrice > p.price) || (p.discount && p.discount > 0),
      );
    }

    if (selectedCategory === 'watch-accessories') {
      result = result.filter(p => p.categoryPath.includes('Аксесуари до смартгодинників'));
    }

    if (selectedSeries) {
      result = result.filter(p => p.series === selectedSeries);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.series.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      );
    }

    if (showAmoled) {
      result = result.filter(
        p => p.name.toLowerCase().includes('amoled') || p.display?.toLowerCase().includes('amoled'),
      );
    }

    if (showSolar) {
      result = result.filter(
        p => p.solar || p.name.toLowerCase().includes('solar') || p.display?.toLowerCase().includes('solar'),
      );
    }

    if (showInStock) {
      result = result.filter(p => p.inStock);
    }

    if (selectedFacets.size) {
      result = result.filter(p => p.sizes?.includes(selectedFacets.size!));
    }
    if (selectedFacets.material) {
      result = result.filter(p => p.material === selectedFacets.material);
    }

    const sorted = [...result];
    switch (sort) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
      default:
        sorted.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          const pA = SERIES_PRIORITY[a.series] ?? 0;
          const pB = SERIES_PRIORITY[b.series] ?? 0;
          return pB - pA;
        });
        break;
    }

    return sorted;
  }, [
    showOnlySale,
    selectedCategory,
    selectedSeries,
    searchQuery,
    showAmoled,
    showSolar,
    showInStock,
    selectedFacets,
    sort,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header onSearch={handleHeaderSearch} />

      {/* Simplified Minimalist Sticky Top Header */}
      <View style={[styles.stickyHeader, { paddingTop: topPad + 6, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {/* Search input with compact right icons */}
        <View style={[styles.searchBox, { backgroundColor: '#1C1C1E' }]}>
          <Ionicons name="search-outline" size={19} color="#8E8E93" />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: '#FFFFFF' }]}
            placeholder="Пошук товарів Garmin..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6} style={{ marginRight: 4 }}>
              <Ionicons name="close-circle" size={17} color="#8E8E93" />
            </Pressable>
          ) : null}

          <View style={styles.searchRightIcons}>
            <Pressable
              onPress={() => {
                setShowSortMenu(current => !current);
                setShowFilters(false);
              }}
              style={[
                styles.iconBtn,
                showSortMenu && { backgroundColor: '#FF5500', borderColor: '#FF5500' },
              ]}
              hitSlop={6}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={showSortMenu ? '#FFFFFF' : '#EBEBF5'}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                setShowFilters(current => !current);
                setShowSortMenu(false);
              }}
              style={[
                styles.iconBtn,
                showFilters && { backgroundColor: '#FF5500', borderColor: '#FF5500' },
              ]}
              hitSlop={6}
            >
              <Ionicons
                name="funnel-outline"
                size={18}
                color={showFilters ? '#FFFFFF' : '#EBEBF5'}
              />
              {activeFiltersCount > 0 && <View style={styles.badgeDot} />}
            </Pressable>
          </View>
        </View>

        {/* Single Horizontal Scroll View of Minimal Category/Series Tags */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagScrollRow}
        >
          {CATALOG_TAGS.map(tag => {
            const active = isTagSelected(tag);
            return (
              <Pressable
                key={tag.key}
                onPress={() => handleTagPress(tag)}
                style={[
                  styles.tagChip,
                  active ? styles.tagChipActive : styles.tagChipInactive,
                ]}
              >
                <Text style={[styles.tagChipText, active ? styles.tagTextActive : styles.tagTextInactive]}>
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Compact Dropdown Menus */}
        {showSortMenu && (
          <View style={[styles.sortMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(Object.keys(SORT_LABELS) as SortOption[]).map(option => (
              <Pressable
                key={option}
                onPress={() => {
                  setSort(option);
                  setShowSortMenu(false);
                }}
                style={[styles.sortMenuItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.sortMenuText, { color: sort === option ? colors.primary : colors.foreground }]}>
                  {SORT_LABELS[option]}
                </Text>
                {sort === option && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
        )}

        {showFilters && (
          <View style={[styles.filterPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.filterPanelHeader}>
              <Text style={[styles.filterPanelTitle, { color: colors.foreground }]}>Фільтри каталогу</Text>
              {activeFiltersCount > 0 && (
                <Pressable onPress={resetFilters} hitSlop={8}>
                  <Text style={[styles.clearText, { color: colors.primary }]}>Скинути</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.filterOptions}>
              <FilterOption label="AMOLED" active={showAmoled} onPress={() => setShowAmoled(current => !current)} colors={colors} />
              <FilterOption label="Solar" active={showSolar} onPress={() => setShowSolar(current => !current)} colors={colors} icon="sunny-outline" />
              <FilterOption label="В наявності" active={showInStock} onPress={() => setShowInStock(current => !current)} colors={colors} icon="checkmark-circle-outline" />
            </View>
            {facetOptions.map(facet => (
              <View key={facet.key} style={styles.facetGroup}>
                <Text style={[styles.facetLabel, { color: colors.mutedForeground }]}>{facet.label}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.facetOptions}>
                  {facet.options.map(value => {
                    const active = selectedFacets[facet.key] === value;
                    return (
                      <Pressable
                        key={value}
                        onPress={() => setSelectedFacets(current => ({
                          ...current,
                          [facet.key]: active ? undefined : value,
                        }))}
                        style={[
                          styles.facetChip,
                          {
                            backgroundColor: active ? colors.primary : colors.secondary,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.facetChipText, { color: active ? colors.primaryForeground : colors.foreground }]} numberOfLines={1}>
                          {value}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </View>
        )}

        {/* Minimal Results Counter */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            Знайдено <Text style={styles.resultsCount}>{filtered.length}</Text> товарів
          </Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={product => product.id}
        contentContainerStyle={[styles.list, { paddingBottom: compareList.length > 0 ? bottomPad + 60 : bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={filtered.length > 0}
        renderItem={({ item }) => (
          <ProductCard product={item} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={54} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Нічого не знайдено</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Спробуйте змінити запит або скинути фільтри.
            </Text>
          </View>
        }
      />

      {compareList.length > 0 && (
        <Pressable
          style={styles.floatingCompareBar}
          onPress={() => router.push('/compare' as never)}
        >
          <Ionicons name="git-compare-outline" size={19} color="#FFFFFF" />
          <Text style={styles.floatingCompareText}>
            Порівняння ({compareList.length})
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  );
}

function FilterOption({
  label,
  active,
  onPress,
  colors,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterOption,
        {
          backgroundColor: active ? colors.primary : colors.secondary,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={active ? colors.primaryForeground : colors.foreground}
        />
      ) : null}
      <Text
        style={[
          styles.filterOptionText,
          { color: active ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: { paddingHorizontal: 16, paddingBottom: 6, borderBottomWidth: 1, gap: 8, marginBottom: 16 },
  searchBox: {
    height: 44,
    borderRadius: 12,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    fontFamily: FONTS.regular,
  },
  searchRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 0,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF5500',
  },
  tagScrollRow: {
    gap: 8,
    paddingRight: 16,
    paddingVertical: 4,
  },
  tagChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagChipActive: {
    backgroundColor: '#FF5500',
    borderColor: '#FF5500',
  },
  tagChipInactive: {
    backgroundColor: '#1C1C1E',
    borderColor: '#3A3A3C',
  },
  tagChipText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  tagTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tagTextInactive: {
    color: '#EBEBF5',
    fontWeight: '500',
  },
  sortMenu: { borderRadius: 11, borderWidth: 1, overflow: 'hidden', marginTop: 4 },
  sortMenuItem: {
    minHeight: 45,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  sortMenuText: { fontSize: 14, fontFamily: FONTS.medium },
  filterPanel: { borderRadius: 11, borderWidth: 1, padding: 13, gap: 12, marginTop: 4 },
  filterPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterPanelTitle: { fontSize: 14, fontFamily: FONTS.bold },
  clearText: { fontSize: 13, fontFamily: FONTS.semibold },
  filterOptions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  facetGroup: { gap: 7 },
  facetLabel: { fontSize: 12, fontFamily: FONTS.semibold },
  facetOptions: { gap: 7, paddingRight: 4 },
  facetChip: {
    maxWidth: 230,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  facetChipText: { fontSize: 12, fontFamily: FONTS.medium },
  filterOption: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterOptionText: { fontSize: 13, fontFamily: FONTS.medium },
  resultsBar: {
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 4,
  },
  resultsText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: FONTS.regular,
  },
  resultsCount: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  list: { paddingHorizontal: 16, paddingTop: 6, gap: 9 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24, gap: 10 },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.bold },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  floatingCompareBar: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#FF5500',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 26,
    gap: 8,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 999,
  },
  floatingCompareText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});