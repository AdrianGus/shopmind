import type { RequestHandler } from "express";
import { z } from "zod";

const agentRequestSchema = z.object({
  message: z.string().trim().min(1),
  session_id: z.string().trim().min(1),
});

export const handleAgentRequest: RequestHandler = (req, res) => {
  const validation = agentRequestSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      status: "error",
      message: "message and session_id are required",
    });
    return;
  }

  res.status(200).json({
    message: "ShopMind está pronto para ajudar.",
    tool_calls_log: [],
  });
};
