export type ToolCallLogEntry = {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
};

export type AgentSuccessResponse = {
  message: string;
  tool_calls_log: ToolCallLogEntry[];
  tool_calls_count: number;
};

type AgentErrorPayload = {
  status: string;
  message?: string;
};

function isAgentSuccess(data: unknown): data is AgentSuccessResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const d = data as Record<string, unknown>;
  return (
    typeof d.message === "string" &&
    Array.isArray(d.tool_calls_log) &&
    typeof d.tool_calls_count === "number"
  );
}

export async function postAgentMessage(message: string, sessionId: string): Promise<AgentSuccessResponse> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    let detail = response.statusText;
    if (
      typeof raw === "object" &&
      raw !== null &&
      "message" in raw &&
      typeof (raw as AgentErrorPayload).message === "string"
    ) {
      detail = (raw as AgentErrorPayload).message!;
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }

  if (!isAgentSuccess(raw)) {
    throw new Error("Resposta inválida do servidor.");
  }

  return raw;
}
