const fs = require("fs");

const catalog = JSON.parse(
  fs.readFileSync("data/catalog.json", "utf8")
);

const out = `
// AUTO-GENERATED. DO NOT EDIT.

import catalog from "./catalog.json";

export interface ProductSpec {
  key: string;
  label: string;
  value: string;
}

export interface SupplementalProductSpec extends ProductSpec {
  sourceFile: string;
}

export interface Product {
  id: string;
  name: string;
  series: string;
  sku: string;
  price: number;
  oldPrice?: number;
  inStock: boolean;
  image: string;
  images: string[];
  description: string;
  descriptionHtml: string;
  descriptionHtmlRu: string;
  shortDescription: string;
  shortDescriptionRu: string;
  seo: Record<string, string>;
  media360: string[];
  mediaSource?: string;
  merchantData: Record<string, string>;
  url: string;
  categoryId: string;
  category: string;
  categoryPath: string[];
  vendor: string;
  vendorCode: string;
  params: ProductSpec[];
  specs: ProductSpec[];
  supplementalSpecs: SupplementalProductSpec[];
  filterFacets: Record<string, string[]>;
  rating: number;
  reviewCount: number;
  colors: string[];
  colorHexes: string[];
  sizes: string[];
  display: string;
  solar: boolean;
  material: string;
  purpose: string[];
  waterResistance: number;
  batteryLife: string;
  gps: boolean;
  heartRate: boolean;
  pulseOx: boolean;
  music: boolean;
  isNew?: boolean;
  discount?: number;
}

export type Series = string;

export const PRODUCTS: Product[] = (catalog as any[]).map(p => ({
  ...p,
  image: Array.isArray(p.images) && p.images[0] ? p.images[0] : (p.image || ''),
  images: Array.isArray(p.images) ? p.images.filter(Boolean) : (p.image ? [p.image] : []),
  rating: Number(p.rating || 0),
  reviewCount: Number(p.reviewCount || 0),
  colors: Array.isArray(p.colors) ? p.colors : [],
  colorHexes: Array.isArray(p.colorHexes) ? p.colorHexes : [],
  sizes: Array.isArray(p.sizes) ? p.sizes : [],
  params: Array.isArray(p.params) ? p.params : [],
  specs: Array.isArray(p.specs) ? p.specs : [],
  descriptionHtml: typeof p.descriptionHtml === "string" ? p.descriptionHtml : "",
  descriptionHtmlRu: typeof p.descriptionHtmlRu === "string" ? p.descriptionHtmlRu : "",
  shortDescription: typeof p.shortDescription === "string" ? p.shortDescription : "",
  shortDescriptionRu: typeof p.shortDescriptionRu === "string" ? p.shortDescriptionRu : "",
  seo: p.seo && typeof p.seo === "object" ? p.seo : {},
  media360: Array.isArray(p.media360) ? p.media360 : [],
  merchantData: p.merchantData && typeof p.merchantData === "object" ? p.merchantData : {},
  supplementalSpecs: Array.isArray(p.supplementalSpecs) ? p.supplementalSpecs : [],
  filterFacets: p.filterFacets && typeof p.filterFacets === "object" ? p.filterFacets : {},
}));

export const PRODUCT_IMAGES = {};

export const formatPrice = (price:number)=>
  new Intl.NumberFormat("uk-UA").format(price)+" ₴";

export const getProductById=(id:string)=>
PRODUCTS.find(p=>p.id===id);

export const getProductsByIds=(ids:string[])=>
PRODUCTS.filter(p=>ids.includes(p.id));

export const SERIES_LIST = Array.from(
  new Set(PRODUCTS.map(product => product.series).filter(Boolean))
);
`;

fs.writeFileSync("data/products.ts", out);

console.log("✓ data/products.ts generated");
