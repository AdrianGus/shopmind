export type OrderStatus = "confirmado" | "em separação" | "enviado" | "entregue";

export type OrderHistoryEntry = {
  date: string;
  event: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Order = {
  orderId: string;
  status: OrderStatus;
  history: OrderHistoryEntry[];
  items: OrderItem[];
  total: number;
  estimatedDelivery: string;
};

export const ordersMock: Order[] = [
  {
    orderId: "PED-2891",
    status: "em separação",
    history: [
      {
        date: "2026-05-08",
        event: "Pedido confirmado",
      },
      {
        date: "2026-05-08",
        event: "Pedido em separação",
      },
    ],
    items: [
      {
        productId: "tenis-runner-pro",
        name: "Tênis Runner Pro",
        quantity: 1,
        unitPrice: 349.9,
        subtotal: 349.9,
      },
    ],
    total: 349.9,
    estimatedDelivery: "3 a 5 dias úteis",
  },
  {
    orderId: "PED-1742",
    status: "enviado",
    history: [
      {
        date: "2026-05-06",
        event: "Pedido confirmado",
      },
      {
        date: "2026-05-07",
        event: "Pedido enviado",
      },
    ],
    items: [
      {
        productId: "fone-bluetooth-airbeat",
        name: "Fone Bluetooth AirBeat",
        quantity: 1,
        unitPrice: 199.9,
        subtotal: 199.9,
      },
      {
        productId: "camiseta-dry-fit-core",
        name: "Camiseta Dry Fit Core",
        quantity: 2,
        unitPrice: 89.9,
        subtotal: 179.8,
      },
    ],
    total: 379.7,
    estimatedDelivery: "1 a 3 dias úteis",
  },
];
