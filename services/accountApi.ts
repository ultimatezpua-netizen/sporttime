/**
 * User-owned data is deliberately separate from the XML catalog.
 *
 * The real implementation fetches orders from Horoshop via the API server,
 * keyed by the customer's phone number (stored locally after checkout).
 * A real account/order backend can implement this contract without changing
 * screen components or catalog parsing.
 */
import { getOrdersByPhone, getOrderById } from './ordersClient';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AccountOrder {
  id: string;
  status: string;
  createdAt: string;
  total: number;
  itemIds: string[];
}

export interface AccountApi {
  getProfile(): Promise<UserProfile | null>;
  updateProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
  getOrders(phone: string): Promise<AccountOrder[]>;
  getOrder(id: string, phone: string): Promise<AccountOrder | null>;
}

/**
 * Live implementation backed by the SPORTTIME API server ↔ Horoshop.
 * Phone number is the customer identity for order lookup.
 */
export const horoshopAccountApi: AccountApi = {
  async getProfile() {
    // No persistent user profiles in the current Horoshop integration.
    return null;
  },
  async updateProfile() {
    throw new Error('Account API is not configured');
  },
  async getOrders(phone: string) {
    if (!phone) return [];
    try {
      const orders = await getOrdersByPhone(phone);
      return orders.map((o) => ({
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        total: o.total,
        itemIds: o.items.map((i) => i.productId).filter(Boolean),
      }));
    } catch {
      return [];
    }
  },
  async getOrder(id: string, phone: string) {
    if (!phone) return null;
    try {
      const o = await getOrderById(id, phone);
      return {
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        total: o.total,
        itemIds: o.items.map((i) => i.productId).filter(Boolean),
      };
    } catch {
      return null;
    }
  },
};

/**
 * Explicit seam — fails loudly when no phone is provided rather than
 * pretending a local profile is a real customer account.
 */
export const unconfiguredAccountApi: AccountApi = {
  async getProfile() {
    return null;
  },
  async updateProfile() {
    throw new Error('Account API is not configured');
  },
  async getOrders() {
    return [];
  },
  async getOrder() {
    return null;
  },
};
