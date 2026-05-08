import type { ToolAction } from "genkit";
import { z } from "genkit";

import { getSession } from "../../stores/session.store.js";
import { ServiceError } from "../../utils/errors.js";
import { ai } from "../genkit.js";
import { runToolSafely } from "./tool-result.js";

const resolveReferenceInputSchema = z.object({
  session_id: z.string().trim().min(1),
  position: z.number().int().positive(),
});

export const resolveReferenceTool: ToolAction = ai.defineTool(
  {
    name: "resolver_referencia",
    description:
      "Resolve a positional reference (e.g., 1 for 'primeiro item') from the last catalog search results in the session.",
    inputSchema: resolveReferenceInputSchema,
  },
  async ({ session_id: sessionId, position }) =>
    runToolSafely(() => {
      const { lastCatalogResults } = getSession(sessionId);

      if (lastCatalogResults.length === 0) {
        throw new ServiceError(
          "Nenhum resultado de busca recente encontrado nesta sessão.",
          404,
          "REFERENCE_NOT_FOUND",
        );
      }

      if (position > lastCatalogResults.length) {
        throw new ServiceError(
          `Posição inválida. A última busca retornou ${lastCatalogResults.length} resultado(s).`,
          400,
          "INVALID_REFERENCE",
        );
      }

      return lastCatalogResults[position - 1];
    }),
);
