import { productsMock } from "../mocks/products.mock.js";
import type { Product } from "../mocks/products.mock.js";
import { ServiceError } from "../utils/errors.js";
import { normalizeText } from "../utils/text.js";

export type CatalogSearchInput = {
  query: string;
  category?: string;
  maxPrice?: number;
};

export type CatalogSearchResult = Pick<
  Product,
  "id" | "name" | "price" | "stock" | "shortDescription"
>;

const getSearchTerms = (query: string): string[] =>
  normalizeText(query)
    .split(/\s+/)
    .filter((term) => term.length > 2);

const getProductSearchText = (product: Product): string =>
  normalizeText(
    [
      product.name,
      product.category,
      product.shortDescription,
      product.description,
      ...Object.values(product.specifications).map(String),
    ].join(" "),
  );

const toCatalogSearchResult = (product: Product): CatalogSearchResult => ({
  id: product.id,
  name: product.name,
  price: product.price,
  stock: product.stock,
  shortDescription: product.shortDescription,
});

export const searchCatalog = ({
  query,
  category,
  maxPrice,
}: CatalogSearchInput): CatalogSearchResult[] => {
  const normalizedQuery = normalizeText(query);
  const searchTerms = getSearchTerms(query);
  const normalizedCategory = category ? normalizeText(category) : undefined;

  return productsMock
    .filter((product) => {
      const productSearchText = getProductSearchText(product);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        productSearchText.includes(normalizedQuery) ||
        searchTerms.every((term) => productSearchText.includes(term));
      const matchesCategory =
        normalizedCategory === undefined || normalizeText(product.category) === normalizedCategory;
      const matchesPrice = maxPrice === undefined || product.price <= maxPrice;

      return matchesQuery && matchesCategory && matchesPrice;
    })
    .map(toCatalogSearchResult);
};

export const getProductDetails = (productId: string): Product => {
  const product = productsMock.find((item) => item.id === productId);

  if (!product) {
    throw new ServiceError(
      "Não encontrei esse produto no catálogo.",
      404,
      "PRODUCT_NOT_FOUND",
    );
  }

  return product;
};
