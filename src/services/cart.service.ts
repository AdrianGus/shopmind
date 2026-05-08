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
    throw new ServiceError(
      "Informe uma quantidade válida para adicionar ao carrinho.",
      400,
      "INVALID_QUANTITY",
    );
  }

  const product = productsMock.find((item) => item.id === productId);

  if (!product) {
    throw new ServiceError(
      "Não encontrei esse produto no catálogo.",
      404,
      "PRODUCT_NOT_FOUND",
    );
  }

  if (product.stock <= 0) {
    throw new ServiceError(
      "Esse produto está sem estoque, então não adicionei ao carrinho.",
      409,
      "OUT_OF_STOCK",
    );
  }

  const cart = getStoredCart(sessionId);
  const existingItem = cart.items.find((item) => item.productId === productId);
  const quantityInCart = existingItem?.quantity ?? 0;

  if (quantityInCart + quantity > product.stock) {
    throw new ServiceError(
      "Não há estoque suficiente para essa quantidade, então não adicionei ao carrinho.",
      409,
      "INSUFFICIENT_STOCK",
    );
  }

  return addCartItem(sessionId, {
    productId: product.id,
    name: product.name,
    quantity,
    unitPrice: product.price,
  });
};
