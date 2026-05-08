import {
  addCartItem,
  getCart as getStoredCart,
} from "../stores/cart.store.js";
import type { Cart } from "../stores/cart.store.js";
import { serviceError } from "../utils/messages.js";
import { findProductById } from "../utils/product-lookup.js";

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
    throw serviceError("INVALID_QUANTITY", 400);
  }

  const product = findProductById(productId);

  if (product.stock <= 0) {
    throw serviceError("OUT_OF_STOCK", 409);
  }

  const cart = getStoredCart(sessionId);
  const existingItem = cart.items.find((item) => item.productId === productId);
  const quantityInCart = existingItem?.quantity ?? 0;

  if (quantityInCart + quantity > product.stock) {
    throw serviceError("INSUFFICIENT_STOCK", 409);
  }

  return addCartItem(sessionId, {
    productId: product.id,
    name: product.name,
    quantity,
    unitPrice: product.price,
  });
};
