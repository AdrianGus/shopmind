import { ordersMock } from "../mocks/orders.mock.js";
import type { Order, OrderItem } from "../mocks/orders.mock.js";
import { productsMock } from "../mocks/products.mock.js";
import {
  clearCart,
  getCart as getStoredCart,
} from "../stores/cart.store.js";
import { setPendingCheckoutConfirmation } from "../stores/session.store.js";
import { roundCurrency } from "../utils/currency.js";
import { getCurrentDateString } from "../utils/date.js";
import { serviceError } from "../utils/messages.js";

export type CheckoutInput = {
  sessionId: string;
  confirmed: boolean;
};

export type CheckoutResult = {
  success: true;
  orderId: string;
  estimatedDelivery: string;
  order: Order;
};

const generatedOrdersById = new Map<string, Order>();
let nextOrderNumber = 1;

const generateOrderId = (): string => {
  let orderId = "";

  do {
    orderId = `PED-${String(nextOrderNumber).padStart(4, "0")}`;
    nextOrderNumber += 1;
  } while (ordersMock.some((order) => order.orderId === orderId) || generatedOrdersById.has(orderId));

  return orderId;
};

const getEstimatedDelivery = (items: OrderItem[]): string => {
  const firstItem = items[0];

  if (!firstItem) {
    return "Prazo de entrega indisponível";
  }

  const product = productsMock.find((item) => item.id === firstItem.productId);

  return product?.estimatedDelivery ?? "Prazo de entrega indisponível";
};

export const checkout = ({
  sessionId,
  confirmed,
}: CheckoutInput): CheckoutResult => {
  if (!confirmed) {
    throw serviceError("CHECKOUT_CONFIRMATION_REQUIRED", 400);
  }

  const cart = getStoredCart(sessionId);

  if (cart.items.length === 0) {
    throw serviceError("CART_EMPTY", 400);
  }

  const items = cart.items.map<OrderItem>((item) => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
  }));
  const estimatedDelivery = getEstimatedDelivery(items);
  const today = getCurrentDateString();
  const order: Order = {
    orderId: generateOrderId(),
    status: "confirmado",
    history: [
      {
        date: today,
        event: "Pedido confirmado",
      },
    ],
    items,
    total: roundCurrency(cart.total),
    estimatedDelivery,
  };

  generatedOrdersById.set(order.orderId, order);
  clearCart(sessionId);
  setPendingCheckoutConfirmation(sessionId, false);

  return {
    success: true,
    orderId: order.orderId,
    estimatedDelivery,
    order,
  };
};

export const getOrderStatus = (orderId: string): Order => {
  const generatedOrder = generatedOrdersById.get(orderId);

  if (generatedOrder) {
    return generatedOrder;
  }

  const mockOrder = ordersMock.find((order) => order.orderId === orderId);

  if (!mockOrder) {
    throw serviceError("ORDER_NOT_FOUND", 404);
  }

  return mockOrder;
};
