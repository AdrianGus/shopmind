# ShopMind

Kobe Technical Challenge — Shopping Agent.

## Runtime

This project is pinned to Node.js 24 through `.nvmrc` and `package.json`:

```sh
nvm use 24
node --version
```

`node --version` should print `v24.x`. If you run `pnpm install` with Node.js
`v25.6.0`, pnpm warns with `Unsupported engine` because the project explicitly
supports `>=24 <25`.

## Setup

```sh
pnpm install
```

If an external checklist asks for **`npm install`**, prefer **`pnpm install`**
instead: this repository ships a **`pnpm-lock.yaml`** and documents the pnpm
workflow. Plain `npm install` does not use that lockfile and is not the
supported reproducible setup here.

## Scripts

```sh
pnpm dev
pnpm check
pnpm build
pnpm start
```

- `pnpm dev` runs the TypeScript server with watch mode.
- `pnpm check` type-checks the project without emitting files.
- `pnpm build` compiles TypeScript ESM into `dist/`.
- `pnpm start` runs the compiled server from `dist/server.js`.

## API

### GET /health

Returns the service health status:

```json
{
  "status": "ok",
  "service": "shopmind",
  "environment": "development"
}
```

### POST /api/agent

Receives a user message and returns the agent's response with a log of every
tool call executed during the turn.

Invalid payloads (missing/empty fields) receive **400** with `status: "error"`.
If the JSON is valid but **`GEMINI_API_KEY`** is missing, the network fails, or
Gemini/Genkit errors for another infrastructure reason, the handler may still
respond **200** with a short fallback `message`, an **empty** `tool_calls_log`,
and `tool_calls_count: 0`. Treat a non-empty, sensible `tool_calls_log` as the
signal that the agent turn actually exercised tools successfully.

**Request:**

```json
{
  "message": "Quero comprar um tênis de corrida até R$ 400",
  "session_id": "abc-123"
}
```

**Response:**

```json
{
  "message": "Encontrei uma opção para você: ...",
  "tool_calls_log": [
    {
      "tool": "buscar_catalogo",
      "args": { "query": "tênis de corrida", "max_price": 400, "session_id": "abc-123" },
      "result": [{ "id": "tenis-runner-pro", "name": "Tênis Runner Pro", "price": 349.9, "stock": 8, "shortDescription": "..." }]
    }
  ],
  "tool_calls_count": 1
}
```

## Tools

| Tool | Description |
|------|-------------|
| `buscar_catalogo` | Search products by query, category, and/or max price |
| `resolver_referencia` | Resolve a positional reference ("segundo item") from the last search |
| `ver_produto` | Return full product details (specs, reviews, stock by SKU, delivery) |
| `verificar_carrinho` | Return the current cart with items, subtotals, and total |
| `adicionar_ao_carrinho` | Add a product to the cart after validating stock |
| `fechar_pedido` | Finalize an order — requires explicit user confirmation |
| `consultar_pedido` | Look up an existing order's status and history |

## Architecture Decisions

### Service / tool separation

The ecommerce operations are implemented as pure services before any Genkit
tool wiring. Tools validate and translate external input, call a service,
and return the service result. This keeps catalog, cart, and order rules
independent from the LLM layer.

### Function calling loop

The agent uses Genkit's `ai.generate` with `maxTurns: 5`, which lets the LLM
chain up to 5 rounds of tool calls in a single request. Each round can invoke
one or more tools, and the LLM uses tool results to decide the next action.

### Dual checkout guardrail

Closing an order requires two independent gates:

1. **System prompt rule** — instructs the LLM to call `verificar_carrinho`
   first, show a summary, and only call `fechar_pedido` after explicit
   confirmation keywords ("confirmo", "pode fechar", "pode finalizar").
2. **Code-level session flag** — `verificar_carrinho` sets
   `pendingCheckoutConfirmation = true`; the agent runner checks if the next
   user message passes `isExplicitConfirmation()` before setting
   `checkoutAllowed = true`. The `fechar_pedido` tool throws 403 if this flag
   is false.

This prevents checkout even if the LLM hallucinates a premature `fechar_pedido`
call.

### Session-based positional references

`buscar_catalogo` stores results in `session.lastCatalogResults`.
`resolver_referencia` looks up by 1-based index, so "segundo item" reliably
resolves to the correct product regardless of LLM interpretation.

## Assumptions and Limitations

- **In-memory stores** — all session, cart, and order state is lost on server
  restart. Adequate for demonstration; not production-ready.
- **Mock data** — the catalog and pre-existing orders are hardcoded. The
  evaluation focuses on how the agent orchestrates tools, not on data layer
  complexity.
- **LLM non-determinism** — the agent's text responses vary between runs. The
  `tool_calls_log` field is the reliable artifact for validating correct
  behavior.
- **No authentication** — `session_id` is trusted as-is; there is no auth
  layer.
- **Max 5 tool-call rounds per request** — prevents infinite loops but limits
  very long chains.
- **Single-server, single-process** — no concurrent session safety guarantees.

## Tested Scenarios

The four mandatory scenarios from the challenge are documented with curl
commands, expected tool call sequences, and acceptance checklists in
[`docs/manual-tests.md`](docs/manual-tests.md).
