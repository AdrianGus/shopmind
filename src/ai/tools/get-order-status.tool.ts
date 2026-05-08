import type { ToolAction } from "genkit";
import { z } from "genkit";

import { getOrderStatus } from "../../services/order.service.js";
import { ai } from "../genkit.js";

const getOrderStatusInputSchema = z.object({
  order_id: z.string().trim().min(1),
});

export const getOrderStatusTool: ToolAction = ai.defineTool(
  {
    name: "consultar_pedido",
    description:
      "Return the status and history for an existing order without inventing missing data.",
    inputSchema: getOrderStatusInputSchema,
  },
  async ({ order_id: orderId }) => getOrderStatus(orderId),
);
