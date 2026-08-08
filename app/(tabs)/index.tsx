import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import WatchSimulator from '@/components/WatchSimulator';
import { PRODUCTS } from '@/data/products';
import { FONTS } from '@/constants/typography';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FLAGSHIP_SERIES = ['Fenix', 'Forerunner', 'Epix', 'Enduro', 'Tactix', 'MARQ'];
const FLAGSHIP_NAME_RE = /(fenix|fēnix|forerunner\s*965|epix|enduro|tactix|marq)/i;
const ACCESSORY_RE = /(ремінець|ремеш|strap|захис|скло|glass|charger|заряд|кріплення|mount|bezel|датчик|sensor)/i;

const buildHeroSlides = () => PRODUCTS
  .filter(product =>
    FLAGSHIP_SERIES.includes(product.series) &&
    FLAGSHIP_NAME_RE.test(product.name) &&
    !ACCESSORY_RE.test([product.name, product.category, ...product.categoryPath].join(' ')) &&
    Array.isArray(product.images) &&
    product.images.length > 0,
  )
  .slice(0, 4)
  .map((product, index) => ({
    id: product.id,
    productId: product.id,
    tag: product.series.toUpperCase(),
    subTag: index % 2 === 0 ? 'PREMIUM SMARTWATCH' : 'OUTDOOR & MULTISPORT',
    title: product.name,
    subtitle: product.series === 'Forerunner'
      ? 'Твій темп. Твій шлях. Кожен крок до перемоги.'
      : 'Флагманські Garmin для тренувань, пригод і щоденного ритму.',
    btnText: index === 0 ? 'ДІЗНАТИСЯ БІЛЬШЕ' : 'ОБРАТИ МОДЕЛЬ',
    image: product.images[0],
    price: `${product.price.toLocaleString('uk-UA')} ₴`,
    inStock: product.inStock ?? true,
  }));

const PURPOSE_CATEGORIES = [
  { id: 'running', title: 'Для бігу', subtitle: 'Трек та асфальт', icon: 'fitness', category: 'running' },
  { id: 'tactical', title: 'Тактичні', subtitle: 'Надійність', icon: 'shield-checkmark', category: 'tactical' },
  { id: 'outdoor', title: 'Туризм', subtitle: 'Гори та ліс', icon: 'compass', category: 'outdoor' },
  { id: 'women', title: 'Жіночі', subtitle: 'Стиль та фітнес', icon: 'female', category: 'women' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const heroListRef = useRef<FlatList<ReturnType<typeof buildHeroSlides>[number]>>(null);
  const heroSlides = useMemo(buildHeroSlides, []);

  useEffect(() => {
    if (heroSlides.length < 2) return;

    const timer = setInterval(() => {
      setActiveSlide(current => {
        const next = (current + 1) % heroSlides.length;
        heroListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const popularProducts = PRODUCTS.slice(0, 6);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. HERO BANNERS */}
        <View style={styles.heroSection}>
          <FlatList
            ref={heroListRef}
            data={heroSlides}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event => setActiveSlide(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
            renderItem={({ item }) => (
              <View style={styles.heroSlide}>
                <Image source={{ uri: item.image }} style={styles.heroImage} resizeMode="cover" />
              </View>
            )}
          />
          <View style={styles.heroDarkOverlay} />
          
          <View style={styles.heroContent}>
            <View style={styles.tagRow}>
              <View style={styles.tagOrange}>
                <Text style={styles.tagOrangeText}>{heroSlides[activeSlide].tag}</Text>
              </View>
              <View style={styles.tagDark}>
                <Text style={styles.tagDarkText}>{heroSlides[activeSlide].subTag}</Text>
              </View>
            </View>
            
            <Text style={styles.heroTitle}>{heroSlides[activeSlide].title}</Text>
            <Text style={styles.heroSubtitle}>{heroSlides[activeSlide].subtitle}</Text>
            
            <View style={styles.heroPriceRow}>
              <Text style={styles.heroPrice}>{heroSlides[activeSlide].price}</Text>
              <View style={styles.stockBadge}>
                <View style={styles.stockDot} />
                <Text style={styles.heroInStock}>{heroSlides[activeSlide].inStock ? 'У наявності' : 'Під замовлення'}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.heroBtn, pressed && styles.heroBtnPressed]}
              onPress={() => router.push(`/product/${heroSlides[activeSlide].productId}` as never)}
            >
              <Text style={styles.heroBtnText}>{heroSlides[activeSlide].btnText}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </Pressable>
          </View>
          <View style={styles.heroDots}>
            {heroSlides.map((slide, index) => (
              <Pressable
                key={`hero-dot-${slide.id}`}
                onPress={() => { setActiveSlide(index); heroListRef.current?.scrollToIndex({ index, animated: true }); }}
                style={[styles.heroDot, index === activeSlide && styles.heroDotActive]}
                hitSlop={8}
              />
            ))}
          </View>
        </View>

        {/* 2. FLOATING QUICK ACTIONS */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActions}>
            <Pressable style={styles.actionItem} onPress={() => router.push('/catalog' as never)}>
              <View style={styles.actionIconBox}>
                <Ionicons name="grid" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Каталог</Text>
            </Pressable>

            <Pressable style={styles.actionItem} onPress={() => router.push({ pathname: '/catalog', params: { isNew: '1' } } as never)}>
              <View style={[styles.actionIconBox, styles.actionIconBoxActive]}>
                <Ionicons name="sparkles" size={22} color="#FF5500" />
              </View>
              <Text style={styles.actionTextActive}>Новинки</Text>
            </Pressable>

            <Pressable style={styles.actionItem} onPress={() => router.push({ pathname: '/catalog', params: { sale: '1' } } as never)}>
              <View style={styles.actionIconBox}>
                <Ionicons name="pricetag" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Акції</Text>
            </Pressable>

            <Pressable style={styles.actionItem} onPress={() => router.push('/(tabs)/favorites' as never)}>
              <View style={styles.actionIconBox}>
                <Ionicons name="heart" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Обране</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. SIMULATOR CARD */}
        <View style={styles.simulatorWrapper}>
          <View style={styles.simulatorCard}>
            <View style={styles.simulatorHeader}>
              <View>
                <Text style={styles.simulatorTitle}>Відчуй на дотик</Text>
                <Text style={styles.simulatorSubtitle}>Спробуй інтерактивний інтерфейс</Text>
              </View>
              <View style={styles.simulatorBadge}>
                <Ionicons name="hand-left" size={14} color="#FF5500" />
                <Text style={styles.simulatorBadgeText}>3D Огляд</Text>
              </View>
            </View>
            <WatchSimulator />
          </View>
        </View>

        {/* 4. PURPOSE CATEGORIES */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Підбір за призначенням</Text>
          <View style={styles.purposeGrid}>
            {PURPOSE_CATEGORIES.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.purposeCard, pressed && styles.purposeCardPressed]}
                onPress={() => router.push({ pathname: '/catalog', params: { category: item.category } } as never)}
              >
                <View style={styles.purposeIconWrapper}>
                  <Ionicons name={item.icon as never} size={20} color="#FF5500" />
                </View>
                <View>
                  <Text style={styles.purposeText}>{item.title}</Text>
                  <Text style={styles.purposeSub}>{item.subtitle}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 5. POPULAR PRODUCTS */}
        <View style={[styles.sectionContainer, { marginTop: 32 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Хіти продажу</Text>
            <Pressable onPress={() => router.push('/catalog' as never)} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>Всі моделі</Text>
              <Ionicons name="chevron-forward" size={14} color="#FF5500" />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalProducts}>
            {popularProducts.map((product) => (
              <View key={product.id} style={styles.productCardSlot}>
                <ProductCard product={product} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 6. TRUST BAR */}
        <View style={styles.trustBarWrapper}>
          <View style={styles.trustBar}>
            <View style={styles.trustItem}>
              <Feather name="shield" size={20} color="#8E8E93" />
              <Text style={styles.trustText}>Гарантія 24 міс.</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Feather name="truck" size={20} color="#8E8E93" />
              <Text style={styles.trustText}>Швидка доставка</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Feather name="check-circle" size={20} color="#8E8E93" />
              <Text style={styles.trustText}>100% Оригінал</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  heroSection: {
    height: 480,
    position: 'relative',
  },
  heroSlide: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 5, 0.65)',
  },
  heroContent: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 60,
    zIndex: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagOrange: {
    backgroundColor: '#FF5500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagOrangeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tagDarkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: '#A1A1AA',
    fontSize: 14,
    marginTop: 6,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  heroPrice: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  heroInStock: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: '700',
  },
  heroBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF5500',
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 30,
    marginTop: 20,
  },
  heroBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  heroDots: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 3,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },
  heroDotActive: {
    width: 24,
    backgroundColor: '#FF5500',
  },
  quickActionsContainer: {
    marginTop: -35,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121214',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1F1F22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBoxActive: {
    backgroundColor: 'rgba(255, 85, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 0, 0.3)',
  },
  actionText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#FF5500',
    fontSize: 11,
    fontWeight: '700',
  },
  simulatorWrapper: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  simulatorCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  simulatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  simulatorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  simulatorSubtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    marginTop: 4,
  },
  simulatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 85, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  simulatorBadgeText: {
    color: '#FF5500',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FONTS.bold,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#FF5500',
    fontSize: 13,
    fontWeight: '600',
  },
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  purposeCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#121214',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  purposeCardPressed: {
    backgroundColor: '#1F1F22',
  },
  purposeIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 85, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purposeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  purposeSub: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
  horizontalProducts: {
    gap: 16,
    paddingRight: 16,
  },
  productCardSlot: {
    width: 260,
  },
  trustBarWrapper: {
    paddingHorizontal: 16,
    marginTop: 40,
  },
  trustBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  trustDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#27272A',
  },
  trustText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});