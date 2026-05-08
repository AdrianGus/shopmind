import type { ToolAction } from "genkit";
import { z } from "genkit";

import { checkout } from "../../services/order.service.js";
import { ai } from "../genkit.js";

const checkoutInputSchema = z.object({
  session_id: z.string().trim().min(1),
  confirmed: z.boolean(),
});

export const checkoutTool: ToolAction = ai.defineTool(
  {
    name: "fechar_pedido",
    description:
      "Finalize the session cart as an order only when explicit checkout confirmation is true.",
    inputSchema: checkoutInputSchema,
  },
  async ({ session_id: sessionId, confirmed }) =>
    checkout({
      sessionId,
      confirmed,
    }),
);
