/**
 * Client for submitting orders to Google Apps Script / SPORTTIME API.
 */

const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycby8Ib0A4yfm5sDo83ZlZTlz7NoJ2MNSdpn92B6s9DltTdYhyf-CIdTKeUOY7gejOstwsw/exec";

function getApiEndpoint(): string {
  const gasUrl = process.env["EXPO_PUBLIC_GAS_URL"];
  if (gasUrl && gasUrl.trim().length > 0) return gasUrl.trim();

  const explicit = process.env["EXPO_PUBLIC_API_URL"];
  if (explicit && explicit.startsWith("http")) return explicit.trim();

  return DEFAULT_GAS_URL;
}

export const ORDER_ENDPOINT = getApiEndpoint();

export interface OrderItemPayload {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
  total: number;
}

export interface CreateOrderPayload {
  // Flat properties corresponding to Google Sheets columns A -> K
  createdAt: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  city: string;
  delivery: string;
  payment: string;
  products: string;
  total: number;
  status: string;

  // Additional structured fields
  orderId: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    city: string;
  };
  deliveryDetails: {
    method: string;
    address: string;
  };
  paymentDetails: {
    method: string;
  };
  items: OrderItemPayload[];
  totals: {
    subtotal: number;
    discount: number;
    delivery: number;
    total: number;
  };
  promoCode?: string;
}

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  paymentUrl: string | null;
}

export class OrderApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "OrderApiError";
  }
}

/**
 * Sends order payload to Google Apps Script Web App.
 * Uses `text/plain;charset=utf-8` and `redirect: 'follow'` to bypass CORS OPTIONS preflight issues.
 */
export async function createOrder(
  payload: CreateOrderPayload,
  timeoutMs: number = 8000,
): Promise<CreateOrderResult> {
  console.log("Sending order payload:", payload);
  console.log("Target GAS Endpoint:", ORDER_ENDPOINT);

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      mode: "cors",
      redirect: "follow",
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (networkError: any) {
    console.error("Network / GAS error during order submission:", networkError);
    if (networkError?.name === "AbortError" || networkError?.message?.includes("aborted")) {
      throw new OrderApiError(
        "timeout",
        "Час очікування відповіді сервера вичерпано (8 секунд). Будь ласка, перевірте з'єднання і спробуйте ще раз.",
        408,
      );
    }
    throw new OrderApiError(
      "network_error",
      "Помилка відправки в Google Таблицю: немає мережевого з'єднання або сервер недоступний",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 403) {
    throw new OrderApiError(
      "forbidden_403",
      "Помилка відправки в Google Таблицю (HTTP 403): Уведіть у налаштуваннях впровадження Google Apps Script 'Хто має доступ' ➔ 'Усі' (Anyone).",
      403,
    );
  }

  if (response.status === 404) {
    throw new OrderApiError(
      "not_found_404",
      "Помилка відправки в Google Таблицю (HTTP 404): Скрипт не знайдено на серверах Google. Перевірте URL у .env (Впровадження ➔ Нове впровадження ➔ Скопіювати URL).",
      404,
    );
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
    throw new OrderApiError(
      "parse_error",
      "Помилка відправки в Google Таблицю: не вдалося прочитати відповідь сервера",
      response.status,
    );
  }

  console.log("Backend Response for Order Submission:", json);

  if (typeof json === "string") {
    const trimmed = json.trim();
    if (trimmed.toLowerCase().includes("error")) {
      throw new OrderApiError(
        "server_error",
        `Помилка відправки в Google Таблицю: ${trimmed}`,
        response.status,
      );
    }
  } else if (json && typeof json === "object") {
    if (json.status === "error" || json.error || json.success === false) {
      const errorMsg =
        json.message ||
        json.error ||
        json.errorMessage ||
        "Не вдалося зберегти замовлення в Google Таблицю";
      throw new OrderApiError(
        "server_error",
        `Помилка відправки в Google Таблицю: ${errorMsg}`,
        response.status,
      );
    }
  }

  if (!response.ok) {
    throw new OrderApiError(
      "http_error",
      `Помилка відправки в Google Таблицю (HTTP ${response.status})`,
      response.status,
    );
  }

  const confirmedOrderId =
    json?.orderId || json?.id || json?.confirmationId || payload.orderId || payload.orderNumber;
  const confirmedOrderNumber =
    json?.orderNumber || json?.number || payload.orderNumber || payload.orderId;

  return {
    orderId: String(confirmedOrderId),
    orderNumber: String(confirmedOrderNumber),
    paymentUrl: json?.paymentUrl ? String(json.paymentUrl) : null,
  };
}
