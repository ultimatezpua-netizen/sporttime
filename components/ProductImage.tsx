import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import { Ionicons } from '@/components/SafeIonicons';
import { useTheme } from '@/hooks/useTheme';
import type { Product } from '@/data/products';

const WATCH_FENIX = require('../assets/images/watch-fenix.png');
const WATCH_FORERUNNER = require('../assets/images/watch-forerunner.png');
const WATCH_INSTINCT = require('../assets/images/watch-instinct.png');
const INSTINCT_E_TRANSPARENT = require('../assets/images/instinct-e-transparent.png');

function getSeriesLocalFallback(product?: Product): any {
  if (!product) return WATCH_FENIX;
  if (product.sku === '010-02932-01') return INSTINCT_E_TRANSPARENT;

  const str = `${product.series || ''} ${product.category || ''} ${product.name || ''}`.toLowerCase();
  if (str.includes('instinct')) return WATCH_INSTINCT;
  if (str.includes('forerunner') || str.includes('runner')) return WATCH_FORERUNNER;
  if (str.includes('fenix') || str.includes('epix') || str.includes('tactix') || str.includes('marq')) return WATCH_FENIX;

  return WATCH_FENIX;
}

export function ProductImage({
  product,
  style,
  resizeMode = 'contain',
  iconSize = 30,
  imageOverride,
  localSource,
  useRemoteImage = true,
  useLocalFallback = true,
}: {
  product: Product;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  iconSize?: number;
  imageOverride?: string;
  localSource?: any;
  useRemoteImage?: boolean;
  useLocalFallback?: boolean;
}) {
  const colors = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imageUri = imageOverride ?? product.images?.[0] ?? product.image;
  const hasRemoteImage = useRemoteImage && Boolean(imageUri);
  const seriesFallback = getSeriesLocalFallback(product);
  const showFallback = !localSource && (!hasRemoteImage || failed);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [imageUri]);

  return (
    <View style={[styles.container, style as any]}>
      {localSource ? (
        <Image source={localSource} style={[styles.image, style]} resizeMode={resizeMode} />
      ) : showFallback && useLocalFallback ? (
        <Image source={seriesFallback} style={[styles.image, style]} resizeMode={resizeMode} />
      ) : showFallback ? (
        <View style={[styles.iconFallback, style, { backgroundColor: colors.muted }]}>
          <Ionicons name="watch-outline" size={iconSize} color={colors.primary} />
        </View>
      ) : null}

      {hasRemoteImage && !failed && (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            style,
            Platform.OS === 'web' ? (styles.whiteBackgroundBlend as any) : null,
          ]}
          resizeMode={resizeMode}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  image: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  whiteBackgroundBlend: { mixBlendMode: 'multiply' as any },
  iconFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
});