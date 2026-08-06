# Аудит локалізації SPORTTIME UA

Дата аудиту: 30 липня 2026 року.

## Результат

- Інтерфейс застосунку, кнопки, порожні стани, помилки, системні `Alert`, placeholder-и та accessibility labels локалізовано українською.
- Англомовні Expo fallback-повідомлення замінено українськими.
- Локалізовано текст на splash-зображенні; фотографію та брендинг не змінено.
- Банери `NEW`/`SALE` замінено на `НОВИНКА`/`АКЦІЯ`.
- Серверні повідомлення адаптерів Хорошопа та Нової пошти, які можуть потрапити в UI, локалізовано.
- TypeScript для Expo та API проходить.
- Android production export проходить.
- Android tab navigation не використовує iOS `NativeTabs`/SF Symbols; для Android залишено bundled Feather icon font.

## Автодоповнення міст

Додано серверний маршрут `GET /api/nova-poshta/cities?search=...`, який викликає офіційний метод Нової пошти `Address/searchSettlements`.

- Міста не зберігаються в коді та не підміняються ручним масивом.
- API-ключ читається лише на сервері з `NOVA_POSHTA_API_KEY`.
- Без ключа маршрут повертає зрозумілу українську відповідь `503`, а checkout не показує вигадані міста.
- Зовнішній lookup вимкнено за замовчуванням через `NOVA_POSHTA_API_ENABLED`; некоректний ключ більше не надсилається до Нової пошти. Увімкнення можливе лише після додавання чинного ключа та явного встановлення цього прапорця в `true`.

## Змінені файли

- `artifacts/sporttime/app/_layout.tsx`
- `artifacts/sporttime/app.json`
- `artifacts/sporttime/app/+not-found.tsx`
- `artifacts/sporttime/app/(tabs)/catalog.tsx`
- `artifacts/sporttime/app/(tabs)/index.tsx`
- `artifacts/sporttime/app/checkout.tsx`
- `artifacts/sporttime/components/BannerCarousel.tsx`
- `artifacts/sporttime/components/ErrorFallback.tsx`
- `artifacts/sporttime/components/Header.tsx`
- `artifacts/sporttime/components/ProductCard.tsx`
- `artifacts/sporttime/package.json`
- `artifacts/sporttime/scripts/build.js`
- `artifacts/sporttime/assets/images/splash-screen-localized.png`
- `artifacts/api-server/src/routes/index.ts`
- `artifacts/api-server/src/routes/nova-poshta.ts`
- `artifacts/api-server/src/routes/horoshop.ts`
- `artifacts/api-server/src/lib/horoshop.ts`
- `README.md`

## Свідомо неперекладені значення

Це не UI-пропуски:

- бренди та назви магазинів: `GARMIN`, `SPORTTIME UA`;
- назви моделей і серій: `Fēnix`, `Forerunner`, `Instinct`, `Venu`, `Epix`, `Tactix`, `MARQ`, `Descent`;
- технічні стандарти й характеристики: `AMOLED`, `Solar`, `GPS`, `ATM`, `QZSS`, `BeiDou`, `Bluetooth`, `ANT+`, `Wi‑Fi`, `Apple Pay`, `Visa`, `Mastercard`;
- артикулі, SKU, URL, назви API-методів і машинні коди помилок;
- англомовні поля імпортованого товарного JSON, які не відображаються як UI-текст.

## Залишені неперекладені UI-рядки

Перекладних рядків не залишено. Під час аудиту знайдені лише технічні/брендові значення з переліку вище та email-формат `name@example.com`.