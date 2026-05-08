import { roundCurrency } from "../utils/currency.js";

export type CartItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Cart = {
  sessionId: string;
  items: CartItem[];
  total: number;
};

export type AddCartItemInput = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

const cartsBySessionId = new Map<string, Cart>();

const calculateCartTotal = (items: CartItem[]): number =>
  roundCurrency(items.reduce((total, item) => total + item.subtotal, 0));

const createEmptyCart = (sessionId: string): Cart => ({
  sessionId,
  items: [],
  total: 0,
});

export const getCart = (sessionId: string): Cart => {
  const cart = cartsBySessionId.get(sessionId);

  if (cart) {
    return cart;
  }

  const emptyCart = createEmptyCart(sessionId);
  cartsBySessionId.set(sessionId, emptyCart);

  return emptyCart;
};

export const addCartItem = (sessionId: string, item: AddCartItemInput): Cart => {
  const cart = getCart(sessionId);
  const existingItem = cart.items.find((cartItem) => cartItem.productId === item.productId);
  const itemSubtotal = roundCurrency(item.quantity * item.unitPrice);

  if (existingItem) {
    existingItem.quantity += item.quantity;
    existingItem.subtotal = roundCurrency(existingItem.quantity * existingItem.unitPrice);
  } else {
    cart.items.push({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: itemSubtotal,
    });
  }

  cart.total = calculateCartTotal(cart.items);

  return cart;
};

export const clearCart = (sessionId: string): Cart => {
  const emptyCart = createEmptyCart(sessionId);
  cartsBySessionId.set(sessionId, emptyCart);

  return emptyCart;
};
