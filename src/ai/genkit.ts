import { googleAI } from "@genkit-ai/google-genai";
import { genkit } from "genkit";
import type { Genkit } from "genkit";

export const ai: Genkit = genkit({
  plugins: [googleAI()],
  model: googleAI.model(process.env.GENKIT_MODEL ?? "gemini-2.5-flash"),
});
