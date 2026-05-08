import { productsMock } from "../mocks/products.mock.js";
import type { Product } from "../mocks/products.mock.js";
import { serviceError } from "./messages.js";

export const findProductById = (productId: string): Product => {
  const product = productsMock.find((item) => item.id === productId);

  if (!product) {
    throw serviceError("PRODUCT_NOT_FOUND", 404);
  }

  return product;
};
