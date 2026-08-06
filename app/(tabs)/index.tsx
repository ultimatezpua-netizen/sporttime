import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { PRODUCTS, formatPrice, Product } from '@/data/products';
import { ProductImage } from '@/components/ProductImage';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import WatchSimulator from '@/components/WatchSimulator';
import { FONTS } from '@/constants/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 18; // ~113.1

const mainSlides = [
  {
    id: 'edge1050-cycling',
    title: 'EDGE® 1050',
    accent: 'PREMIUM CYCLING',
    subtitle: 'ВІДКРИВАЙ НОВІ МАРШРУТИ ТА ДОСЯГАЙ МЕТИ.',
    buttonText: 'ДІЗНАТИСЯ БІЛЬШЕ',
    image: require('../../assets/images/watch-forerunner.png'),
    route: '/catalog',
    badge: 'EDGE 1050',
  },
  {
    id: 'forerunner-running',
    title: 'FORERUNNER® 965',
    accent: 'RUNNING & TRIATHLON',
    subtitle: 'ТВІЙ ТЕМП. ТВІЙ ШЛЯХ. КОЖЕН КРОК ДО ПЕРЕМОГИ.',
    buttonText: 'ОБРАТИ СВІЙ ТЕМП',
    image: require('../../assets/images/watch-fenix.png'),
    route: '/catalog',
    badge: 'FORERUNNER',
  },
  {
    id: 'tactix-tactical',
    title: 'TACTIX® 7 & INSTINCT',
    accent: 'SOLAR & TACTICAL',
    subtitle: 'СТВОРЕНІ ДЛЯ ЕКСТРЕМУ ТА НАДЗВИЧАЙНИХ УМОВ.',
    buttonText: 'ТАКТИЧНА СЕРІЯ',
    image: require('../../assets/images/watch-instinct.png'),
    route: '/catalog',
    badge: 'TACTIX',
  },
];
const PROMO_IMAGE = require('../../assets/images/splash-screen-localized.png');
const PROMO_IMAGE_SOURCE =
  Platform.OS === 'web'
    ? { uri: '/assets/?unstable_path=.%2Fassets%2Fimages/splash-screen-localized.png' }
    : PROMO_IMAGE;

const quickActions = [
  { icon: 'grid-outline', label: 'Каталог', route: '/catalog' },
  { icon: 'star-outline', label: 'Новинки', route: '/catalog' },
  { icon: 'pricetag-outline', label: 'Акции', route: '/catalog' },
  { icon: 'heart-outline', label: 'Обране', route: '/(tabs)/favorites' },
] as const;

const heroOffers = [
  {
    sku: '010-02905-20',
    title: 'FĒNIX 8',
    accent: 'AMOLED',
    tagline: 'БУДЬ БЕЗМЕЖНИМ.',
  },
  {
    sku: '010-02809-00',
    title: 'FORERUNNER 965',
    accent: 'AMOLED',
    tagline: 'ТВІЙ ТЕМП. ТВІЙ ШЛЯХ.',
  },
  {
    sku: '010-02805-13',
    title: 'INSTINCT 2X',
    accent: 'SOLAR',
    tagline: 'СТВОРЕНИЙ ДЛЯ ЕКСТРЕМУ.',
  },
  {
    sku: '010-02784-00',
    title: 'VENU 3',
    accent: 'AMOLED',
    tagline: 'ЗДОРОВʼЯ У ТВОЇХ РУКАХ.',
  },
] as const;

const popularModels = [
  { sku: '010-02905-20', title: 'Fēnix 8', subtitle: 'AMOLED' },
  { sku: '010-02809-00', title: 'Forerunner 965', subtitle: '' },
  { sku: '010-02805-13', title: 'Instinct 2X', subtitle: 'Solar' },
] as const;

function getProduct(sku: string) {
  return PRODUCTS.find(product => product.sku === sku) ?? PRODUCTS[0];
}

export default function HomeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [activeHero, setActiveHero] = useState(0);

  // Main Banner Animated 30-second Slider State & Logic
  const [activeMainSlide, setActiveMainSlide] = useState(0);
  const timerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade-in animation for active slide
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // 15-second countdown timer animation
    timerAnim.setValue(0);
    const animation = Animated.timing(timerAnim, {
      toValue: 1,
      duration: 15000,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        setActiveMainSlide((prev) => (prev + 1) % mainSlides.length);
      }
    });

    return () => {
      animation.stop();
    };
  }, [activeMainSlide]);

  const timerDashOffset = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TIMER_CIRCUMFERENCE],
  });

  const products = popularModels.map(model => ({
    ...model,
    product: getProduct(model.sku),
  }));
  const bottomPad = Platform.OS === 'web' ? 94 : insets.bottom + 90;
  const heroWidth = Math.max(280, screenWidth - 32);

  const openProduct = (product: Product) => {
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
      >
        {/* 1. Garmin Official Style Animated Main Hero Slider */}
        <View style={styles.mainHeroContainer}>
          <Animated.View style={[styles.mainHeroSlideContainer, { opacity: fadeAnim }]}>
            <Image
              source={mainSlides[activeMainSlide].image}
              style={styles.mainHeroImage}
              resizeMode="cover"
            />
            <View style={styles.mainHeroOverlay}>
              <View style={styles.badgeRow}>
                <Text style={styles.mainHeroBadgeText}>{mainSlides[activeMainSlide].badge}</Text>
                <Text style={styles.mainHeroAccent}>{mainSlides[activeMainSlide].accent}</Text>
              </View>
              <Text style={styles.mainHeroTitle}>{mainSlides[activeMainSlide].title}</Text>
              <Text style={styles.mainHeroSubtitle}>{mainSlides[activeMainSlide].subtitle}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.mainHeroBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => router.push(mainSlides[activeMainSlide].route as any)}
              >
                <Text style={styles.mainHeroBtnText}>{mainSlides[activeMainSlide].buttonText}</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* 15-Second Circular Timer Badge in Top Right Corner */}
          <Pressable
            style={styles.timerBadgeContainer}
            onPress={() => setActiveMainSlide((prev) => (prev + 1) % mainSlides.length)}
            hitSlop={8}
          >
            <Svg height="44" width="44" viewBox="0 0 44 44">
              <Circle
                cx="22"
                cy="22"
                r="18"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="3"
                fill="rgba(0, 0, 0, 0.55)"
              />
              <AnimatedCircle
                cx="22"
                cy="22"
                r="18"
                stroke="#FFFFFF"
                strokeWidth="3"
                fill="none"
                strokeDasharray={TIMER_CIRCUMFERENCE}
                strokeDashoffset={timerDashOffset}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
              />
            </Svg>
            <View style={styles.pauseBars}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          </Pressable>

          {/* Slide Indicator Dots */}
          <View style={styles.heroDotsContainer}>
            {mainSlides.map((slide, idx) => (
              <Pressable
                key={slide.id}
                onPress={() => setActiveMainSlide(idx)}
                style={[
                  styles.heroDot,
                  idx === activeMainSlide && styles.heroDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* 2. FĒNIX 8 AMOLED Slider */}
        <View style={[styles.heroCarousel, { width: heroWidth }]}>
          <ScrollView
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
              setActiveHero(Math.max(0, Math.min(heroOffers.length - 1, nextIndex)));
            }}
          >
            {heroOffers.map((offer) => {
              const product = getProduct(offer.sku);
              return (
                <Pressable
                  key={offer.sku}
                  onPress={() => openProduct(product)}
                  style={({ pressed }) => [
                    styles.hero,
                    { width: heroWidth },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.heroCopy}>
                    <Text style={[styles.heroTitle, { color: colors.foreground }]}>{offer.title}</Text>
                    <Text style={[styles.heroAccent, { color: colors.primary }]}>{offer.accent}</Text>
                    <Text style={[styles.heroTagline, { color: '#E6E9EA' }]}>{offer.tagline}</Text>
                    <View style={[styles.heroButton, { backgroundColor: colors.primary }]}>
                      <Text style={styles.heroButtonText}>ДІЗНАТИСЯ БІЛЬШЕ</Text>
                    </View>
                  </View>
                  <ProductImage product={product} style={styles.heroWatch} resizeMode="contain" useRemoteImage />
                  <View style={[styles.heroAvailability, { backgroundColor: product.inStock ? '#123A26' : '#3A1D16' }]}>
                    <View style={[styles.availabilityDot, { backgroundColor: product.inStock ? '#33C56E' : '#F05A4F' }]} />
                    <Text style={[styles.availabilityText, { color: product.inStock ? '#8CE0AC' : '#FF9A8E' }]}>
                      {product.inStock ? 'В наявності' : 'Немає в наявності'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.carouselDots}>
            {heroOffers.map((offer, index) => (
              <View
                key={offer.sku}
                style={[
                  styles.carouselDot,
                  { backgroundColor: index === activeHero ? colors.primary : '#62676B' },
                ]}
              />
            ))}
          </View>
        </View>

        {/* 3. Quick categories */}
        <View style={[styles.quickActions, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {quickActions.map(action => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.route)}
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
            >
              <Ionicons name={action.icon} size={29} color={colors.foreground} />
              <Text
                style={[
                  styles.quickLabel,
                  { color: action.label === 'Каталог' ? colors.primary : colors.foreground },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <WatchSimulator />

        {/* 4. Popular models */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Популярні моделі</Text>
          <Pressable
            onPress={() => router.push('/catalog')}
            style={styles.seeAll}
            hitSlop={8}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Переглянути все</Text>
            <Ionicons name="chevron-forward" size={19} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.productRow}>
          {products.map(({ product }) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/catalog')}
          style={({ pressed }) => [styles.partnerCard, { borderColor: colors.border }, pressed && styles.pressed]}
        >
          <ImageBackground
            source={PROMO_IMAGE_SOURCE}
            resizeMode="cover"
            imageStyle={styles.partnerImage}
            style={styles.partnerBackground}
          >
            <View style={styles.partnerShade} />
            <View style={styles.partnerCopy}>
              <Text style={[styles.partnerTitle, { color: colors.foreground }]}>
                Офіційний партнер{'\n'}GARMIN в Україні
              </Text>
              <Text style={[styles.partnerText, { color: '#D8DDDE' }]}>
                Премиальный опыт.{'\n'}Надежность. Точность.{'\n'}Для активной жизни.
              </Text>
            </View>
          </ImageBackground>
        </Pressable>

        <View style={styles.trustRow}>
          <TrustItem icon="shield-checkmark-outline" title="ОФІЦІЙНА" subtitle="ПРОДУКЦІЯ" colors={colors} />
          <TrustItem icon="car-outline" title="ШВИДКА" subtitle="ДОСТАВКА" colors={colors} />
          <TrustItem icon="ribbon-outline" title="ГАРАНТИЯ" subtitle="2 ГОДА" colors={colors} />
        </View>
      </ScrollView>
    </View>
  );
}

function TrustItem({
  icon,
  title,
  subtitle,
  colors,
}: {
  icon: string;
  title: string;
  subtitle: string;
    colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.trustItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon as any} size={22} color={colors.primary} />
      <View>
        <Text style={[styles.trustTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.trustSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 18,
  },

  /* 1. Garmin Main Hero Banner Slider Styles */
  mainHeroContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  mainHeroSlideContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mainHeroImage: {
    width: '100%',
    height: '100%',
  },
  mainHeroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainHeroBadgeText: {
    backgroundColor: '#FF5500',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: FONTS.bold,
  },
  mainHeroAccent: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: FONTS.bold,
  },
  mainHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textAlign: 'center',
    fontFamily: FONTS.condensedBold,
    textTransform: 'uppercase',
  },
  mainHeroSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D8DDDE',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: FONTS.condensedBold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  mainHeroBtn: {
    backgroundColor: '#FF5500',
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 4,
    elevation: 3,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mainHeroBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: FONTS.condensedBold,
  },
  timerBadgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    opacity: 0.5,
  },
  pauseBars: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBar: {
    width: 2.5,
    height: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  heroDotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  heroDotActive: {
    backgroundColor: '#FF5500',
    width: 20,
  },

  /* 2. Hero Carousel (FĒNIX 8) Styles */
  heroCarousel: {
    alignSelf: 'center',
  },
  hero: {
    minHeight: 184,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    backgroundColor: '#16191B',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroCopy: {
    flex: 1,
    paddingRight: 10,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: FONTS.condensedBold,
    textTransform: 'uppercase',
  },
  heroAccent: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: -2,
    marginBottom: 4,
    letterSpacing: 1.5,
    fontFamily: FONTS.condensedBold,
    textTransform: 'uppercase',
  },
  heroTagline: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    opacity: 0.9,
    marginBottom: 12,
  },
  heroButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: FONTS.condensedBold,
  },
  heroWatch: {
    width: 140,
    height: 140,
  },
  heroAvailability: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  availabilityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  availabilityText: {
    fontSize: 8,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* 3. Quick Actions */
  quickActions: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },

  /* 4. Section Header & Products */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
  },

  /* Partner Banner */
  partnerCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  partnerBackground: {
    minHeight: 140,
    justifyContent: 'center',
    padding: 16,
  },
  partnerImage: {
    borderRadius: 16,
  },
  partnerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  partnerCopy: {
    gap: 6,
    zIndex: 2,
  },
  partnerTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONTS.bold,
  },
  partnerText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONTS.regular,
  },

  /* Trust Items */
  trustRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trustItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    textAlign: 'center',
    gap: 6,
  },
  trustTitle: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  trustSubtitle: {
    fontSize: 9,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  pressed: {
    opacity: 0.9,
  },
});