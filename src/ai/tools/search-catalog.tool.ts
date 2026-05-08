import type { ToolAction } from "genkit";
import { z } from "genkit";

import { searchCatalog } from "../../services/catalog.service.js";
import type { CatalogSearchInput } from "../../services/catalog.service.js";
import { updateLastCatalogResults } from "../../stores/session.store.js";
import { ai } from "../genkit.js";
import { runToolSafely } from "./tool-result.js";

const searchCatalogInputSchema = z.object({
  query: z.string().trim().min(1),
  category: z.string().trim().min(1).optional(),
  max_price: z.number().nonnegative().optional(),
  session_id: z.string().trim().min(1),
});

export const searchCatalogTool: ToolAction = ai.defineTool(
  {
    name: "buscar_catalogo",
    description:
      "Search the product catalog by query, optional category, and optional maximum price.",
    inputSchema: searchCatalogInputSchema,
  },
  async ({ session_id: sessionId, ...input }) =>
    runToolSafely(() => {
      const serviceInput: CatalogSearchInput = {
        query: input.query,
      };

      if (input.category !== undefined) {
        serviceInput.category = input.category;
      }

      if (input.max_price !== undefined) {
        serviceInput.maxPrice = input.max_price;
      }

      const results = searchCatalog(serviceInput);
      updateLastCatalogResults(sessionId, results);

      return results;
    }),
);
