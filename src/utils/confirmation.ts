import { normalizeText } from "./text.js";

const CONFIRMATION_KEYWORDS = [
  "confirmo",
  "pode fechar",
  "pode finalizar",
];

const NEGATION_PATTERN = /\b(nao|nunca|nem)\b/;

export const isExplicitConfirmation = (message: string): boolean => {
  const normalized = normalizeText(message)
    .replace(/[,.!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (NEGATION_PATTERN.test(normalized)) {
    return false;
  }

  return CONFIRMATION_KEYWORDS.some((keyword) => normalized.includes(keyword));
};
