import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProductById } from '@/data/products';
import { setupPushNotifications } from '@/services/pushNotifications';
import { safeParseJSON, safeStringifyJSON } from '@/utils/safeStorage';

export interface CartItem {
  productId: string;
  quantity: number;
  color: string;
  size: string;
}

export type PaymentMethod = 'card' | 'cash';

export interface LastOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
}

export interface LastOrder {
  orderId: string;
  orderNumber: string;
  items: LastOrderItem[];
  totals: {
    subtotal: number;
    discount: number;
    delivery: number;
    total: number;
  };
  paymentMethod: PaymentMethod;
  deliveryMethod: 'nova_poshta' | 'courier';
}

interface AppContextValue {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;

  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  compareList: string[];
  toggleCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;

  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;

  promoCode: string;
  promoDiscount: number;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;

  customerPhone: string;
  setCustomerPhone: (phone: string) => Promise<void>;

  lastOrder: LastOrder | null;
  setLastOrder: (order: LastOrder | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const CART_KEY = '@sporttime/cart';
const FAVORITES_KEY = '@sporttime/favorites';
const COMPARE_KEY = '@sporttime/compare';
const CUSTOMER_PHONE_KEY = '@sporttime/customer_phone';

const VALID_PROMOS: Record<string, number> = {
  GARMIN10: 0.1,
  SPORTTIME15: 0.15,
  SALE20: 0.2,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [customerPhone, setCustomerPhoneState] = useState('');
  const [lastOrder, setLastOrderState] = useState<LastOrder | null>(null);

  const setLastOrder = useCallback((order: LastOrder | null) => {
    setLastOrderState(order);
  }, []);

  // Load persisted data
  useEffect(() => {
    async function load() {
      try {
        const [cartData, favData, compareData, phoneData, userPhone, customerPhoneLocal, authPhone] = await Promise.all([
          AsyncStorage.getItem(CART_KEY),
          AsyncStorage.getItem(FAVORITES_KEY),
          AsyncStorage.getItem(COMPARE_KEY),
          AsyncStorage.getItem(CUSTOMER_PHONE_KEY),
          AsyncStorage.getItem('@sporttime/user_phone'),
          AsyncStorage.getItem('@sporttime/customer_phone'),
          AsyncStorage.getItem('@sporttime/auth_phone'),
        ]);

        if (cartData) setCart(safeParseJSON<CartItem[]>(cartData, []));
        if (favData) setFavorites(safeParseJSON<string[]>(favData, []));
        if (compareData) setCompareList(safeParseJSON<string[]>(compareData, []));

        const savedPhone = phoneData || userPhone || customerPhoneLocal || authPhone || '';

        if (savedPhone && savedPhone !== 'undefined' && savedPhone !== 'null') {
          setCustomerPhoneState(savedPhone);
        }
      } catch (e) {
        console.warn('AppContext load data error:', e);
      }
    }
    void load();
  }, []);

  const saveCart = useCallback(async (newCart: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_KEY, safeStringifyJSON(newCart, '[]'));
    } catch (e) {
      console.warn('saveCart AsyncStorage error:', e);
    }
  }, []);

  const saveCompare = useCallback(async (newList: string[]) => {
    try {
      await AsyncStorage.setItem(COMPARE_KEY, safeStringifyJSON(newList, '[]'));
    } catch (e) {
      console.warn('saveCompare AsyncStorage error:', e);
    }
  }, []);

  const setCustomerPhone = useCallback(async (phone: string) => {
    const trimmed = (phone || '').trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return;

    setCustomerPhoneState(trimmed);
    try {
      await Promise.all([
        AsyncStorage.setItem(CUSTOMER_PHONE_KEY, trimmed),
        AsyncStorage.setItem('@sporttime/user_phone', trimmed),
        AsyncStorage.setItem('@sporttime/customer_phone', trimmed),
        AsyncStorage.setItem('@sporttime/auth_phone', trimmed),
        AsyncStorage.setItem('@sporttime/is_authenticated', 'true'),
      ]);
    } catch (e) {
      console.warn('setCustomerPhone AsyncStorage error:', e);
    }

    void setupPushNotifications(trimmed).catch(() => undefined);
  }, []);

  const saveFavorites = useCallback(async (newFavs: string[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, safeStringifyJSON(newFavs, '[]'));
    } catch (e) {
      console.warn('saveFavorites AsyncStorage error:', e);
    }
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(
        ci => ci.productId === item.productId && ci.color === item.color && ci.size === item.size
      );
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(ci =>
          ci.productId === item.productId && ci.color === item.color && ci.size === item.size
            ? { ...ci, quantity: ci.quantity + item.quantity }
            : ci
        );
      } else {
        updated = [...prev, item];
      }
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => {
      const updated = prev.filter(ci => ci.productId !== productId);
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prev => {
      let updated: CartItem[];
      if (quantity <= 0) {
        updated = prev.filter(ci => ci.productId !== productId);
      } else {
        updated = prev.map(ci => ci.productId === productId ? { ...ci, quantity } : ci);
      }
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    saveCart([]);
  }, [saveCart]);

  const isInCart = useCallback((productId: string) => {
    return cart.some(ci => ci.productId === productId);
  }, [cart]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(prev => {
      const updated = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      saveFavorites(updated);
      return updated;
    });
  }, [saveFavorites]);

  const isFavorite = useCallback((productId: string) => {
    return favorites.includes(productId);
  }, [favorites]);

  const toggleCompare = useCallback((productId: string) => {
    setCompareList(prev => {
      const updated = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      saveCompare(updated);
      return updated;
    });
  }, [saveCompare]);

  const isInCompare = useCallback((productId: string) => {
    return compareList.includes(productId);
  }, [compareList]);

  const clearCompare = useCallback(() => {
    setCompareList([]);
    saveCompare([]);
  }, [saveCompare]);

  const applyPromo = useCallback((code: string): boolean => {
    const discount = VALID_PROMOS[code.toUpperCase()];
    if (discount) {
      setPromoCode(code.toUpperCase());
      setPromoDiscount(discount);
      return true;
    }
    return false;
  }, []);

  const clearPromo = useCallback(() => {
    setPromoCode('');
    setPromoDiscount(0);
  }, []);

  const cartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const cartTotal = cart.reduce((sum, ci) => {
    return sum + (getProductById(ci.productId)?.price ?? 0) * ci.quantity;
  }, 0);

  return (
    <AppContext.Provider
      value={{
        cart, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, isInCart,
        favorites, toggleFavorite, isFavorite,
        compareList, toggleCompare, isInCompare, clearCompare,
        paymentMethod, setPaymentMethod,
        promoCode, promoDiscount, applyPromo, clearPromo,
        customerPhone, setCustomerPhone,
        lastOrder, setLastOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
