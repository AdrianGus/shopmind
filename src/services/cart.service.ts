import { productsMock } from "../mocks/products.mock.js";
import {
  addCartItem,
  getCart as getStoredCart,
} from "../stores/cart.store.js";
import type { Cart } from "../stores/cart.store.js";
import { ServiceError } from "../utils/errors.js";

export type AddToCartInput = {
  productId: string;
  quantity: number;
  sessionId: string;
};

export const getCart = (sessionId: string): Cart => getStoredCart(sessionId);

export const addToCart = ({
  productId,
  quantity,
  sessionId,
}: AddToCartInput): Cart => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ServiceError("Quantity must be a positive integer", 400);
  }

  const product = productsMock.find((item) => item.id === productId);

  if (!product) {
    throw new ServiceError("Product not found", 404);
  }

  if (product.stock <= 0) {
    throw new ServiceError("Product is out of stock", 409);
  }

  const cart = getStoredCart(sessionId);
  const existingItem = cart.items.find((item) => item.productId === productId);
  const quantityInCart = existingItem?.quantity ?? 0;

  if (quantityInCart + quantity > product.stock) {
    throw new ServiceError("Requested quantity exceeds available stock", 409);
  }

  return addCartItem(sessionId, {
    productId: product.id,
    name: product.name,
    quantity,
    unitPrice: product.price,
  });
};
