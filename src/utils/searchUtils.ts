import { Product } from '../types';

/**
 * Normalizes text by removing diacritics/accents, trimming and lowercasing.
 * e.g., "Látex Estéril 10ml" -> "latex esteril 10ml"
 */
export const normalizeSearchText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

/**
 * Evaluates whether a product matches a user search query.
 * Supports searching by:
 * - Código / SKU (exacto, parcial, con o sin guiones/espacios, e.g. "JER-01", "jer01")
 * - Precio (e.g. "275", "$275", "275.00", "$275.00", o rangos "< 300", "> 50", "100 - 300")
 * - Nombre del producto (tolerante a acentos/tildes, mayúsculas y minúsculas)
 * - Categoría y Subcategoría (tolerante a acentos)
 * - Descripción del producto
 * - Multi-término (todas las palabras ingresadas deben coincidir en algún campo del producto)
 */
export const matchesProductSearch = (product: Product, rawQuery: string): boolean => {
  if (!rawQuery || !rawQuery.trim()) return true;

  const query = rawQuery.trim();
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const priceNum = product.price ?? 0;
  const priceStr = priceNum.toFixed(2); // e.g. "275.00"
  const priceIntStr = Math.round(priceNum).toString(); // e.g. "275"
  const cleanCode = (product.code || '').replace(/[\s-_]/g, '').toLowerCase();

  // 1. Numeric comparison: "< 500", "<= 500"
  const lessThanMatch = query.match(/^<\s*=?\s*(\$?\s*\d+(\.\d+)?)/);
  if (lessThanMatch) {
    const targetPrice = parseFloat(lessThanMatch[1].replace('$', '').trim());
    if (!isNaN(targetPrice)) {
      return priceNum <= targetPrice;
    }
  }

  // 2. Numeric comparison: "> 100", ">= 100"
  const greaterThanMatch = query.match(/^>\s*=?\s*(\$?\s*\d+(\.\d+)?)/);
  if (greaterThanMatch) {
    const targetPrice = parseFloat(greaterThanMatch[1].replace('$', '').trim());
    if (!isNaN(targetPrice)) {
      return priceNum >= targetPrice;
    }
  }

  // 3. Price range: "100 - 300", "$100 - $300"
  const rangeMatch = query.match(/^(\$?\s*\d+(\.\d+)?)\s*-\s*(\$?\s*\d+(\.\d+)?)$/);
  if (rangeMatch) {
    const minPrice = parseFloat(rangeMatch[1].replace('$', '').trim());
    const maxPrice = parseFloat(rangeMatch[3].replace('$', '').trim());
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      return priceNum >= minPrice && priceNum <= maxPrice;
    }
  }

  // 4. Tokenized search: Every word must match at least one field of the product
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const normalizedName = normalizeSearchText(product.name);
  const normalizedCode = normalizeSearchText(product.code);
  const normalizedCategory = normalizeSearchText(product.category);
  const normalizedSubCategory = normalizeSearchText(product.subCategory);
  const normalizedDesc = normalizeSearchText(product.description);

  return tokens.every((token) => {
    // If token is a price query with '$': e.g. "$275" or "$275.00"
    const cleanedPriceToken = token.replace(/^\$/, '');
    if (cleanedPriceToken && !isNaN(Number(cleanedPriceToken))) {
      if (
        priceIntStr === cleanedPriceToken ||
        priceStr === cleanedPriceToken ||
        priceStr.includes(cleanedPriceToken)
      ) {
        return true;
      }
    }

    // Match code without dashes (e.g. "gla01" matches "GLA-01")
    const cleanToken = token.replace(/[\s-_]/g, '');
    if (cleanToken && cleanCode.includes(cleanToken)) {
      return true;
    }

    // Check textual fields with accent-insensitivity
    return (
      normalizedName.includes(token) ||
      normalizedCode.includes(token) ||
      normalizedCategory.includes(token) ||
      normalizedSubCategory.includes(token) ||
      normalizedDesc.includes(token) ||
      priceIntStr.includes(token) ||
      priceStr.includes(token)
    );
  });
};
