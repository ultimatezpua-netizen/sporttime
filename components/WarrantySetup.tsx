import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@/components/SafeIonicons';
import { FONTS } from '@/constants/typography';

const WARRANTY_STORAGE_KEY = '@garmin_warranty_data';

// PNG Store Assets
const APP_STORE_PNG = require('../assets/images/stores/app-store.png');
const GOOGLE_PLAY_PNG = require('../assets/images/stores/google-play.png');
const GARMIN_CONNECT_PNG = require('../assets/images/stores/garmin-connect.png');
const CONNECT_IQ_PNG = require('../assets/images/stores/connect-iq.png');

export interface WarrantyData {
  serialNumber: string;
  receiptUri: string | null;
  addedDate: string; // ISO string
}

export const WarrantySetup: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [warrantyData, setWarrantyData] = useState<WarrantyData | null>(null);

  // Platform sub-tabs for Section 3 (iOS / Android)
  const [appPlatformTab, setAppPlatformTab] = useState<'ios' | 'android'>(
    Platform.OS === 'ios' ? 'ios' : 'android'
  );

  // Form states
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load saved warranty data on mount
  useEffect(() => {
    async function loadWarrantyData() {
      try {
        const raw = await AsyncStorage.getItem(WARRANTY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as WarrantyData;
          if (parsed && typeof parsed === 'object' && parsed.serialNumber) {
            setWarrantyData(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load warranty data from AsyncStorage:', err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadWarrantyData();
  }, []);

  // Photo pick / take options
  const handleSelectPhoto = useCallback(() => {
    Alert.alert(
      'Додати фото чеку',
      'Оберіть спосіб отримання зображення:',
      [
        {
          text: 'Зробити фото (Камера)',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Помилка', 'Необхідний дозвіл на використання камери');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setReceiptUri(result.assets[0].uri);
              }
            } catch (err) {
              console.error('Error taking photo:', err);
              Alert.alert('Помилка', 'Не вдалося відкрити камеру');
            }
          },
        },
        {
          text: 'Обрати з галереї',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Помилка', 'Необхідний дозвіл на доступ до фотогалереї');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setReceiptUri(result.assets[0].uri);
              }
            } catch (err) {
              console.error('Error selecting photo:', err);
              Alert.alert('Помилка', 'Не вдалося відкрити галерею');
            }
          },
        },
        {
          text: 'Скасувати',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, []);

  // Save warranty data
  const handleSaveWarranty = useCallback(async () => {
    if (!serialNumber.trim()) {
      Alert.alert('Помилка', 'Будь ласка, введіть серійний номер пристрою');
      return;
    }

    setIsSaving(true);
    try {
      const newData: WarrantyData = {
        serialNumber: serialNumber.trim(),
        receiptUri: receiptUri,
        addedDate: new Date().toISOString(),
      };
      await AsyncStorage.setItem(WARRANTY_STORAGE_KEY, JSON.stringify(newData));
      setWarrantyData(newData);
      Alert.alert('Успіх', 'Дані гарантії успішно збережено!');
    } catch (err) {
      console.error('Failed to save warranty data:', err);
      Alert.alert('Помилка', 'Не вдалося зберегти дані гарантії');
    } finally {
      setIsSaving(false);
    }
  }, [serialNumber, receiptUri]);

  // Clear/Delete warranty data
  const handleClearWarranty = useCallback(() => {
    Alert.alert(
      'Видалити гарантію',
      'Ви дійсно бажаєте видалити збережені дані гарантії?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(WARRANTY_STORAGE_KEY);
              setWarrantyData(null);
              setSerialNumber('');
              setReceiptUri(null);
            } catch (err) {
              console.error('Failed to clear warranty:', err);
            }
          },
        },
      ]
    );
  }, []);

  // Step 2: Open official Garmin Registration page inside app browser
  const handleOpenGarminRegister = useCallback(async () => {
    try {
      await WebBrowser.openBrowserAsync('https://www.garmin.com/account/register');
    } catch (err) {
      console.error('Failed to open Garmin register page:', err);
      Alert.alert('Помилка', 'Не вдалося відкрити сайт Garmin');
    }
  }, []);

  // Step 3: Direct App Download Links Helper
  const openAppLink = useCallback(async (deepLink: string, webUrl: string) => {
    try {
      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      try {
        await Linking.openURL(webUrl);
      } catch (err) {
        console.error('Failed to open app link:', err);
        Alert.alert('Помилка', 'Не вдалося відкрити посилання на завантаження');
      }
    }
  }, []);

  // iOS Handlers
  const handleOpenIOSGarminConnect = useCallback(() => {
    void openAppLink(
      'itms-apps://itunes.apple.com/app/id315079328',
      'https://apps.apple.com/app/id315079328'
    );
  }, [openAppLink]);

  const handleOpenIOSConnectIQ = useCallback(() => {
    void openAppLink(
      'itms-apps://itunes.apple.com/app/id1158562306',
      'https://apps.apple.com/app/id1158562306'
    );
  }, [openAppLink]);

  // Android Handlers
  const handleOpenAndroidGarminConnect = useCallback(() => {
    void openAppLink(
      'market://details?id=com.garmin.android.apps.connectmobile',
      'https://play.google.com/store/apps/details?id=com.garmin.android.apps.connectmobile'
    );
  }, [openAppLink]);

  const handleOpenAndroidConnectIQ = useCallback(() => {
    void openAppLink(
      'market://details?id=com.garmin.connectiq',
      'https://play.google.com/store/apps/details?id=com.garmin.connectiq'
    );
  }, [openAppLink]);

  // Calculate remaining warranty days
  const getWarrantyDaysLeft = (addedDateIso: string): number => {
    const added = new Date(addedDateIso);
    const now = new Date();
    const diffMs = now.getTime() - added.getTime();
    const daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, 365 - daysPassed);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5500" />
        <Text style={styles.loadingText}>Завантаження даних гарантії...</Text>
      </View>
    );
  }

  const daysLeft = warrantyData ? getWarrantyDaysLeft(warrantyData.addedDate) : 0;
  const isWarrantyActive = daysLeft > 0;
  const badgeColor = daysLeft > 60 ? '#22C55E' : daysLeft > 0 ? '#FF5500' : '#EF4444';

  return (
    <View style={styles.container}>
      {/* SECTION 1: INTERNAL WARRANTY DATABASE */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#FF5500" />
          <Text style={styles.sectionTitle}>1. ВНУТРІШНЯ БАЗА ГАРАНТІЇ</Text>
        </View>

        {warrantyData ? (
          /* WARRANTY WIDGET CARD */
          <View style={styles.warrantyWidget}>
            <View style={[styles.badgeContainer, { backgroundColor: `${badgeColor}1F`, borderColor: badgeColor }]}>
              <Ionicons
                name={isWarrantyActive ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={badgeColor}
              />
              <Text style={[styles.badgeText, { color: badgeColor }]}>
                {isWarrantyActive
                  ? `Гарантія: залишилося ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дні' : 'днів'}`
                  : 'Термін гарантії вичерпано'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Серійний номер:</Text>
              <Text style={styles.infoValue}>{warrantyData.serialNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Дата активації:</Text>
              <Text style={styles.infoValue}>
                {new Date(warrantyData.addedDate).toLocaleDateString('uk-UA', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {warrantyData.receiptUri && (
              <View style={styles.receiptPreviewBox}>
                <Text style={styles.infoLabel}>Фото чека:</Text>
                <Image source={{ uri: warrantyData.receiptUri }} style={styles.receiptImage} resizeMode="cover" />
              </View>
            )}

            <Pressable style={styles.clearBtn} onPress={handleClearWarranty}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.clearBtnText}>Видалити гарантійні дані</Text>
            </Pressable>
          </View>
        ) : (
          /* FORM TO ADD WARRANTY */
          <View style={styles.formContent}>
            <Text style={styles.description}>
              Введіть серійний номер годинника Garmin та додайте фото чека для збереження в єдиній локальній базі гарантії.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Серійний номер <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Наприклад: 5XX123456"
                placeholderTextColor="#8E8E93"
                value={serialNumber}
                onChangeText={setSerialNumber}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Фото чека / гарантійного талона</Text>
              {receiptUri ? (
                <View style={styles.receiptSelectedBox}>
                  <Image source={{ uri: receiptUri }} style={styles.receiptThumbnail} resizeMode="cover" />
                  <Pressable style={styles.changePhotoBtn} onPress={handleSelectPhoto}>
                    <Ionicons name="camera-outline" size={16} color="#FF5500" />
                    <Text style={styles.changePhotoText}>Змінити фото</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.addPhotoBtn} onPress={handleSelectPhoto}>
                  <Ionicons name="camera-outline" size={20} color="#FF5500" />
                  <Text style={styles.addPhotoText}>Додати фото чека</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveWarranty}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Зберегти гарантію</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* SECTION 2: OFFICIAL GARMIN REGISTRATION */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="language-outline" size={20} color="#FF5500" />
          <Text style={styles.sectionTitle}>2. ОФІЦІЙНА РЕЄСТРАЦІЯ GARMIN</Text>
        </View>

        <Text style={styles.description}>
          Зареєструйте пристрій у вашому обліковому записі Garmin для офіційної міжнародної підтримки та синхронізації пристрою.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.garminRegisterBtn, pressed && styles.pressed]}
          onPress={handleOpenGarminRegister}
        >
          <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
          <Text style={styles.garminRegisterText}>Зареєструвати на сайті Garmin</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* SECTION 3: OFFICIAL APPS INSTALLATION */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="watch-outline" size={20} color="#FF5500" />
          <Text style={styles.sectionTitle}>3. ВСТАНОВЛЕННЯ ОФІЦІЙНИХ ДОДАТКІВ</Text>
        </View>

        <Text style={styles.description}>
          Оберіть вашу платформу та завантажте фірмове ПЗ Garmin для синхронізації та встановлення циферблатів.
        </Text>

        {/* Platform Graphical PNG Badges (App Store / Google Play) */}
        <View style={styles.platformTabRow}>
          <Pressable
            style={[styles.badgePressable, appPlatformTab === 'ios' && styles.badgePressableActive]}
            onPress={() => setAppPlatformTab('ios')}
          >
            <Image source={APP_STORE_PNG} style={styles.badgeImage} resizeMode="contain" />
          </Pressable>

          <Pressable
            style={[styles.badgePressable, appPlatformTab === 'android' && styles.badgePressableActive]}
            onPress={() => setAppPlatformTab('android')}
          >
            <Image source={GOOGLE_PLAY_PNG} style={styles.badgeImage} resizeMode="contain" />
          </Pressable>
        </View>

        {/* Selected Platform Content */}
        {appPlatformTab === 'ios' ? (
          /* iOS App Store Section */
          <View style={styles.platformContentBlock}>
            <View style={styles.appsList}>
              {/* iOS Garmin Connect */}
              <Pressable
                style={({ pressed }) => [styles.appDownloadCard, pressed && styles.pressed]}
                onPress={handleOpenIOSGarminConnect}
              >
                <Image source={GARMIN_CONNECT_PNG} style={styles.appCardIcon} resizeMode="cover" />
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>Garmin Connect™</Text>
                  <Text style={styles.appDesc}>Трекінг активностей та аналітика для iPhone</Text>
                </View>
                <View style={styles.downloadActionBtn}>
                  <Text style={styles.downloadActionText}>Завантажити</Text>
                  <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                </View>
              </Pressable>

              {/* iOS Connect IQ Store */}
              <Pressable
                style={({ pressed }) => [styles.appDownloadCard, pressed && styles.pressed]}
                onPress={handleOpenIOSConnectIQ}
              >
                <Image source={CONNECT_IQ_PNG} style={styles.appCardIcon} resizeMode="cover" />
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>Connect IQ™ Store</Text>
                  <Text style={styles.appDesc}>Циферблати, віджети та додаткове ПЗ iOS</Text>
                </View>
                <View style={styles.downloadActionBtn}>
                  <Text style={styles.downloadActionText}>Завантажити</Text>
                  <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
          </View>
        ) : (
          /* Android Google Play Section */
          <View style={styles.platformContentBlock}>
            <View style={styles.appsList}>
              {/* Android Garmin Connect */}
              <Pressable
                style={({ pressed }) => [styles.appDownloadCard, pressed && styles.pressed]}
                onPress={handleOpenAndroidGarminConnect}
              >
                <Image source={GARMIN_CONNECT_PNG} style={styles.appCardIcon} resizeMode="cover" />
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>Garmin Connect™</Text>
                  <Text style={styles.appDesc}>Головний додаток у Google Play Store</Text>
                </View>
                <View style={styles.downloadActionBtn}>
                  <Text style={styles.downloadActionText}>Завантажити</Text>
                  <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                </View>
              </Pressable>

              {/* Android Connect IQ Store */}
              <Pressable
                style={({ pressed }) => [styles.appDownloadCard, pressed && styles.pressed]}
                onPress={handleOpenAndroidConnectIQ}
              >
                <Image source={CONNECT_IQ_PNG} style={styles.appCardIcon} resizeMode="cover" />
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>Connect IQ™ Store</Text>
                  <Text style={styles.appDesc}>Магазин циферблатів та віджетів Android</Text>
                </View>
                <View style={styles.downloadActionBtn}>
                  <Text style={styles.downloadActionText}>Завантажити</Text>
                  <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  sectionCard: {
    backgroundColor: '#161618',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    paddingBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.5,
  },
  description: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  formContent: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#E5E5EA',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  required: {
    color: '#FF5500',
  },
  input: {
    backgroundColor: '#0B0B0C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B0B0C',
    borderWidth: 1,
    borderColor: '#FF5500',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
  },
  addPhotoText: {
    color: '#FF5500',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  receiptSelectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0B0B0C',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  receiptThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  changePhotoText: {
    color: '#FF5500',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF5500',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  pressed: {
    opacity: 0.82,
  },

  /* WARRANTY WIDGET STYLES */
  warrantyWidget: {
    gap: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B0B0C',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  receiptPreviewBox: {
    gap: 8,
    backgroundColor: '#0B0B0C',
    padding: 12,
    borderRadius: 8,
  },
  receiptImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },

  /* SECTION 2 GARMIN REGISTER BTN */
  garminRegisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF5500',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  garminRegisterText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginLeft: 10,
  },

  /* SECTION 3 BADGE IMAGES & APP CARDS */
  platformTabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badgePressable: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    backgroundColor: '#0B0B0C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  badgePressableActive: {
    backgroundColor: '#1C1410',
    borderColor: '#FF5500',
    borderWidth: 1.5,
  },
  badgeImage: {
    width: 110,
    height: 36,
    backgroundColor: 'transparent',
  },

  platformContentBlock: {
    gap: 10,
  },
  appsList: {
    gap: 10,
  },
  appDownloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0B0C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 12,
    gap: 12,
  },
  appCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  appInfo: {
    flex: 1,
    gap: 2,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  appDesc: {
    color: '#8E8E93',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  downloadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF5500',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  downloadActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});

export default WarrantySetup;
