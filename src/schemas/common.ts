import { z } from "zod";

export const sessionIdSchema = z.string().trim().min(1);
export const productIdSchema = z.string().trim().min(1);
export const orderIdSchema = z.string().trim().min(1);

export const agentRequestSchema = z.object({
  message: z.string().trim().min(1),
  session_id: sessionIdSchema,
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;
