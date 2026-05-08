import type { RequestHandler } from "express";
import { z } from "zod";

import { runShopMindAgent } from "../agent/shopmind.agent.js";
import type { AgentResult } from "../agent/shopmind.agent.js";

const agentRequestSchema = z.object({
  message: z.string().trim().min(1),
  session_id: z.string().trim().min(1),
});

const hasPayloadField = (body: unknown, field: "message" | "session_id"): boolean =>
  typeof body === "object" && body !== null && field in body;

const getInvalidPayloadMessage = (body: unknown): string => {
  const hasMessage = hasPayloadField(body, "message");
  const hasSessionId = hasPayloadField(body, "session_id");

  if (!hasMessage && !hasSessionId) {
    return "message and session_id are required";
  }

  if (!hasMessage) {
    return "message is required";
  }

  if (!hasSessionId) {
    return "session_id is required";
  }

  return "message and session_id must be non-empty strings";
};

export const handleAgentRequest: RequestHandler = async (req, res) => {
  const validation = agentRequestSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      status: "error",
      message: getInvalidPayloadMessage(req.body),
    });
    return;
  }

  try {
    const result = await runShopMindAgent(validation.data);
    res.status(200).json(result);
  } catch (error) {
    console.error("Agent controller failed", error);

    res.status(200).json({
      message: "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?",
      tool_calls_log: [],
      tool_calls_count: 0,
    } satisfies AgentResult);
  }
};
