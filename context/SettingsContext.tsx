import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type AppLanguage = 'uk' | 'pl' | 'en';
export type ThemePreference = 'dark' | 'light';

interface SettingsContextValue {
  language: AppLanguage;
  theme: ThemePreference;
  orderNotifications: boolean;
  marketingNotifications: boolean;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: ThemePreference) => void;
  setOrderNotifications: (enabled: boolean) => void;
  setMarketingNotifications: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const LANGUAGE_KEY = '@sporttime/settings/language';
const THEME_KEY = '@sporttime/settings/theme';
const ORDER_NOTIFICATIONS_KEY = '@sporttime/settings/order-notifications';
const MARKETING_NOTIFICATIONS_KEY = '@sporttime/settings/marketing-notifications';

const API_BASE = `${(process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '')}/api`;
const EXPO_PROJECT_ID = '5e36a8ba-3099-4e4a-92c2-c4cdb6ed8916';

async function registerPushToken(preferences: {
  orderNotifications: boolean;
  marketingNotifications: boolean;
}) {
  if (Platform.OS === 'web') return;

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SPORTTIME',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId: EXPO_PROJECT_ID })).data;
  if (!token || !API_BASE) return;

  try {
    await fetch(`${API_BASE}/notifications/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...preferences }),
    });
  } catch {
    // The setting remains local if the API is temporarily unavailable.
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('uk');
  const [theme, setThemeState] = useState<ThemePreference>('dark');
  const [orderNotifications, setOrderNotificationsState] = useState(true);
  const [marketingNotifications, setMarketingNotificationsState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void Promise.all([
      AsyncStorage.getItem(LANGUAGE_KEY),
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(ORDER_NOTIFICATIONS_KEY),
      AsyncStorage.getItem(MARKETING_NOTIFICATIONS_KEY),
    ]).then(([storedLanguage, storedTheme, storedOrder, storedMarketing]) => {
      if (storedLanguage === 'uk' || storedLanguage === 'pl' || storedLanguage === 'en') setLanguageState(storedLanguage);
      if (storedTheme === 'dark' || storedTheme === 'light') setThemeState(storedTheme);
      if (storedOrder !== null) setOrderNotificationsState(storedOrder === 'true');
      if (storedMarketing !== null) setMarketingNotificationsState(storedMarketing === 'true');
      setHydrated(true);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (hydrated) {
      void registerPushToken({ orderNotifications, marketingNotifications }).catch(() => undefined);
    }
  }, [hydrated, orderNotifications, marketingNotifications]);

  const syncPushPreferences = useCallback((next: {
    orderNotifications: boolean;
    marketingNotifications: boolean;
  }) => {
    if (hydrated) void registerPushToken(next).catch(() => undefined);
  }, [hydrated]);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    void AsyncStorage.setItem(LANGUAGE_KEY, next);
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    void AsyncStorage.setItem(THEME_KEY, next);
  }, []);

  const setOrderNotifications = useCallback((enabled: boolean) => {
    setOrderNotificationsState(enabled);
    void AsyncStorage.setItem(ORDER_NOTIFICATIONS_KEY, String(enabled));
    syncPushPreferences({ orderNotifications: enabled, marketingNotifications });
  }, [marketingNotifications, syncPushPreferences]);

  const setMarketingNotifications = useCallback((enabled: boolean) => {
    setMarketingNotificationsState(enabled);
    void AsyncStorage.setItem(MARKETING_NOTIFICATIONS_KEY, String(enabled));
    syncPushPreferences({ orderNotifications, marketingNotifications: enabled });
  }, [orderNotifications, syncPushPreferences]);

  const value = useMemo(() => ({
    language,
    theme,
    orderNotifications,
    marketingNotifications,
    setLanguage,
    setTheme,
    setOrderNotifications,
    setMarketingNotifications,
  }), [
    language,
    theme,
    orderNotifications,
    marketingNotifications,
    setLanguage,
    setTheme,
    setOrderNotifications,
    setMarketingNotifications,
  ]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}