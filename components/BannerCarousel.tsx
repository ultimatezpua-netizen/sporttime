import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '@/constants/typography';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_W = SCREEN_W - 32;

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  cta: string;
  bg: string;
  accent: string;
}

const BANNERS: Banner[] = [
  {
    id: '1',
    title: 'Fēnix 8 AMOLED',
    subtitle: 'Новинка сезону. Титановий корпус, AMOLED-дисплей',
     badge: 'НОВИНКА',
    cta: 'Дізнатися більше',
    bg: '#1A1A2E',
    accent: '#FF5500',
  },
  {
    id: '2',
    title: 'Акція -20%',
    subtitle: 'На всі моделі Forerunner. Обмежена кількість!',
     badge: 'АКЦІЯ',
    cta: 'Переглянути',
    bg: '#1E1A0A',
    accent: '#FFD700',
  },
  {
    id: '3',
    title: 'Solar-серія',
    subtitle: 'Годинники з сонячною зарядкою — необмежений ресурс',
    cta: 'Дізнатися більше',
    bg: '#0A1E1A',
    accent: '#22C55E',
  },
  {
    id: '4',
    title: 'Офіційна гарантія 2 роки',
    subtitle: 'SPORTTIME UA — офіційний партнер Garmin в Україні',
    cta: 'Про нас',
    bg: '#1A0A1E',
    accent: '#A78BFA',
  },
];

export function BannerCarousel() {
  const colors = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextSlide = useCallback(() => {
    setActive(prev => {
      const next = (prev + 1) % BANNERS.length;
      scrollRef.current?.scrollTo({ x: next * (BANNER_W + 16), animated: true });
      return next;
    });
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(nextSlide, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [nextSlide]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_W + 16}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 16));
          setActive(Math.min(Math.max(idx, 0), BANNERS.length - 1));
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(nextSlide, 4000);
        }}
      >
        {BANNERS.map(banner => (
          <Pressable
            key={banner.id}
            style={({ pressed }) => [
              styles.banner,
              { width: BANNER_W, backgroundColor: banner.bg },
              pressed && { opacity: 0.9 },
            ]}
          >
            {banner.badge && (
              <View style={[styles.badge, { backgroundColor: banner.accent }]}>
                <Text style={styles.badgeText}>{banner.badge}</Text>
              </View>
            )}
            <Text style={[styles.bannerTitle, { color: '#FFFFFF' }]}>{banner.title}</Text>
            <Text style={[styles.bannerSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>
              {banner.subtitle}
            </Text>
            <View style={[styles.ctaButton, { borderColor: banner.accent }]}>
              <Text style={[styles.ctaText, { color: banner.accent }]}>{banner.cta}</Text>
              <Ionicons name="arrow-forward" size={13} color={banner.accent} />
            </View>

            {/* Decorative circle */}
            <View style={[styles.circle, { borderColor: banner.accent }]} />
            <View style={[styles.circle2, { borderColor: banner.accent }]} />
          </Pressable>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {BANNERS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === active ? '#FF5500' : '#333333',
                width: i === active ? 20 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    padding: 20,
    height: 160,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontFamily: FONTS.condensedBold,
    textTransform: 'uppercase' as const,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    marginBottom: 4,
    letterSpacing: 1.5,
    fontFamily: FONTS.condensedBold,
    textTransform: 'uppercase' as const,
  },
  bannerSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    fontFamily: FONTS.regular,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    fontFamily: FONTS.condensedBold,
  },
  circle: {
    position: 'absolute',
    top: -30,
    right: 60,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    opacity: 0.15,
  },
  circle2: {
    position: 'absolute',
    top: -10,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    opacity: 0.1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
