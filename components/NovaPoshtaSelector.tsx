import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type DeliveryType = 'warehouse' | 'courier';

export interface NovaPoshtaData {
  city: string;
  deliveryType: DeliveryType;
  warehouseOrAddress: string;
}

interface NovaPoshtaSelectorProps {
  initialCity?: string;
  initialDeliveryType?: DeliveryType;
  initialWarehouseOrAddress?: string;
  onChange: (data: NovaPoshtaData) => void;
}

const POPULAR_CITIES = ['Запоріжжя', 'Київ', 'Дніпро', 'Львів', 'Одеса', 'Харків'];

const CITY_WAREHOUSES: Record<string, string[]> = {
  'Запоріжжя': [
    'Відділення №21 (до 30 кг): вул. Нижньодніпровська, 21',
    'Відділення №1 (до 1100 кг): вул. Грязнова, 45',
    'Відділення №3 (до 30 кг): пр. Соборний, 142',
    'Відділення №7 (до 30 кг): вул. Новокузнецька, 12',
    'Поштомат №8412: пр. Соборний, 177',
    'Поштомат №9120: вул. Перемоги, 64',
  ],
  'Київ': [
    'Відділення №1 (до 1100 кг): вул. Пироговський шлях, 135',
    'Відділення №5 (до 30 кг): вул. Федорова, 32',
    'Відділення №11 (до 30 кг): вул. Верхній Вал, 24',
    'Відділення №22 (до 30 кг): вул. Хрещатик, 22',
    'Поштомат №4500: вул. Велика Васильківська, 25',
    'Поштомат №5120: пр. Перемоги, 18',
  ],
  'Дніпро': [
    'Відділення №1 (до 1100 кг): вул. Маршала Малиновського, 98',
    'Відділення №4 (до 30 кг): пр. Дмитра Яворницького, 60',
    'Відділення №12 (до 30 кг): пр. Гагаріна, 112',
    'Поштомат №3210: вул. Січеславська Набережна, 15',
  ],
  'Львів': [
    'Відділення №1 (до 1100 кг): вул. Городоцька, 355',
    'Відділення №5 (до 30 кг): вул. Дорошенка, 24',
    'Відділення №14 (до 30 кг): вул. Словацького, 1',
    'Поштомат №6102: пр. Свободи, 28',
  ],
  'Одеса': [
    'Відділення №1 (до 1100 кг): вул. Базова, 16',
    'Відділення №8 (до 30 кг): вул. Дерибасівська, 14',
    'Відділення №15 (до 30 кг): вул. Канатна, 79',
    'Поштомат №7140: пр. Шевченка, 4',
  ],
  'Харків': [
    'Відділення №1 (до 1100 кг): вул. Польова, 67',
    'Відділення №6 (до 30 кг): вул. Академіка Павлова, 120',
    'Відділення №20 (до 30 кг): пр. Науки, 38',
    'Поштомат №4129: вул. Сумська, 10',
  ],
};

const DEFAULT_WAREHOUSES = [
  'Відділення №1 (до 1100 кг): Вантажне відділення',
  'Відділення №2 (до 30 кг): Центральне відділення',
  'Відділення №3 (до 30 кг): вул. Головна, 15',
  'Поштомат №1001: Цілодобовий поштомат',
];

export function NovaPoshtaSelector({
  initialCity = 'Запоріжжя',
  initialDeliveryType = 'warehouse',
  initialWarehouseOrAddress = 'Відділення №21 (до 30 кг): вул. Нижньодніпровська, 21',
  onChange,
}: NovaPoshtaSelectorProps) {
  const [city, setCity] = useState(initialCity);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(initialDeliveryType);
  const [warehouseOrAddress, setWarehouseOrAddress] = useState(initialWarehouseOrAddress);

  const [cityFocused, setCityFocused] = useState(false);
  const [warehouseFocused, setWarehouseFocused] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);

  // Available warehouses for currently selected city
  const availableWarehouses = CITY_WAREHOUSES[city] || DEFAULT_WAREHOUSES;

  // Filtered warehouses based on user search
  const filteredWarehouses = warehouseOrAddress.trim()
    ? availableWarehouses.filter(w =>
        w.toLowerCase().includes(warehouseOrAddress.trim().toLowerCase())
      )
    : availableWarehouses;

  // Notify parent on change
  useEffect(() => {
    onChange({ city, deliveryType, warehouseOrAddress });
  }, [city, deliveryType, warehouseOrAddress, onChange]);

  const handleSelectCity = (selectedCity: string) => {
    setCity(selectedCity);
    setShowCityDropdown(false);
    // Reset warehouse to first available for selected city if not present
    const firstWh = CITY_WAREHOUSES[selectedCity]?.[0] || DEFAULT_WAREHOUSES[0];
    setWarehouseOrAddress(firstWh);
  };

  const handleSelectWarehouse = (selectedWh: string) => {
    setWarehouseOrAddress(selectedWh);
    setShowWarehouseDropdown(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeading}>Доставка «Нова Пошта»</Text>

      {/* 1. CITY SELECTION */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>1. Місто доставки</Text>
        <View
          style={[
            styles.inputContainer,
            cityFocused && styles.inputFocused,
          ]}
        >
          <Ionicons name="location-outline" size={18} color={cityFocused ? '#FF6400' : '#8E8E93'} />
          <TextInput
            style={styles.textInput}
            value={city}
            onChangeText={text => {
              setCity(text);
              setShowCityDropdown(true);
            }}
            placeholder="Введіть або оберіть місто..."
            placeholderTextColor="#8E8E93"
            onFocus={() => {
              setCityFocused(true);
              setShowCityDropdown(true);
            }}
            onBlur={() => {
              setCityFocused(false);
              setTimeout(() => setShowCityDropdown(false), 200);
            }}
          />
          {city.length > 0 && (
            <Pressable onPress={() => setCity('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#8E8E93" />
            </Pressable>
          )}
        </View>

        {/* Popular Cities Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {POPULAR_CITIES.map(popularCity => (
            <Pressable
              key={popularCity}
              style={[
                styles.cityChip,
                city === popularCity && styles.cityChipActive,
              ]}
              onPress={() => handleSelectCity(popularCity)}
            >
              <Text
                style={[
                  styles.cityChipText,
                  city === popularCity && styles.cityChipTextActive,
                ]}
              >
                {popularCity}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* City Dropdown List */}
        {showCityDropdown && POPULAR_CITIES.filter(c => c.toLowerCase().includes(city.toLowerCase())).length > 0 && (
          <View style={styles.dropdownList}>
            {POPULAR_CITIES.filter(c => c.toLowerCase().includes(city.toLowerCase())).map(item => (
              <Pressable
                key={item}
                style={styles.dropdownItem}
                onPress={() => handleSelectCity(item)}
              >
                <Ionicons name="business-outline" size={16} color="#FF6400" />
                <Text style={styles.dropdownItemText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* 2. DELIVERY TYPE SELECTOR */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>2. Спосіб отримання</Text>
        <View style={styles.segmentedRow}>
          <Pressable
            style={[
              styles.segmentBtn,
              deliveryType === 'warehouse' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setDeliveryType('warehouse');
              if (!warehouseOrAddress || warehouseOrAddress.includes('вул.')) {
                setWarehouseOrAddress(availableWarehouses[0]);
              }
            }}
          >
            <Ionicons
              name="cube-outline"
              size={16}
              color={deliveryType === 'warehouse' ? '#FFFFFF' : '#8E8E93'}
            />
            <Text
              style={[
                styles.segmentText,
                deliveryType === 'warehouse' && styles.segmentTextActive,
              ]}
            >
              Відділення / Поштомат
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentBtn,
              deliveryType === 'courier' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setDeliveryType('courier');
              if (warehouseOrAddress.startsWith('Відділення') || warehouseOrAddress.startsWith('Поштомат')) {
                setWarehouseOrAddress('');
              }
            }}
          >
            <Ionicons
              name="car-outline"
              size={16}
              color={deliveryType === 'courier' ? '#FFFFFF' : '#8E8E93'}
            />
            <Text
              style={[
                styles.segmentText,
                deliveryType === 'courier' && styles.segmentTextActive,
              ]}
            >
              Кур'єром за адресою
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 3. WAREHOUSE OR COURIER ADDRESS */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          {deliveryType === 'warehouse'
            ? '3. Номер відділення або поштомату'
            : '3. Точна адреса для кур\'єра (вулиця, будинок, кв.)'}
        </Text>

        <View
          style={[
            styles.inputContainer,
            warehouseFocused && styles.inputFocused,
          ]}
        >
          <Ionicons
            name={deliveryType === 'warehouse' ? 'storefront-outline' : 'home-outline'}
            size={18}
            color={warehouseFocused ? '#FF6400' : '#8E8E93'}
          />
          <TextInput
            style={styles.textInput}
            value={warehouseOrAddress}
            onChangeText={text => {
              setWarehouseOrAddress(text);
              if (deliveryType === 'warehouse') setShowWarehouseDropdown(true);
            }}
            placeholder={
              deliveryType === 'warehouse'
                ? 'Оберіть або введіть номер відділення...'
                : 'вул. Соборна, буд. 10, кв. 25'
            }
            placeholderTextColor="#8E8E93"
            onFocus={() => {
              setWarehouseFocused(true);
              if (deliveryType === 'warehouse') setShowWarehouseDropdown(true);
            }}
            onBlur={() => {
              setWarehouseFocused(false);
              setTimeout(() => setShowWarehouseDropdown(false), 200);
            }}
          />
          {warehouseOrAddress.length > 0 && (
            <Pressable onPress={() => setWarehouseOrAddress('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#8E8E93" />
            </Pressable>
          )}
        </View>

        {/* Warehouse Dropdown */}
        {deliveryType === 'warehouse' && showWarehouseDropdown && filteredWarehouses.length > 0 && (
          <View style={styles.dropdownList}>
            {filteredWarehouses.map(wh => (
              <Pressable
                key={wh}
                style={styles.dropdownItem}
                onPress={() => handleSelectWarehouse(wh)}
              >
                <Ionicons
                  name={wh.startsWith('Поштомат') ? 'hardware-chip-outline' : 'cube-outline'}
                  size={16}
                  color="#FF6400"
                />
                <Text style={styles.dropdownItemText} numberOfLines={2}>
                  {wh}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161618',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    gap: 14,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#C7C7CC',
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  inputFocused: {
    borderColor: '#FF6400',
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  cityChip: {
    backgroundColor: '#222225',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  cityChipActive: {
    backgroundColor: 'rgba(255, 100, 0, 0.15)',
    borderColor: '#FF6400',
  },
  cityChipText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: '#FF6400',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#1E1E22',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FF6400',
  },
  segmentText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dropdownList: {
    backgroundColor: '#1E1E22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
});
