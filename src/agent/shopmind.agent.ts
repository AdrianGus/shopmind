import type { MessageData } from "genkit";

import { ai } from "../ai/genkit.js";
import { allTools } from "../ai/tools/index.js";
import { getSession, addSessionMessage, setCheckoutAllowed } from "../stores/session.store.js";
import type { SessionMessage } from "../stores/session.store.js";
import { isExplicitConfirmation } from "../utils/confirmation.js";
import { buildSystemPrompt } from "./system-prompt.js";

const MAX_TOOL_CALLS = 5;
const TOOL_CALL_LIMIT_MESSAGE =
  "Não consegui concluir essa solicitação com segurança. Pode reformular seu pedido?";
const TOOL_FAILURE_MESSAGE =
  "Não consegui executar uma operação necessária agora. Pode tentar novamente?";
const MODEL_FAILURE_MESSAGE =
  "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?";
const RATE_LIMIT_MESSAGE =
  "Limite de uso da API Gemini atingido (cota ou muitas requisições por minuto). Aguarde ~1 minuto e tente de novo, ou confira plano e faturamento no Google AI Studio.";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isRateLimitError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "code" in error && error.code === 429) {
    return true;
  }

  if (error && typeof error === "object" && "status" in error && error.status === "RESOURCE_EXHAUSTED") {
    return true;
  }

  const text =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "originalMessage" in error &&
          typeof (error as { originalMessage?: unknown }).originalMessage === "string"
        ? (error as { originalMessage: string }).originalMessage
        : String(error);

  return (
    /\b429\b/.test(text) ||
    /RESOURCE_EXHAUSTED/i.test(text) ||
    /quota exceeded/i.test(text) ||
    /rate limit/i.test(text)
  );
};

export type ToolCallLogEntry = {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
};

export type AgentResult = {
  message: string;
  tool_calls_log: ToolCallLogEntry[];
  tool_calls_count: number;
};

const toGenkitMessages = (messages: SessionMessage[]): MessageData[] =>
  messages.map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : msg.role,
    content: [{ text: msg.content }],
  }));

const extractToolCallsLog = (messages: MessageData[]): ToolCallLogEntry[] => {
  const responsesByRef = new Map<string, unknown>();

  for (const msg of messages) {
    for (const part of msg.content) {
      if ("toolResponse" in part && part.toolResponse) {
        const ref = part.toolResponse.ref ?? part.toolResponse.name;
        responsesByRef.set(ref, part.toolResponse.output);
      }
    }
  }

  const log: ToolCallLogEntry[] = [];

  for (const msg of messages) {
    for (const part of msg.content) {
      if ("toolRequest" in part && part.toolRequest) {
        const ref = part.toolRequest.ref ?? part.toolRequest.name;
        log.push({
          tool: part.toolRequest.name,
          args: (part.toolRequest.input as Record<string, unknown>) ?? {},
          result: responsesByRef.get(ref),
        });
      }
    }
  }

  return log;
};

const isToolCallLimitError = (error: unknown): boolean =>
  error instanceof Error &&
  error.message.includes("Exceeded maximum tool call iterations");

const isToolExecutionError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === "ZodError" || error.message.toLowerCase().includes("tool"));

const getAgentFailureMessage = (error: unknown): string => {
  if (isToolCallLimitError(error)) {
    return TOOL_CALL_LIMIT_MESSAGE;
  }

  if (isToolExecutionError(error)) {
    return TOOL_FAILURE_MESSAGE;
  }

  if (isRateLimitError(error)) {
    return RATE_LIMIT_MESSAGE;
  }

  return MODEL_FAILURE_MESSAGE;
};

const storeConversationTurn = (
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
): void => {
  addSessionMessage(sessionId, { role: "user", content: userMessage });
  addSessionMessage(sessionId, { role: "assistant", content: assistantMessage });
};

export const runShopMindAgent = async (input: {
  message: string;
  session_id: string;
}): Promise<AgentResult> => {
  const session = getSession(input.session_id);
  const history = toGenkitMessages(session.messages);

  if (session.pendingCheckoutConfirmation && isExplicitConfirmation(input.message)) {
    setCheckoutAllowed(input.session_id, true);
  } else {
    setCheckoutAllowed(input.session_id, false);
  }

  let response: Awaited<ReturnType<typeof ai.generate>> | undefined;

  try {
    const maxAttempts = 4;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await ai.generate({
          system: buildSystemPrompt(input.session_id),
          messages: history,
          prompt: input.message,
          tools: allTools,
          maxTurns: MAX_TOOL_CALLS,
        });
        break;
      } catch (error) {
        const retryable = isRateLimitError(error) && attempt < maxAttempts;
        if (retryable) {
          const delayMs = Math.min(12_000, 1_600 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 400);
          console.warn(
            `ShopMind: Gemini rate limit (429), tentativa ${attempt}/${maxAttempts - 1}, aguardando ${delayMs}ms`,
          );
          await sleep(delayMs);
          continue;
        }
        throw error;
      }
    }

    if (!response) {
      throw new Error("Resposta do modelo vazia após retries.");
    }
  } catch (error) {
    const message = getAgentFailureMessage(error);

    console.error("ShopMind agent failed", error);
    storeConversationTurn(input.session_id, input.message, message);

    return {
      message,
      tool_calls_log: [],
      tool_calls_count: 0,
    };
  }

  let tool_calls_log = extractToolCallsLog(response.messages);

  let message =
    response.text ||
    "Desculpe, não consegui completar todas as etapas. Pode reformular seu pedido?";

  if (tool_calls_log.length > MAX_TOOL_CALLS) {
    tool_calls_log = tool_calls_log.slice(0, MAX_TOOL_CALLS);
    message = TOOL_CALL_LIMIT_MESSAGE;
  }

  storeConversationTurn(input.session_id, input.message, message);

  return { message, tool_calls_log, tool_calls_count: tool_calls_log.length };
};
