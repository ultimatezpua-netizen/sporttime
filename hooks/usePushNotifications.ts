import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notification handling behavior when app is open (Foreground handler)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Check device compatibility, request permissions, set up Android channels,
 * and obtain the Expo Push Token for push notifications.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;

  // Set up Android high priority notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6400',
    });
  }

  // Push notifications require a physical device or Expo Go
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission granted status:', finalStatus);
      return undefined;
    }

    try {
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: '5e36a8ba-3099-4e4a-92c2-c4cdb6ed8916',
      });
      return pushToken.data;
    } catch (error) {
      console.error('Error fetching Expo Push Token:', error);
      return undefined;
    }
  } else {
    console.log('Push notifications require a physical device.');
    return undefined;
  }
}

/**
 * Custom React Hook to register and manage Expo Push Notifications.
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        console.log('====================================');
        console.log('🔑 EXPO PUSH TOKEN:', token);
        console.log('====================================');
      }
    });

    // Listen for incoming notifications while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(incomingNotif => {
      setNotification(incomingNotif);
      console.log('🔔 Notification Received:', incomingNotif);
    });

    // Listen for user interactions with received notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📲 Notification Clicked Response:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}
