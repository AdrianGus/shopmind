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
import { ServiceError } from "../utils/errors.js";

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
    return "Delivery estimate unavailable";
  }

  const product = productsMock.find((item) => item.id === firstItem.productId);

  return product?.estimatedDelivery ?? "Delivery estimate unavailable";
};

export const checkout = ({
  sessionId,
  confirmed,
}: CheckoutInput): CheckoutResult => {
  if (!confirmed) {
    throw new ServiceError(
      "Confirme o fechamento do pedido antes de concluir a compra.",
      400,
      "CHECKOUT_CONFIRMATION_REQUIRED",
    );
  }

  const cart = getStoredCart(sessionId);

  if (cart.items.length === 0) {
    throw new ServiceError(
      "Seu carrinho está vazio. Quer que eu te ajude a encontrar algum produto?",
      400,
      "CART_EMPTY",
    );
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
        event: "Order confirmed",
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
    throw new ServiceError(
      "Não encontrei o pedido informado. Confira se o código está correto.",
      404,
      "ORDER_NOT_FOUND",
    );
  }

  return mockOrder;
};
