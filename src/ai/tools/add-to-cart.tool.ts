import type { ToolAction } from "genkit";
import { z } from "genkit";

import { addToCart } from "../../services/cart.service.js";
import { ai } from "../genkit.js";

const addToCartInputSchema = z.object({
  product_id: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  session_id: z.string().trim().min(1),
});

export const addToCartTool: ToolAction = ai.defineTool(
  {
    name: "adicionar_ao_carrinho",
    description:
      "Add an available product to the session cart after validating quantity and stock.",
    inputSchema: addToCartInputSchema,
  },
  async ({ product_id: productId, quantity, session_id: sessionId }) =>
    addToCart({
      productId,
      quantity,
      sessionId,
    }),
);
