import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { WatchSimulator } from '@/components/WatchSimulator';
import { PRODUCTS } from '@/data/products';
import { FONTS } from '@/constants/typography';
import { Feather, Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HERO_SLIDES = [
  {
    id: '1',
    productId: 'garmin-forerunner-965',
    tag: 'FORERUNNER',
    subTag: 'RUNNING & TRIATHLON',
    title: 'FORERUNNER® 965',
    subtitle: 'Твій темп. Твій шлях. Кожен крок до перемоги.',
    btnText: 'ОБРАТИ СВІЙ ТЕМП',
    image: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?q=80&w=1000&auto=format&fit=crop',
    price: '26 500 ₴',
  },
  {
    id: '2',
    productId: 'garmin-fenix-8-amoled',
    tag: 'FĒNIX 8',
    subTag: 'OUTDOOR & MULTISPORT',
    title: 'FĒNIX® 8 AMOLED',
    subtitle: 'Будь безмежним. Преміальний мультиспорт.',
    btnText: 'ДІЗНАТИСЯ БІЛЬШЕ',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
    price: '43 500 ₴',
  },
];

const PURPOSE_CATEGORIES = [
  { id: 'running', title: 'Для бігу', subtitle: 'Трек та асфальт', icon: 'fitness', category: '1117' },
  { id: 'tactical', title: 'Тактичні', subtitle: 'Надійність', icon: 'shield-checkmark', category: '1116' },
  { id: 'outdoor', title: 'Туризм', subtitle: 'Гори та ліс', icon: 'compass', category: '1088' },
  { id: 'women', title: 'Жіночі', subtitle: 'Стиль та фітнес', icon: 'heart', category: '1114' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  const popularProducts = PRODUCTS.slice(0, 6);

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. HERO BANNERS */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: HERO_SLIDES[activeSlide].image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroDarkOverlay} />
          
          <View style={styles.heroContent}>
            <View style={styles.tagRow}>
              <View style={styles.tagOrange}>
                <Text style={styles.tagOrangeText}>{HERO_SLIDES[activeSlide].tag}</Text>
              </View>
              <View style={styles.tagDark}>
                <Text style={styles.tagDarkText}>{HERO_SLIDES[activeSlide].subTag}</Text>
              </View>
            </View>
            
            <Text style={styles.heroTitle}>{HERO_SLIDES[activeSlide].title}</Text>
            <Text style={styles.heroSubtitle}>{HERO_SLIDES[activeSlide].subtitle}</Text>
            
            <View style={styles.heroPriceRow}>
              <Text style={styles.heroPrice}>{HERO_SLIDES[activeSlide].price}</Text>
              <View style={styles.stockBadge}>
                <View style={styles.stockDot} />
                <Text style={styles.heroInStock}>У наявності</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.heroBtn, pressed && styles.heroBtnPressed]}
              onPress={() => router.push(`/product/${HERO_SLIDES[activeSlide].productId}` as never)}
            >
              <Text style={styles.heroBtnText}>{HERO_SLIDES[activeSlide].btnText}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </Pressable>
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

            <Pressable style={styles.actionItem} onPress={() => router.push({ pathname: '/catalog', params: { isNew: 'true' } } as never)}>
              <View style={[styles.actionIconBox, styles.actionIconBoxActive]}>
                <Ionicons name="sparkles" size={22} color="#FF5500" />
              </View>
              <Text style={styles.actionTextActive}>Новинки</Text>
            </Pressable>

            <Pressable style={styles.actionItem} onPress={() => router.push({ pathname: '/catalog', params: { sale: 'true' } } as never)}>
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
    </View>
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