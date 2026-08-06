import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safely parse JSON strings with fallback value if invalid or corrupted.
 */
export function safeParseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || typeof raw !== 'string') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch (e) {
    console.warn('safeParseJSON failed to parse value, returning fallback:', e);
    return fallback;
  }
}

/**
 * Safely stringify values into valid JSON string with fallback.
 */
export function safeStringifyJSON(value: any, fallback: string = '[]'): string {
  if (value === undefined || value === null) {
    return fallback;
  }
  try {
    return JSON.stringify(value);
  } catch (e) {
    console.warn('safeStringifyJSON failed, returning fallback:', e);
    return fallback;
  }
}

/**
 * Async helper for AsyncStorage reading with safe JSON parsing.
 */
export async function getAsyncStorageItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return safeParseJSON<T>(raw, fallback);
  } catch (e) {
    console.warn(`getAsyncStorageItem failed for key "${key}":`, e);
    return fallback;
  }
}

/**
 * Async helper for AsyncStorage writing with safe JSON stringifying.
 */
export async function setAsyncStorageItem(key: string, value: any): Promise<boolean> {
  try {
    const json = safeStringifyJSON(value);
    await AsyncStorage.setItem(key, json);
    return true;
  } catch (e) {
    console.warn(`setAsyncStorageItem failed for key "${key}":`, e);
    return false;
  }
}

/**
 * Async helper for AsyncStorage removal.
 */
export async function removeAsyncStorageItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`removeAsyncStorageItem failed for key "${key}":`, e);
    return false;
  }
}
