import type { ToolAction } from "genkit";
import { z } from "genkit";

import { getProductDetails } from "../../services/catalog.service.js";
import { ai } from "../genkit.js";
import { runToolSafely } from "./tool-result.js";

const getProductDetailsInputSchema = z.object({
  product_id: z.string().trim().min(1),
});

export const getProductDetailsTool: ToolAction = ai.defineTool(
  {
    name: "ver_produto",
    description:
      "Return complete details for a specific product, including specifications, reviews, stock, and delivery estimate.",
    inputSchema: getProductDetailsInputSchema,
  },
  async ({ product_id: productId }) => runToolSafely(() => getProductDetails(productId)),
);
