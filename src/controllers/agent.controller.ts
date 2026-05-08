import type { RequestHandler } from "express";
import { z } from "zod";

import { runShopMindAgent } from "../agent/shopmind.agent.js";

const agentRequestSchema = z.object({
  message: z.string().trim().min(1),
  session_id: z.string().trim().min(1),
});

export const handleAgentRequest: RequestHandler = async (req, res) => {
  const validation = agentRequestSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      status: "error",
      message: "message and session_id are required",
    });
    return;
  }

  const result = await runShopMindAgent(validation.data);

  res.status(200).json(result);
};
