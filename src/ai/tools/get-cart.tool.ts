import type { ToolAction } from "genkit";
import { z } from "genkit";

import { getCart } from "../../services/cart.service.js";
import { setPendingCheckoutConfirmation } from "../../stores/session.store.js";
import { ai } from "../genkit.js";
import { runToolSafely } from "./tool-result.js";

const getCartInputSchema = z.object({
  session_id: z.string().trim().min(1),
});

export const getCartTool: ToolAction = ai.defineTool(
  {
    name: "verificar_carrinho",
    description:
      "Return the current shopping cart for a session, including items, subtotals, and total.",
    inputSchema: getCartInputSchema,
  },
  async ({ session_id: sessionId }) => {
    return runToolSafely(() => {
      const cart = getCart(sessionId);

      if (cart.items.length === 0) {
        setPendingCheckoutConfirmation(sessionId, false);
        return {
          ...cart,
          is_empty: true,
          message: "Seu carrinho está vazio. Quer que eu te ajude a encontrar algum produto?",
        };
      }

      setPendingCheckoutConfirmation(sessionId, true);

      return {
        ...cart,
        is_empty: false,
      };
    });
  },
);
