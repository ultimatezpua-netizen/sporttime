const GAS_URL = "https://script.google.com/macros/s/AKfycby8Ib0A4yfm5sDo83ZlZTlz7NoJ2MNSdpn92B6s9DltTdYhyf-CIdTKeUOY7gejOstwsw/exec";

const now = new Date();
const orderId = `ORD-${now.getTime()}-${Math.floor(1000 + Math.random() * 9000)}`;

const payload = {
  // A -> K Columns Mapping
  createdAt: now.toISOString(),
  orderNumber: orderId,
  customerName: "Олександр Тестовий",
  phone: "+380991234567",
  email: "test_order@example.com",
  city: "Київ",
  delivery: "Нова Пошта (Відділення №1, вул. Хрещатик, 1)",
  payment: "Накладний платіж",
  products: "Garmin Fenix 8 AMOLED 47mm × 1 (43 999 ₴)",
  total: 43999,
  status: "Нове",

  // Additional fields
  orderId,
  customer: {
    name: "Олександр Тестовий",
    phone: "+380991234567",
    email: "test_order@example.com",
    city: "Київ",
  },
  deliveryDetails: {
    method: "Нова Пошта",
    address: "Відділення №1, вул. Хрещатик, 1",
  },
  paymentDetails: {
    method: "Накладний платіж",
  },
  items: [
    {
      productId: "test-garmin-01",
      name: "Garmin Fenix 8 AMOLED 47mm",
      quantity: 1,
      price: 43999,
      total: 43999,
    },
  ],
  totals: {
    subtotal: 43999,
    discount: 0,
    delivery: 0,
    total: 43999,
  },
};

console.log("Sending test order payload:", JSON.stringify(payload, null, 2));

async function run() {
  console.log("Target GAS Endpoint:", GAS_URL);
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      redirect: "follow",
      mode: "cors",
      body: JSON.stringify(payload),
    });
    console.log("HTTP Status:", res.status);
    const text = await res.text();
    console.log("Server Response:", text);
  } catch (e) {
    console.error("Network Error:", e.message);
  }
}

run();
