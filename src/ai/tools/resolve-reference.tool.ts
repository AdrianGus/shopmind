import type { ToolAction } from "genkit";
import { z } from "genkit";

import { getSession } from "../../stores/session.store.js";
import { ai } from "../genkit.js";

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
  async ({ session_id: sessionId, position }) => {
    const { lastCatalogResults } = getSession(sessionId);

    if (lastCatalogResults.length === 0) {
      return { error: "Nenhum resultado de busca recente encontrado nesta sessão." };
    }

    if (position > lastCatalogResults.length) {
      return {
        error: `Posição inválida. A última busca retornou ${lastCatalogResults.length} resultado(s).`,
      };
    }

    return lastCatalogResults[position - 1];
  },
);
