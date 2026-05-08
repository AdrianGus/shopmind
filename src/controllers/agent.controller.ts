import type { RequestHandler } from "express";

const hasRequiredAgentFields = (
  body: unknown,
): body is { message: string; session_id: string } => {
  if (body === null || typeof body !== "object") {
    return false;
  }

  const payload = body as Record<string, unknown>;

  return (
    typeof payload.message === "string" &&
    payload.message.trim().length > 0 &&
    typeof payload.session_id === "string" &&
    payload.session_id.trim().length > 0
  );
};

export const handleAgentRequest: RequestHandler = (req, res) => {
  if (!hasRequiredAgentFields(req.body)) {
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
