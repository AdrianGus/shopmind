import type { MessageData } from "genkit";

import { ai } from "../ai/genkit.js";
import { allTools } from "../ai/tools/index.js";
import { getSession, addSessionMessage, setCheckoutAllowed } from "../stores/session.store.js";
import type { SessionMessage } from "../stores/session.store.js";
import { isExplicitConfirmation } from "../utils/confirmation.js";
import { buildSystemPrompt } from "./system-prompt.js";

const MAX_TOOL_CALLS = 5;

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

  const response = await ai.generate({
    system: buildSystemPrompt(input.session_id),
    messages: history,
    prompt: input.message,
    tools: allTools,
    maxTurns: MAX_TOOL_CALLS,
  });

  let tool_calls_log = extractToolCallsLog(response.messages);

  let message =
    response.text ||
    "Desculpe, não consegui completar todas as etapas. Pode reformular seu pedido?";

  if (tool_calls_log.length > MAX_TOOL_CALLS) {
    tool_calls_log = tool_calls_log.slice(0, MAX_TOOL_CALLS);
    message =
      "Atingi o limite de operações por mensagem. Pode dividir seu pedido em etapas menores?";
  }

  addSessionMessage(input.session_id, { role: "user", content: input.message });
  addSessionMessage(input.session_id, { role: "assistant", content: message });

  return { message, tool_calls_log, tool_calls_count: tool_calls_log.length };
};
