import type { ToolAction } from "genkit";
import { z } from "genkit";

import { searchCatalog } from "../../services/catalog.service.js";
import type { CatalogSearchInput } from "../../services/catalog.service.js";
import { ai } from "../genkit.js";

const searchCatalogInputSchema = z.object({
  query: z.string().trim().min(1),
  category: z.string().trim().min(1).optional(),
  max_price: z.number().nonnegative().optional(),
});

export const searchCatalogTool: ToolAction = ai.defineTool(
  {
    name: "buscar_catalogo",
    description:
      "Search the product catalog by query, optional category, and optional maximum price.",
    inputSchema: searchCatalogInputSchema,
  },
  async (input) => {
    const serviceInput: CatalogSearchInput = {
      query: input.query,
    };

    if (input.category !== undefined) {
      serviceInput.category = input.category;
    }

    if (input.max_price !== undefined) {
      serviceInput.maxPrice = input.max_price;
    }

    return searchCatalog(serviceInput);
  },
);
