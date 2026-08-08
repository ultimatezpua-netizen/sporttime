import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { AppProvider } from '@/context/AppContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

if (Platform.OS !== 'web') {
  void SplashScreen.hideAsync();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const queryClient = new QueryClient();
const LAUNCH_SCREEN_DURATION_MS = 3000;
const LAUNCH_PROGRESS_INTERVAL_MS = 100;
const SPLASH_IMAGE = require('../assets/images/splash-screen-localized.png');
const SPLASH_IMAGE_SOURCE =
  Platform.OS === 'web'
    ? { uri: '/assets/?unstable_path=.%2Fassets%2Fimages%2Fsplash-screen-localized.png' }
    : SPLASH_IMAGE;

function RootLayoutNav() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const openNotificationTarget = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as { productId?: unknown; url?: unknown };
      if (typeof data.productId === 'string' && data.productId) {
        router.push({ pathname: '/product/[id]', params: { id: data.productId } });
      } else if (typeof data.url === 'string' && data.url.startsWith('/')) {
        router.push(data.url as never);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(openNotificationTarget);
    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) openNotificationTarget(response);
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="payment" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
      <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="order-confirmation" options={{ headerShown: false }} />
      <Stack.Screen name="order-tracking" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
      <Stack.Screen name="returns" options={{ headerShown: false }} />
      <Stack.Screen name="account-deletion" options={{ headerShown: false }} />
      <Stack.Screen name="contacts" options={{ headerShown: false }} />
      <Stack.Screen name="shipping-payment" options={{ headerShown: false }} />
      <Stack.Screen name="warranty" options={{ headerShown: false }} />
      <Stack.Screen name="order-status" options={{ headerShown: false }} />
      <Stack.Screen name="compare" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const isWeb = Platform.OS === 'web';
  usePushNotifications();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Ionicons.font,
    ...Feather.font,
  });
  const [showLaunchScreen, setShowLaunchScreen] = useState(!isWeb);
  const [launchProgress, setLaunchProgress] = useState(0);
  const launchReady = Platform.OS === 'web' || fontsLoaded || Boolean(fontError);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLaunchProgress(current => {
        if (!launchReady) return Math.min(95, current + 1);
        return Math.min(100, current + (100 / (LAUNCH_SCREEN_DURATION_MS / LAUNCH_PROGRESS_INTERVAL_MS)));
      });
    }, LAUNCH_PROGRESS_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [launchReady]);

  useEffect(() => {
    if (!launchReady || launchProgress < 100) return undefined;
    const timer = setTimeout(() => setShowLaunchScreen(false), 0);
    return () => clearTimeout(timer);
  }, [launchReady, launchProgress]);

  // Web preview can keep the native font loader pending behind the proxied
  // Expo server. Render with the system fallback there; native platforms
  // still wait for the bundled Inter fonts before mounting.
  if (Platform.OS !== 'web' && fontError) {
    return (
      <View style={styles.fontErrorScreen}>
        <Text style={styles.fontErrorTitle}>Не вдалося завантажити шрифти</Text>
        <Text style={styles.fontErrorCopy}>Перезапустіть застосунок і спробуйте ще раз.</Text>
      </View>
    );
  }

  if (!isWeb && !fontsLoaded) return null;

  const appContent = (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );

  return (
    <>
      <SafeAreaProvider>
        <SettingsProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              {isWeb ? appContent : (
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>{appContent}</KeyboardProvider>
                </GestureHandlerRootView>
              )}
            </QueryClientProvider>
          </ErrorBoundary>
        </SettingsProvider>
      </SafeAreaProvider>
      {showLaunchScreen && (
        <View style={styles.launchScreen} pointerEvents="none">
          <Image source={SPLASH_IMAGE_SOURCE} style={styles.launchImage} resizeMode="contain" />
          <View style={styles.launchProgressLayer}>
            <Text style={styles.launchPercent}>{launchProgress}%</Text>
            <View style={styles.launchTrack}>
              <View style={[styles.launchFill, { width: `${launchProgress}%` }]} />
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  launchScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111113',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  launchImage: {
    width: '100%',
    height: '100%',
  },
  launchProgressLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: '7.3%',
    height: '10%',
  },
  launchPercent: {
    marginBottom: 8,
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  launchTrack: {
    width: '34%',
    height: 5,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#D5D8D9',
  },
  launchFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FF6A00',
  },
  fontErrorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0D0D0D',
  },
  fontErrorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  fontErrorCopy: {
    marginTop: 8,
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
  },
});
