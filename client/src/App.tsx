import type { FormEvent, JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { postAgentMessage, type ToolCallLogEntry } from "./api/agent";

const SESSION_STORAGE_KEY = "shopmind_session_id";

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; tool_calls_log?: ToolCallLogEntry[] };

function createId(): string {
  return crypto.randomUUID();
}

export function App(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isSending, setIsSending] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(SESSION_STORAGE_KEY) : null;
    setSessionId(saved && saved.trim() !== "" ? saved : createId());
  }, []);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const startNewSession = useCallback(() => {
    const nextId = createId();
    localStorage.setItem(SESSION_STORAGE_KEY, nextId);
    setSessionId(nextId);
    setMessages([]);
    setDraftMessage("");
  }, []);

  const send = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const trimmed = draftMessage.trim();
      if (!trimmed || !sessionId || isSending) {
        return;
      }

      const userBubble: ChatMessage = { id: createId(), role: "user", text: trimmed };
      setDraftMessage("");
      setMessages((prev) => [...prev, userBubble]);
      setIsSending(true);

      try {
        const result = await postAgentMessage(trimmed, sessionId);
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            text: result.message,
            tool_calls_log: result.tool_calls_log,
          },
        ]);
      } catch (err) {
        const fallback = err instanceof Error ? err.message : "Algo deu errado.";
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            text: fallback,
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [draftMessage, sessionId, isSending],
  );

  return (
    <div style={styles.shell}>
      <div style={styles.gridOverlay} aria-hidden />

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>ShopMind</h1>
          <p style={styles.subtitle}>Assistente de compras (Genkit)</p>
        </div>

        <div style={styles.sessionRow}>
          <span style={styles.sessionLabel}>Sessão</span>
          <code style={styles.sessionBadge} aria-label={sessionId ? `ID da sessão: ${sessionId}` : "Gerando sessão"}>
            {sessionId ? sessionId : "…"}
          </code>
          <button type="button" style={styles.ghostBtn} onClick={startNewSession}>
            Nova sessão
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div ref={listRef} style={styles.thread} role="log" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 ? (
            <p style={styles.empty}>
              Experimente perguntas do desafio, por exemplo:&nbsp;
              <span style={{ color: "var(--muted)" }}>
                «Quero comprar um tênis de corrida até R$ 400»
              </span>
            </p>
          ) : (
            messages.map((message) =>
              message.role === "user" ? (
                <article key={message.id} style={styles.userBubble}>
                  {message.text}
                </article>
              ) : (
                <article key={message.id} style={styles.assistantBubble}>
                  <div style={{ marginBottom: 8 }}>{message.text}</div>
                  {message.tool_calls_log != null && message.tool_calls_log.length > 0 && (
                    <details style={styles.details}>
                      <summary style={styles.detailsSummary}>Ver tool_calls_log</summary>
                      <pre style={styles.pre}>{JSON.stringify(message.tool_calls_log, null, 2)}</pre>
                    </details>
                  )}
                </article>
              ),
            )
          )}
        </div>

        <form ref={formRef} style={styles.form} onSubmit={send}>
          <label htmlFor="composer" style={styles.visuallyHidden}>
            Mensagem
          </label>
          <textarea
            id="composer"
            rows={3}
            value={draftMessage}
            placeholder="Digite sua mensagem"
            disabled={isSending || !sessionId}
            style={styles.textarea}
            onChange={(event) => setDraftMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          />
          <div style={styles.formFooter}>
            <button type="submit" style={styles.primaryBtn} disabled={isSending || !sessionId.trim()}>
              {isSending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100dvh",
    background: "radial-gradient(1200px 600px at 10% -10%, rgba(94, 228, 181, 0.12), transparent 55%), var(--bg0)",
    position: "relative",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "fixed",
    inset: 0,
    backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
    backgroundSize: "72px 72px",
    maskImage: "radial-gradient(ellipse at top, rgba(0,0,0,0.55), transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
    padding: "32px clamp(18px, 4vw, 48px)",
    borderBottom: "1px solid var(--border)",
    background: "color-mix(in oklab, var(--bg1) 88%, transparent)",
    backdropFilter: "blur(10px)",
    position: "relative",
    zIndex: 1,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontFamily: "'Fraunces', Georgia, serif",
    letterSpacing: "-0.02em",
    fontSize: "clamp(1.85rem, 3vw, 2.65rem)",
    fontWeight: 600,
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "10px 0 0",
    color: "var(--muted)",
    fontSize: 15,
  },
  sessionRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  sessionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "var(--muted)",
  },
  sessionBadge: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 12,
    padding: "8px 12px",
    borderRadius: "var(--radius-pill)",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    maxWidth: 320,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  ghostBtn: {
    borderRadius: "var(--radius-pill)",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer",
    minHeight: 44,
  },
  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: 860,
    margin: "0 auto",
    padding: "28px clamp(18px, 4vw, 48px) 40px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minHeight: "calc(100dvh - 140px)",
  },
  thread: {
    flex: 1,
    overflowY: "auto",
    paddingRight: 6,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  empty: {
    margin: 0,
    padding: "18px 20px",
    borderRadius: "var(--radius-lg)",
    border: "1px dashed var(--border)",
    color: "var(--muted)",
    background: "var(--surface)",
    lineHeight: 1.6,
    fontSize: 15,
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "min(620px, 100%)",
    padding: "14px 16px",
    borderRadius: "18px 18px 4px 18px",
    border: "1px solid rgba(94, 228, 181, 0.25)",
    background: "linear-gradient(135deg, rgba(94, 228, 181, 0.18), rgba(255, 255, 255, 0.04))",
    boxShadow: "0 14px 50px rgba(0, 0, 0, 0.25)",
    fontSize: 15,
    whiteSpace: "pre-wrap",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "min(620px, 100%)",
    padding: "16px 18px",
    borderRadius: "18px 18px 18px 4px",
    border: "1px solid var(--border)",
    background: "var(--surface-strong)",
    boxShadow: "var(--shadow-deep)",
    fontSize: 15,
    whiteSpace: "pre-wrap",
  },
  details: {
    marginTop: 10,
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: "8px 10px",
    color: "var(--muted)",
    fontSize: 13,
  },
  detailsSummary: {
    cursor: "pointer",
    fontWeight: 600,
    color: "var(--text)",
  },
  pre: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: "8px 0 0",
    fontSize: 12,
    lineHeight: 1.45,
    color: "var(--muted)",
    maxHeight: 280,
    overflow: "auto",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    background: "color-mix(in oklab, var(--bg1) 75%, transparent)",
    padding: 16,
    boxShadow: "0 28px 60px rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(8px)",
    position: "sticky",
    bottom: 22,
    marginBottom: "max(22px, env(safe-area-inset-bottom))",
  },
  textarea: {
    width: "100%",
    resize: "vertical",
    minHeight: 96,
    borderRadius: "var(--radius-md)",
    padding: "12px 14px",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 16,
    outline: "none",
  },
  formFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryBtn: {
    marginLeft: "auto",
    border: "none",
    borderRadius: "var(--radius-pill)",
    padding: "12px 24px",
    fontWeight: 700,
    background: "var(--accent)",
    color: "#06110c",
    cursor: "pointer",
    boxShadow: "0 14px 50px rgba(94, 228, 181, 0.25)",
    minHeight: 48,
    minWidth: 120,
  },
  visuallyHidden: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  },
};
