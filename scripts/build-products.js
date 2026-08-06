const fs = require("fs");

const input = "data/products_full.json";
const output = "data/catalog.json";

if (!fs.existsSync(input)) {
  console.error("Не найден:", input);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(input, "utf8"));

const catalog = raw.map((p, index) => ({
  id: String(index + 1),
  name: p["Название"] || "",
  series: p["Серия"] || "",
  sku: p["Артикул"] || "",
  price: Number(String(p["Цена"] || "0").replace(/[^\d]/g, "")),
  oldPrice: Number(String(p["Старая цена"] || "0").replace(/[^\d]/g, "")),
  inStock: /есть|в наличии/i.test(String(p["Наличие"] || "")),
  image:
    Array.isArray(p["Фото"]) && p["Фото"].length
      ? p["Фото"][0]
      : "",
  images: Array.isArray(p["Фото"]) ? p["Фото"] : [],
  description: p["Описание"] || "",
  specs: p["Характеристики"] || {},
  url: p["URL"] || ""
}));

fs.writeFileSync(output, JSON.stringify(catalog, null, 2), "utf8");

console.log(`✓ Создан ${output}`);
console.log(`✓ Товаров: ${catalog.length}`);
