import type { ToolAction } from "genkit";
import { z } from "genkit";

import { checkout } from "../../services/order.service.js";
import { getSession, setCheckoutAllowed } from "../../stores/session.store.js";
import { ServiceError } from "../../utils/errors.js";
import { ai } from "../genkit.js";
import { runToolSafely } from "./tool-result.js";

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
  async ({ session_id: sessionId, confirmed }) => {
    return runToolSafely(() => {
      const session = getSession(sessionId);

      if (!session.checkoutAllowed) {
        throw new ServiceError(
          "Para fechar o pedido, confirme explicitamente depois de revisar o carrinho.",
          403,
          "CHECKOUT_BLOCKED",
        );
      }

      const result = checkout({ sessionId, confirmed });
      setCheckoutAllowed(sessionId, false);
      return result;
    });
  },
);
