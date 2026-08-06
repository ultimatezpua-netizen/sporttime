/**
 * Client for the SPORTTIME order history API via Google Apps Script / Horoshop.
 */

const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycby8Ib0A4yfm5sDo83ZlZTlz7NoJ2MNSdpn92B6s9DltTdYhyf-CIdTKeUOY7gejOstwsw/exec";

function getGasEndpoint(): string {
  const gasUrl = process.env["EXPO_PUBLIC_GAS_URL"];
  if (gasUrl && gasUrl.trim().length > 0) return gasUrl.trim();

  const explicit = process.env["EXPO_PUBLIC_API_URL"];
  if (explicit && explicit.startsWith("http")) return explicit.trim();

  return DEFAULT_GAS_URL;
}

const GAS_ENDPOINT = getGasEndpoint();

export interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  statusId: number;
  createdAt: string;
  total: number;
  clientName: string;
  items: OrderItem[];
}

export class OrdersClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "OrdersClientError";
  }
}

async function gasFetch<T>(url: string, timeoutMs: number = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      mode: "cors",
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (networkError: any) {
    console.error("Fetch User Orders Error:", networkError);
    if (networkError?.name === "AbortError" || networkError?.message?.includes("aborted")) {
      throw new OrdersClientError(
        "timeout",
        "Час очікування відповіді сервера вичерпано (8 секунд).",
        408,
      );
    }
    throw new OrdersClientError(
      "network_error",
      "Немає з'єднання з сервером. Перевірте інтернет і спробуйте ще раз.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  let rawText = "";
  let json: any = null;
  try {
    rawText = await response.text();
    try {
      json = JSON.parse(rawText);
    } catch {
      json = rawText;
    }
  } catch {
    throw new OrdersClientError(
      "parse_error",
      "Замовлень за цим номером не знайдено",
      response.status,
    );
  }

  console.log("Fetch User Orders Response:", json);

  if (!json) {
    throw new OrdersClientError("not_found", "Замовлень за цим номером не знайдено", response.status);
  }

  if (typeof json === "string") {
    const trimmed = json.trim();
    if (trimmed.toLowerCase().includes("error") || trimmed.toLowerCase() === "success") {
      throw new OrdersClientError("not_found", "Замовлень за цим номером не знайдено", response.status);
    }
  }

  if (json && typeof json === "object") {
    if (json.status === "error" || json.error || json.success === false) {
      const msg = json.message || json.error || "Замовлень за цим номером не знайдено";
      throw new OrdersClientError("not_found", String(msg), response.status);
    }
  }

  if (!response.ok) {
    throw new OrdersClientError(
      "not_found",
      "Замовлень за цим номером не знайдено",
      response.status,
    );
  }

  const resultData = (json && typeof json === "object" && "data" in json) ? json.data : json;
  if (Array.isArray(resultData)) {
    return resultData as T;
  }

  if (resultData && typeof resultData === "object") {
    return resultData as T;
  }

  return [] as unknown as T;
}

/** Fetch all recent orders for this customer's phone number from Google Apps Script. */
export async function getOrdersByPhone(phone: string): Promise<CustomerOrder[]> {
  // 🛡️ Guard against invalid/undefined/null phone numbers
  if (!phone || phone === 'undefined' || phone === 'null' || phone.trim().length === 0) {
    console.warn("getOrdersByPhone skipped: phone is invalid or undefined", phone);
    return [];
  }

  const url = `${GAS_ENDPOINT}?action=getOrders&phone=${encodeURIComponent(phone.trim())}`;
  return gasFetch<CustomerOrder[]>(url);
}

/** Fetch a single order by ID, verified against customer's phone. */
export async function getOrderById(
  id: string,
  phone: string,
): Promise<CustomerOrder> {
  if (!phone || phone === 'undefined' || phone === 'null' || phone.trim().length === 0) {
    throw new OrdersClientError("invalid_phone", "Номер телефону не вказано", 400);
  }

  const url = `${GAS_ENDPOINT}?action=getOrder&id=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone.trim())}`;
  return gasFetch<CustomerOrder>(url);
}

export async function registerPushToken(
  phone: string,
  token: string,
): Promise<void> {
  if (!phone || phone === 'undefined' || phone === 'null') return;
  try {
    await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      mode: "cors",
      redirect: "follow",
      body: JSON.stringify({ action: "registerPushToken", phone, token }),
    });
  } catch {
    // Silently ignore
  }
}

export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      mode: "cors",
      redirect: "follow",
      body: JSON.stringify({ action: "unregisterPushToken", token }),
    });
  } catch {
    // Silently ignore
  }
}
