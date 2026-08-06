import React from 'react';
import { Platform } from 'react-native';
import { Feather, Ionicons as NativeIonicons } from '@expo/vector-icons';

type IoniconsProps = React.ComponentProps<typeof NativeIonicons>;

const WEB_ICON_MAP: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  'add': 'plus',
  'alert-circle': 'alert-circle',
  'arrow-back-outline': 'arrow-left',
  'arrow-forward': 'arrow-right',
  'bicycle-outline': 'navigation',
  'card-outline': 'credit-card',
  'cart': 'shopping-cart',
  'cart-outline': 'shopping-cart',
  'checkmark': 'check',
  'checkmark-circle': 'check-circle',
  'checkmark-circle-outline': 'check-circle',
  'chevron-back': 'chevron-left',
  'chevron-forward': 'chevron-right',
  'close': 'x',
  'close-circle': 'x-circle',
  'close-circle-outline': 'x-circle',
  'cloud-offline-outline': 'cloud-off',
  'compass-outline': 'compass',
  'cube-outline': 'box',
  'ellipse': 'circle',
  'ellipse-outline': 'circle',
  'funnel-outline': 'filter',
  'gift-outline': 'gift',
  'grid-outline': 'grid',
  'headset-outline': 'headphones',
  'heart': 'heart',
  'heart-outline': 'heart',
  'help-circle-outline': 'help-circle',
  'home-outline': 'home',
  'information-circle-outline': 'info',
  'language-outline': 'globe',
  'logo-android': 'smartphone',
  'logo-apple': 'smartphone',
  'menu-outline': 'menu',
  'megaphone-outline': 'volume-2',
  'moon-outline': 'moon',
  'notifications-outline': 'bell',
  'options-outline': 'sliders',
  'person': 'user',
  'person-outline': 'user',
  'pricetag-outline': 'tag',
  'remove': 'minus',
  'receipt-outline': 'file-text',
  'search-outline': 'search',
  'settings-outline': 'settings',
  'shield-checkmark-outline': 'shield',
  'star': 'star',
  'star-outline': 'star',
  'sunny-outline': 'sun',
  'trash-outline': 'trash-2',
  'watch-outline': 'watch',
  'x': 'x',
};

/**
 * Ionicons is kept for native builds. Expo Web can mount before the
 * Ionicons font asset is ready, which renders missing glyphs as squares, so
 * the browser uses the already-supported Feather font instead.
 */
export function Ionicons(props: IoniconsProps) {
  if (Platform.OS !== 'web') {
    return <NativeIonicons {...props} />;
  }

  const { name, ...rest } = props;
  return (
    <Feather
      {...(rest as React.ComponentProps<typeof Feather>)}
      name={WEB_ICON_MAP[String(name)] ?? 'circle'}
    />
  );
}
