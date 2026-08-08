import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { getProductById, formatPrice, ProductFeatureBlock, ProductRichSection } from '@/data/products';
import { useApp } from '@/context/AppContext';
import { ProductImage } from '@/components/ProductImage';
import { FONTS } from '@/constants/typography';

const INSTINCT_E_TRANSPARENT = require('../../assets/images/instinct-e-transparent.png');

const BANNERS = [
  require('../../assets/images/banners/banner1.jpg'),
  require('../../assets/images/banners/banner2.jpg'),
  require('../../assets/images/banners/banner3.jpg'),
];

const DEFAULT_PROMO_BANNERS = [
  require('../../assets/images/banners/82308521458585.jpg'),
  require('../../assets/images/banners/90797-POD-HALF-HEALTH.jpg'),
  require('../../assets/images/banners/90797-PODS-THIRD-BOUNCE.jpg'),
];

const DEFAULT_RICH_FEATURES: ProductFeatureBlock[] = [
  { title: 'Сонячна зарядка', description: 'Power Glass™ допомагає продовжити автономність під час активностей.', iconName: 'sunny-outline' },
  { title: 'Міцний дизайн', description: 'Корпус створений для тренувань, походів та щоденного ритму.', iconName: 'shield-checkmark-outline' },
  { title: 'Вбудований ліхтарик', description: 'Швидке світло для нічних пробіжок, кемпінгу або дороги додому.', iconName: 'flashlight-outline' },
  { title: 'Моніторинг сну', description: 'Оцінка сну, відновлення та рекомендації для нового дня.', iconName: 'moon-outline' },
  { title: 'Сповіщення', description: 'Повідомлення зі смартфона прямо на зап’ясті.', iconName: 'notifications-outline' },
  { title: 'Ресурс батареї', description: 'Тривала робота без щоденної зарядки.', iconName: 'battery-charging-outline' },
];


const NAMED_COLOR_HEX: Record<string, string> = {
  black: '#111111', graphite: '#2C2C2E', gray: '#8E8E93', grey: '#8E8E93', slate: '#5B6470', silver: '#C7C7CC', titanium: '#B8B2A6', white: '#F5F5F7', whitestone: '#E5E0D6', ivory: '#F2E8D5', beige: '#D8C3A5', yellow: '#FFD60A', amp: '#D7FF00', orange: '#FF9500', red: '#FF3B30', blue: '#0A84FF', navy: '#0B1F3A', green: '#34C759', pink: '#FF9BCB', purple: '#AF52DE', gold: '#D4AF37', rose: '#B76E79', moss: '#556B2F', flame: '#FF5500',
};

function getColorSwatch(colorName: string, colorHex?: string) {
  if (colorHex && /^#[0-9a-f]{3,8}$/i.test(colorHex)) return colorHex;
  const normalized = colorName.toLowerCase();
  const matchedKey = Object.keys(NAMED_COLOR_HEX).find(key => normalized.includes(key));
  return matchedKey ? NAMED_COLOR_HEX[matchedKey] : '#2C2C2E';
}

const DEFAULT_HEALTH_FEATURES: ProductFeatureBlock[] = [
  { title: 'Щоденний рух', description: 'Кроки, калорії та хвилини інтенсивності.', iconName: 'walk-outline' },
  { title: 'Статус ВСР', description: 'Оцінка відновлення за варіабельністю серцевого ритму.', iconName: 'pulse-outline' },
  { title: 'Частота серця', description: 'Цілодобовий пульс з попередженнями.', iconName: 'heart-outline' },
  { title: 'Стрес-трекінг', description: 'Рівень стресу та дихальні вправи.', iconName: 'leaf-outline' },
  { title: 'Ранковий звіт', description: 'Сон, погода й тренування на одному екрані.', iconName: 'partly-sunny-outline' },
  { title: 'Знімок здоров’я', description: 'Швидкий огляд ключових метрик.', iconName: 'medkit-outline' },
  { title: 'Пульсоксиметр', description: 'Оцінка насичення крові киснем.', iconName: 'water-outline' },
  { title: 'Тренер Garmin', description: 'Адаптивні плани бігу та підказки.', iconName: 'fitness-outline' },
  { title: 'Створення тренувань', description: 'Власні тренування з синхронізацією.', iconName: 'create-outline' },
];

function isProductPhoto(url: string) {
  return !/(banner|promo|баннер|реклама|logo|icon|infographic|характерист)/i.test(url);
}

function BannerAutoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % BANNERS.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const bannerSource = BANNERS[currentIndex];

  return (
    <View style={styles.bannerSliderContainer}>
      <Image
        source={typeof bannerSource === 'string' ? { uri: bannerSource } : bannerSource}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <View style={styles.bannerDots}>
        {BANNERS.map((_, index) => (
          <Pressable
            key={`banner-dot-${index}`}
            onPress={() => setCurrentIndex(index)}
            hitSlop={8}
            style={[
              styles.bannerDot,
              { backgroundColor: currentIndex === index ? '#FF5500' : 'rgba(255, 255, 255, 0.5)' },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart, toggleFavorite, isFavorite, isInCart, cartCount, toggleCompare, isInCompare } = useApp();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const product = getProductById(id ?? '');

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [expandedSpecs, setExpandedSpecs] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const images = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return [product.image];
  }, [product]);

  const cleanDescription = useMemo(() => {
    if (!product?.description) return '';
    return product.description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }, [product]);

  const specifications = useMemo(() => {
    const raw = [
      ...(product?.specs ?? []),
      ...(product?.params ?? []),
      ...(product?.supplementalSpecs ?? []),
      ...(product?.sizes && product.sizes.length > 0 ? [{ key: 'size', label: 'Розмір корпусу', value: product.sizes[selectedSize] ?? product.sizes[0] }] : []),
      ...(product?.material ? [{ key: 'material', label: 'Матеріал', value: product.material }] : []),
      ...(product?.waterResistance && product.waterResistance > 0 ? [{ key: 'water', label: 'Водонепроникність', value: `${product.waterResistance} ATM` }] : []),
      ...(product?.batteryLife ? [{ key: 'battery', label: 'Автономність', value: product.batteryLife }] : []),
    ];

    return raw
      .filter(spec => spec && spec.label && spec.value)
      .filter(spec => !/колір|цвет|color/i.test(spec.label) && !/колір|цвет|color/i.test(spec.key))
      .filter((spec, index, array) => array.findIndex(item => item.label.toLowerCase() === spec.label.toLowerCase()) === index);
  }, [product, selectedSize]);


  const highlights = useMemo(() => {
    const fallback = [
      product?.display ? `${product.display} дисплей для чіткого перегляду даних` : 'AMOLED-дисплей з високою читабельністю',
      product?.solar ? 'Сонячна зарядка для довших пригод' : 'Тривала автономність для тренувань і подорожей',
      product?.gps ? 'Точна навігація та GPS-треки' : 'Смарт-функції для щоденного використання',
      product?.heartRate ? 'Цілодобовий моніторинг пульсу та здоров’я' : 'Спортивні профілі та аналітика активності',
    ];
    return product?.highlights && product.highlights.length > 0 ? product.highlights : fallback;
  }, [product]);

  const richSections = useMemo<ProductRichSection[]>(() => {
    if (product?.richSections && product.richSections.length > 0) return product.richSections;
    return [{ title: 'ЩО ВАМ СПОДОБАЄТЬСЯ', subtitle: 'Ключові можливості Garmin, які відчуваються щодня', features: DEFAULT_RICH_FEATURES }];
  }, [product]);

  const promoBanners = product?.promoBanners && product.promoBanners.length > 0 ? product.promoBanners : DEFAULT_PROMO_BANNERS;
  const healthFeatures = product?.featureGrid && product.featureGrid.length > 0 ? product.featureGrid : DEFAULT_HEALTH_FEATURES;

  const topPad = Platform.OS === 'web' ? 12 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 88 : insets.bottom + 74;

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.foreground }}>Товар не знайдено</Text>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/')} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  const inCart = isInCart(product.id);
  const favorite = isFavorite(product.id);
  const colorsList = product.colors.length > 0 ? product.colors : ['Стандартний'];
  const colorHexes = product.colorHexes ?? [];
  const isInstinctE = product.sku === '010-02932-01';
  const currentImage = images[selectedImage] ?? images[0] ?? product.image;

  const handleAddToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart({
      productId: product.id,
      quantity,
      color: colorsList[selectedColor] ?? colorsList[0],
      size: product.sizes[selectedSize] ?? '',
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={true}
      >
        {/* 1. Top Header Bar */}
        <View style={[styles.topBar, { paddingTop: topPad, backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/')} style={styles.topButton} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#E9E9E9" />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            {product.series === 'Garmin' ? product.category : `Garmin ${product.series}`}
          </Text>
          <View style={styles.topActions}>
            <Pressable onPress={() => {}} style={styles.topButton} hitSlop={8}>
              <Ionicons name="share-outline" size={20} color="#E9E9E9" />
            </Pressable>
            <Pressable
              onPress={() => { toggleFavorite(product.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={styles.topButton}
              hitSlop={8}
            >
              <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? '#FF5500' : '#E9E9E9'} />
            </Pressable>
          </View>
        </View>

        {/* 2. Hero Block: Title, Price & Photo */}
        <View style={styles.heroBlock}>
          <View style={styles.heroLeftCol}>
            <View style={styles.hitBadge}>
              <Ionicons name="star" size={10} color="#FFFFFF" />
              <Text style={styles.hitBadgeText}>ХІТ ПРОДАЖІВ</Text>
            </View>

            <Text style={styles.heroProductTitle} numberOfLines={2}>
              {product.name}
            </Text>

            <View style={styles.heroPriceRow}>
              <Text style={styles.heroPriceText}>{formatPrice(product.price)}</Text>
            </View>
            {product.oldPrice ? (
              <View style={styles.heroOldPriceRow}>
                <Text style={styles.heroOldPriceText}>{formatPrice(product.oldPrice)}</Text>
                <Text style={styles.heroDiscountText}>(-{product.discount || 29}%)</Text>
              </View>
            ) : null}

            <View style={styles.heroTrustList}>
              <View style={styles.heroTrustItem}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#A0A5B1" />
                <Text style={styles.heroTrustText}>Офіційна гарантія 24 місяці</Text>
              </View>
              <View style={styles.heroTrustItem}>
                <Ionicons name="bus-outline" size={14} color="#A0A5B1" />
                <Text style={styles.heroTrustText}>Доставка від 197 грн.</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.whitePhotoCard} onPress={() => setGalleryOpen(true)}>
            <ProductImage
              product={product}
              imageOverride={currentImage}
              style={styles.whiteCardImage}
              resizeMode="contain"
              iconSize={48}
              useLocalFallback={true}
            />
          </Pressable>
        </View>

        {/* 3. Action Buttons Row: Add to Cart & Buy Now */}
        <View style={styles.detailsPurchaseRow}>
          <Pressable
            onPress={handleAddToCart}
            disabled={!product.inStock}
            hitSlop={6}
            style={[styles.detailsCartBtn, { backgroundColor: product.inStock ? '#FF5500' : '#442211' }]}
          >
            <Text style={styles.detailsCartBtnText}>{inCart ? 'У кошику' : 'Додати у кошик'}</Text>
          </Pressable>
          <Pressable
            onPress={handleBuyNow}
            disabled={!product.inStock}
            hitSlop={6}
            style={styles.detailsBuyBtn}
          >
            <Text style={styles.detailsBuyBtnText}>Купити зараз</Text>
          </Pressable>
        </View>

        {/* Warranty link banner */}
        <Pressable
          style={({ pressed }) => [styles.warrantyBannerBox, pressed && { opacity: 0.75 }]}
          onPress={() => router.push('/warranty')}
        >
          <Ionicons name="shield-checkmark-outline" size={16} color="#FF6400" />
          <Text style={styles.warrantyBannerText}>Офіційна гарантія 12-24 міс. • Деталі сервісу ›</Text>
        </Pressable>

        {/* Compare link banner */}
        <Pressable
          style={({ pressed }) => [styles.compareBannerBox, pressed && { opacity: 0.75 }]}
          onPress={() => {
            if (product) toggleCompare(product.id);
            router.push('/compare');
          }}
        >
          <Ionicons name="stats-chart-outline" size={16} color="#FF6400" />
          <Text style={styles.compareBannerText}>
            {product && isInCompare(product.id) ? 'У порівнянні • Відкрити порівняльну таблицю ›' : 'Додати до порівняння характеристик ›'}
          </Text>
        </Pressable>

        {/* 4. Gallery Thumbnails (Moved IMMEDIATELY BELOW action buttons) */}
        <View style={styles.galleryThumbSection}>
          <Text style={styles.galleryThumbHeading}>Галерея фото</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryThumbRow}>
            {images.map((image, index) => (
              <Pressable
                key={image}
                onPress={() => setSelectedImage(index)}
                style={[
                  styles.galleryThumbBox,
                  selectedImage === index && styles.galleryThumbBoxSelected,
                ]}
              >
                <ProductImage
                  product={product}
                  imageOverride={image}
                  style={styles.galleryThumbImg}
                  resizeMode="contain"
                  iconSize={16}
                  useLocalFallback={true}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* 5. Color Selector */}
        <View style={styles.colorSection}>
          <Text style={styles.colorHeading}>Колір</Text>
          <View style={styles.colorThumbRow}>
            {colorsList.map((colorName, index) => (
              <Pressable
                key={colorName}
                onPress={() => setSelectedColor(index)}
                style={[
                  styles.colorThumbCircle,
                  index === selectedColor && styles.colorThumbSelected,
                ]}
              >
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: getColorSwatch(colorName, colorHexes[index]) },
                  ]}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* 6. Specifications & Size Selector */}
        <View style={styles.sizeSpecsSection}>
          <View style={styles.sizeSpecsHeadingRow}>
            <Text style={styles.sizeSpecsTitle}>ХАРАКТЕРИСТИКИ</Text>
            <Pressable onPress={() => setSizeGuideOpen(true)} hitSlop={8}>
              <Text style={styles.sizeGuideLink}>Який розмір вибрати &gt;</Text>
            </Pressable>
          </View>

          <View style={styles.sizeChipsRow}>
            {['43 mm', '47 mm', '51 mm'].map((sz, index) => (
              <Pressable
                key={sz}
                onPress={() => setSelectedSize(index)}
                style={[
                  styles.sizeDarkChip,
                  index === selectedSize && styles.sizeDarkChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.sizeDarkChipText,
                    index === selectedSize && styles.sizeDarkChipTextSelected,
                  ]}
                >
                  {sz}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.specsListContainer}>
            {specifications.slice(0, expandedSpecs ? undefined : 6).map((spec, index) => (
              <View key={spec.key || spec.label} style={[styles.specItemRow, index % 2 === 1 && styles.specItemRowAlt]}>
                <Text style={styles.specItemLabel}>{spec.label}</Text>
                <Text style={styles.specItemValue}>{spec.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 7. Product Description */}
        {cleanDescription ? (
          <View style={styles.descSection}>
            <Text style={styles.descHeading}>Опис</Text>
            <Text style={styles.descBodyText} numberOfLines={expandedDesc ? undefined : 5}>
              {cleanDescription}
            </Text>
            {cleanDescription.length > 180 && (
              <Pressable onPress={() => setExpandedDesc(!expandedDesc)} style={styles.expandLink} hitSlop={8}>
                <Text style={styles.expandLinkText}>{expandedDesc ? 'Згорнути' : 'Читати повністю'}</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {/* 8. Rich Promo Content */}
        <View style={styles.featuresBulletSection}>
          <Text style={styles.featuresHeading}>Головні переваги</Text>
          <View style={styles.highlightList}>
            {highlights.map(item => (
              <View key={item} style={styles.highlightItem}>
                <Ionicons name={'checkmark-circle' as any} size={18} color="#FF5500" />
                <Text style={styles.highlightText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {richSections.map((section, sectionIndex) => (
          <View key={`${section.title}-${sectionIndex}`} style={styles.richSection}>
            {section.bannerImage ? <Image source={typeof section.bannerImage === 'string' ? { uri: section.bannerImage } : section.bannerImage} style={styles.richBannerImage} resizeMode="cover" /> : null}
            <Text style={styles.richSectionTitle}>{section.title}</Text>
            {section.subtitle ? <Text style={styles.richSectionSubtitle}>{section.subtitle}</Text> : null}
            <View style={styles.richCardsGrid}>
              {section.features.map((feature, index) => (
                <View key={`${feature.title}-${index}`} style={styles.richCard}>
                  <View style={styles.richCardImageCircle}>
                    {feature.image ? (
                      <Image source={typeof feature.image === 'string' ? { uri: feature.image } : feature.image} style={styles.richCardImage} resizeMode="cover" />
                    ) : (
                      <ProductImage product={product} imageOverride={images[index % images.length] ?? currentImage} style={styles.richCardImage} resizeMode="contain" iconSize={22} useLocalFallback={true} />
                    )}
                  </View>
                  <Text style={styles.richCardTitle}>{feature.title}</Text>
                  <Text style={styles.richCardDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.promoBannerSection}>
          {promoBanners.map((banner, index) => (
            <Image key={`promo-${index}`} source={typeof banner === 'string' ? { uri: banner } : banner} style={styles.promoBannerImage} resizeMode="cover" />
          ))}
        </View>

        <View style={styles.healthSection}>
          <Text style={styles.healthEyebrow}>ЗДОРОВ'Я ТА ФІТНЕС</Text>
          <Text style={styles.healthTitle}>Функції та датчики для спорту</Text>
          <View style={styles.healthGrid}>
            {healthFeatures.map(feature => (
              <View key={feature.title} style={styles.healthFeatureCard}>
                <View style={styles.healthIconCircle}>
                  <Ionicons name={(feature.iconName || 'ellipse-outline') as any} size={20} color="#FF6400" />
                </View>
                <Text style={styles.healthFeatureTitle}>{feature.title}</Text>
                <Text style={styles.healthFeatureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.fullSpecsSection}>
          <Text style={styles.fullSpecsTitle}>Технічні характеристики</Text>
          <View style={styles.specsListContainer}>
            {specifications.slice(0, expandedSpecs ? undefined : 10).map((spec, index) => (
              <View key={`full-${spec.key || spec.label}`} style={[styles.specItemRow, index % 2 === 1 && styles.specItemRowAlt]}>
                <Text style={styles.specItemLabel}>{spec.label}</Text>
                <Text style={styles.specItemValue}>{spec.value}</Text>
              </View>
            ))}
          </View>
          {specifications.length > 10 ? (
            <Pressable onPress={() => setExpandedSpecs(!expandedSpecs)} style={styles.showAllSpecsButton} hitSlop={8}>
              <Text style={styles.showAllSpecsText}>{expandedSpecs ? 'Сховати характеристики' : 'Показати всі характеристики'}</Text>
            </Pressable>
          ) : null}
        </View>

        {/* 9. Bottom Banner Auto-Slider */}
        <BannerAutoSlider />

      </ScrollView>

      <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === 'web' ? 4 : insets.bottom + 4 }]}>
        {[
          { icon: 'home-outline' as const, label: 'Головна', onPress: () => router.push('/(tabs)') },
          { icon: 'grid-outline' as const, label: 'Каталог', onPress: () => router.push('/catalog') },
          { icon: 'heart-outline' as const, label: 'Обрані', onPress: () => router.push('/(tabs)/favorites') },
          { icon: 'cart-outline' as const, label: 'Кошик', onPress: () => router.push('/(tabs)/cart') },
          { icon: 'person-outline' as const, label: 'Профіль', onPress: () => router.push('/(tabs)/profile') },
        ].map(item => (
          <Pressable key={item.label} onPress={item.onPress} style={styles.bottomNavItem}>
            <Ionicons name={item.icon} size={18} color={item.label === 'Кошик' ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.bottomNavLabel, { color: item.label === 'Кошик' ? colors.primary : colors.mutedForeground }]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Fullscreen Photo Gallery Modal */}
      <Modal
        visible={galleryOpen}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setGalleryOpen(false)}
      >
        <View style={styles.viewer}>
          <FlatList
            data={images}
            keyExtractor={(image, index) => `${image}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImage}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onMomentumScrollEnd={event => {
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setSelectedImage(Math.max(0, Math.min(nextIndex, images.length - 1)));
            }}
            renderItem={({ item, index }) => (
              <View style={[styles.viewerPage, { width: screenWidth, height: screenHeight }]}>
                {isInstinctE ? (
                  <ProductImage
                    product={product}
                    style={styles.viewerImage}
                    resizeMode="contain"
                    localSource={INSTINCT_E_TRANSPARENT}
                    useRemoteImage={false}
                    useLocalFallback={false}
                  />
                ) : (
                  <ProductImage
                    product={product}
                    imageOverride={item}
                    style={styles.viewerImage}
                    resizeMode="contain"
                    iconSize={56}
                    useLocalFallback={false}
                  />
                )}
                <Text style={styles.viewerCounter}>{index + 1} / {images.length}</Text>
              </View>
            )}
          />
          <Pressable
            onPress={() => setGalleryOpen(false)}
            style={[styles.viewerClose, { top: Math.max(insets.top, 18) }]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Закрити галерею"
          >
            <Ionicons name="close" size={27} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.viewerHint, { bottom: Math.max(insets.bottom, 18) }]}>
            Свайпніть, щоб переглянути фото
          </Text>
        </View>
      </Modal>

      {/* Size Guide Modal */}
      <Modal
        visible={sizeGuideOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSizeGuideOpen(false)}
      >
        <View style={styles.sizeModalRoot}>
          <Pressable style={styles.sizeModalScrim} onPress={() => setSizeGuideOpen(false)} />
          <View style={styles.sizeModalContent}>
            <View style={styles.sizeModalHeader}>
              <Text style={styles.sizeModalTitle}>ТАБЛИЦЯ РОЗМІРІВ GARMIN</Text>
              <Pressable onPress={() => setSizeGuideOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={styles.sizeModalText}>
                Обирайте розмір корпусу годинника відповідно до обхвату вашого зап'ястя:
              </Text>

              <View style={styles.sizeTable}>
                <View style={styles.sizeTableRowHeader}>
                  <Text style={[styles.sizeTableCell, styles.sizeTableCellHeader]}>Розмір</Text>
                  <Text style={[styles.sizeTableCell, styles.sizeTableCellHeader]}>Зап'ястя (мм)</Text>
                  <Text style={[styles.sizeTableCell, styles.sizeTableCellHeader]}>Серії Garmin</Text>
                </View>

                <View style={styles.sizeTableRow}>
                  <Text style={[styles.sizeTableCell, { color: '#FF5500', fontWeight: '700' }]}>42 / 43 mm</Text>
                  <Text style={styles.sizeTableCell}>108 - 182 мм</Text>
                  <Text style={styles.sizeTableCell}>Fēnix S, Epix S, Venu</Text>
                </View>

                <View style={[styles.sizeTableRow, styles.sizeTableRowAlt]}>
                  <Text style={[styles.sizeTableCell, { color: '#FF5500', fontWeight: '700' }]}>47 mm</Text>
                  <Text style={styles.sizeTableCell}>125 - 208 мм</Text>
                  <Text style={styles.sizeTableCell}>Fēnix, Epix, Forerunner</Text>
                </View>

                <View style={styles.sizeTableRow}>
                  <Text style={[styles.sizeTableCell, { color: '#FF5500', fontWeight: '700' }]}>51 mm</Text>
                  <Text style={styles.sizeTableCell}>127 - 210 мм</Text>
                  <Text style={styles.sizeTableCell}>Fēnix X, Enduro, Tactix</Text>
                </View>
              </View>

              <Text style={[styles.sizeModalText, { marginTop: 14 }]}>
                💡 Якщо обхват вашого зап'ястя між двома розмірами, для спортмоніторингу краще обирати більший корпус.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeading({ title, action, onActionPress, colors }: { title: string; action?: string; onActionPress?: () => void; colors: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#1A1D24' },
  topButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, color: '#E9E9E9', fontSize: 12, fontFamily: FONTS.semibold, textAlign: 'center' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#0D0D0D',
    gap: 12,
  },
  heroLeftCol: {
    flex: 1,
  },
  hitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF5500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  hitBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: FONTS.condensedBold,
    letterSpacing: 1,
  },
  heroProductTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.8,
    lineHeight: 22,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  heroPriceText: {
    color: '#FF5500',
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  heroOldPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  heroOldPriceText: {
    color: '#777777',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  heroDiscountText: {
    color: '#FF5500',
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  heroTrustList: {
    marginTop: 12,
    gap: 4,
  },
  heroTrustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroTrustText: {
    color: '#A0A5B1',
    fontSize: 11,
  },
  whitePhotoCard: {
    width: 140,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  whiteCardImage: {
    width: '100%',
    height: '100%',
  },
  detailsPurchaseRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    zIndex: 1,
  },
  detailsCartBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCartBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  detailsBuyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  warrantyBannerBox: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 0, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  warrantyBannerText: {
    color: '#FF6400',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  compareBannerBox: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  compareBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  detailsBuyBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  colorHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 10,
  },
  colorThumbRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorThumbCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#333338',
  },
  colorThumbSelected: {
    borderColor: '#FF5500',
    borderWidth: 4,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  sizeSpecsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sizeSpecsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sizeSpecsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  sizeGuideLink: {
    color: '#FF5500',
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  sizeChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  sizeDarkChip: {
    backgroundColor: '#1B1E23',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sizeDarkChipSelected: {
    borderColor: '#FF5500',
  },
  sizeDarkChipText: {
    color: '#888888',
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  sizeDarkChipTextSelected: {
    color: '#FFFFFF',
  },
  specsListContainer: {
    backgroundColor: '#16191E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  specItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#20242B',
  },
  specItemRowAlt: {
    backgroundColor: '#1B1E24',
  },
  specItemLabel: {
    color: '#A0A5B1',
    fontSize: 12,
  },
  specItemValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  descSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  descHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  descBodyText: {
    color: '#C0C5D0',
    fontSize: 13,
    lineHeight: 20,
  },
  expandLink: {
    marginTop: 6,
  },
  expandLinkText: {
    color: '#FF5500',
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  featuresBulletSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  featuresHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  bulletList: {
    gap: 6,
  },
  bulletItem: {
    color: '#C0C5D0',
    fontSize: 13,
    lineHeight: 18,
  },

  highlightList: { gap: 10 },
  highlightItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#16191E', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#242832' },
  highlightText: { flex: 1, color: '#FFFFFF', fontSize: 13, lineHeight: 18, fontFamily: FONTS.medium },
  richSection: { paddingHorizontal: 16, marginBottom: 24 },
  richBannerImage: { width: '100%', height: 170, borderRadius: 18, marginBottom: 18, backgroundColor: '#171717' },
  richSectionTitle: { color: '#FFFFFF', fontSize: 20, lineHeight: 24, fontFamily: FONTS.condensedBold, letterSpacing: 1.1, textAlign: 'center' },
  richSectionSubtitle: { color: '#A0A5B1', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  richCardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  richCard: { width: '31.5%', minWidth: 96, backgroundColor: '#15181D', borderRadius: 16, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#242832' },
  richCardImageCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFFFFF', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  richCardImage: { width: '100%', height: '100%' },
  richCardTitle: { color: '#FFFFFF', fontSize: 11, lineHeight: 14, fontFamily: FONTS.bold, textAlign: 'center' },
  richCardDescription: { color: '#8F96A3', fontSize: 9, lineHeight: 12, textAlign: 'center', marginTop: 4 },
  promoBannerSection: { paddingHorizontal: 16, gap: 14, marginBottom: 24 },
  promoBannerImage: { width: '100%', height: 190, borderRadius: 20, backgroundColor: '#171717' },
  healthSection: { paddingHorizontal: 16, marginBottom: 24 },
  healthEyebrow: { color: '#FF6400', fontSize: 11, fontFamily: FONTS.condensedBold, letterSpacing: 1.2, marginBottom: 5 },
  healthTitle: { color: '#FFFFFF', fontSize: 19, lineHeight: 24, fontFamily: FONTS.condensedBold, letterSpacing: 0.6, marginBottom: 14 },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  healthFeatureCard: { width: '48.5%', backgroundColor: '#15181D', borderRadius: 16, padding: 12, minHeight: 142, borderWidth: 1, borderColor: '#242832' },
  healthIconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,100,0,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  healthFeatureTitle: { color: '#FFFFFF', fontSize: 13, fontFamily: FONTS.bold, marginBottom: 5 },
  healthFeatureDescription: { color: '#A0A5B1', fontSize: 11, lineHeight: 16 },
  fullSpecsSection: { paddingHorizontal: 16, marginBottom: 24 },
  fullSpecsTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: FONTS.condensedBold, letterSpacing: 0.8, marginBottom: 12 },
  showAllSpecsButton: { marginTop: 12, minHeight: 44, borderRadius: 22, borderWidth: 1, borderColor: '#FF6400', alignItems: 'center', justifyContent: 'center' },
  showAllSpecsText: { color: '#FF6400', fontSize: 13, fontFamily: FONTS.bold },
  galleryThumbSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  galleryThumbHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 10,
  },
  galleryThumbRow: {
    gap: 10,
  },
  galleryThumbBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  galleryThumbBoxSelected: {
    borderColor: '#FF5500',
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  bannerSliderContainer: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    height: 180,
    backgroundColor: '#171717',
  },
  bannerImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  bannerSlide: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: 16,
  },
  bannerDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  viewer: { flex: 1, backgroundColor: '#050505' },
  viewerPage: { alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '100%' },
  viewerClose: {
    position: 'absolute',
    right: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  viewerCounter: {
    position: 'absolute',
    bottom: 26,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.semibold,
    backgroundColor: 'rgba(0,0,0,0.58)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  viewerHint: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#B8B8B8',
    fontSize: 11,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 0.3 },
  sectionAction: { fontSize: 11, fontFamily: FONTS.semibold },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 52, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  bottomNavItem: { alignItems: 'center', justifyContent: 'center', minWidth: 50, gap: 2 },
  bottomNavLabel: { fontSize: 8 },

  /* Size Modal Styles */
  sizeModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sizeModalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sizeModalContent: {
    backgroundColor: '#161618',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 20,
    maxHeight: '80%',
  },
  sizeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    paddingBottom: 10,
  },
  sizeModalTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.condensedBold,
    letterSpacing: 1,
  },
  sizeModalText: {
    color: '#A0A5B1',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  sizeTable: {
    marginTop: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    overflow: 'hidden',
  },
  sizeTableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#252528',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333338',
  },
  sizeTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#252528',
  },
  sizeTableRowAlt: {
    backgroundColor: '#1A1A1D',
  },
  sizeTableCell: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  sizeTableCellHeader: {
    color: '#8E8E93',
    fontSize: 10,
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.5,
  },
});