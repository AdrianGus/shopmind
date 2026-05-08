# Manual Test Guide — ShopMind Mandatory Scenarios

## Prerequisites

1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
2. Start the server:

```sh
pnpm dev
```

3. Base URL: `http://localhost:3000`

> **Note:** The agent's text response is non-deterministic (LLM output varies between
> runs). The `tool_calls_log` array in the JSON response is the source of truth for
> validating which tools were called, in what order, and with which arguments.

---

## Full End-to-End Sequence

All scenarios below use a single `session_id` and must be executed **in order**
because each step depends on session state from the previous one:

1. Scenario 1 — Busca simples (search with price cap)
2. Setup — Broader search (populates session with 2+ results for Scenario 2)
3. Scenario 2 — Fluxo encadeado (details + add to cart)
4. Scenario 3a — Checkout request (must NOT finalize)
5. Scenario 3b — Explicit confirmation (finalizes order)
6. Scenario 4 — Order status lookup

---

## Scenario 1 — Busca simples

**Input:** "Quero comprar um tênis de corrida até R$ 400"

```sh
curl -s http://localhost:3000/api/agent \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Quero comprar um tênis de corrida até R$ 400",
    "session_id": "test-scenarios"
  }' | jq .
```

### Expected tool_calls_log

| # | tool | key args |
|---|------|----------|
| 1 | `buscar_catalogo` | query: running shoe term, max_price: 400, session_id |

### Acceptance checklist

- [ ] `tool_calls_count` is **1**
- [ ] Only `buscar_catalogo` appears in `tool_calls_log`
- [ ] `buscar_catalogo` args contain `max_price` of **400**
- [ ] Result includes **Tenis Runner Pro** (R$ 349,90)
- [ ] Response message presents options with name and price

### Must NOT happen

- `ver_produto` called
- `verificar_carrinho` called
- `adicionar_ao_carrinho` called
- `fechar_pedido` called
- `consultar_pedido` called

### Validate with jq

```sh
# Tool names (should be ["buscar_catalogo"])
... | jq '[.tool_calls_log[].tool]'

# Confirm no unwanted tools
... | jq '[.tool_calls_log[].tool] | map(select(. != "buscar_catalogo")) | length == 0'
```

---

## Setup — Broader search (pre-condition for Scenario 2)

Scenario 1 returns only 1 result (Runner Pro) because of the R$ 400 cap.
Scenario 2 references the "segundo item", so we need a search that returns 2+ products.

```sh
curl -s http://localhost:3000/api/agent \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Quero ver opções de tênis de corrida",
    "session_id": "test-scenarios"
  }' | jq .
```

### Expected result

- `buscar_catalogo` returns at least 2 products:
  1. Tenis Runner Pro (R$ 349,90 — stock: 8)
  2. Tenis Speed Max (R$ 529,90 — stock: 5)

This populates `lastCatalogResults` in the session so that "segundo item" resolves correctly.

---

## Scenario 2 — Fluxo encadeado

**Input:** "Me mostra mais detalhes do segundo item e, se estiver disponível, já coloca no meu carrinho"

```sh
curl -s http://localhost:3000/api/agent \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Me mostra mais detalhes do segundo item e, se estiver disponível, já coloca no meu carrinho",
    "session_id": "test-scenarios"
  }' | jq .
```

### Expected tool_calls_log

| # | tool | key args |
|---|------|----------|
| 1 | `resolver_referencia` | position: 2, session_id |
| 2 | `ver_produto` | product_id: (second product from setup search) |
| 3 | `adicionar_ao_carrinho` | product_id, quantity: 1, session_id |

### Acceptance checklist

- [ ] `ver_produto` is called
- [ ] Stock is verified from `ver_produto` result (stock > 0)
- [ ] `adicionar_ao_carrinho` is called because the product is in stock
- [ ] Response message explains what was done (product details + added to cart)

### Validate with jq

```sh
# Tool call sequence
... | jq '[.tool_calls_log[].tool]'

# Confirm ver_produto and adicionar_ao_carrinho are both present
... | jq '[.tool_calls_log[].tool] | (index("ver_produto") != null) and (index("adicionar_ao_carrinho") != null)'
```

---

## Scenario 3 — Confirmacao antes de fechar

### Step 1: Request checkout

**Input:** "Fecha o pedido pra mim"

```sh
curl -s http://localhost:3000/api/agent \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Fecha o pedido pra mim",
    "session_id": "test-scenarios"
  }' | jq .
```

#### Expected tool_calls_log

| # | tool | key args |
|---|------|----------|
| 1 | `verificar_carrinho` | session_id |

#### Acceptance checklist

- [ ] `verificar_carrinho` is called
- [ ] Response shows cart summary (items, quantities, subtotals, total)
- [ ] Response asks for **explicit confirmation**
- [ ] `fechar_pedido` is **NOT** in `tool_calls_log`

#### Validate with jq

```sh
# Confirm fechar_pedido was NOT called
... | jq '[.tool_calls_log[].tool] | index("fechar_pedido") == null'
```

### Step 2: Explicit confirmation

**Input:** "Sim, confirmo"

```sh
curl -s http://localhost:3000/api/agent \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Sim, confirmo",
    "session_id": "test-scenarios"
  }' | jq .
```

#### Expected tool_calls_log

| # | tool | key args |
|---|------|----------|
| 1 | `fechar_pedido` | session_id, confirmed: true |

#### Acceptance checklist

- [ ] `fechar_pedido` is called with `confirmed: true`
- [ ] Result contains `success: true` and an `orderId` (e.g. `PED-0001`)
- [ ] Result contains `estimatedDelivery`
- [ ] Response message includes the order ID and delivery estimate

#### Validate with jq

```sh
# Confirm fechar_pedido was called with confirmed=true
... | jq '.tool_calls_log[] | select(.tool == "fechar_pedido") | .args.confirmed'

# Extract order result
... | jq '.tool_calls_log[] | select(.tool == "fechar_pedido") | .result'
```

---

## Scenario 4 — Consulta de status

**Input:** "Cade meu pedido #PED-2891?"

```sh
curl -s http://localhost:3000/api/agent \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Cadê meu pedido #PED-2891?",
    "session_id": "test-scenarios"
  }' | jq .
```

### Expected tool_calls_log

| # | tool | key args |
|---|------|----------|
| 1 | `consultar_pedido` | order_id: "PED-2891" |

### Expected tool result

```json
{
  "orderId": "PED-2891",
  "status": "em separação",
  "history": [
    { "date": "2026-05-08", "event": "Pedido confirmado" },
    { "date": "2026-05-08", "event": "Pedido em separação" }
  ],
  "items": [
    { "productId": "tenis-runner-pro", "name": "Tênis Runner Pro", "quantity": 1, "unitPrice": 349.9, "subtotal": 349.9 }
  ],
  "total": 349.9,
  "estimatedDelivery": "3 a 5 dias úteis"
}
```

### Acceptance checklist

- [ ] `tool_calls_count` is **1**
- [ ] `consultar_pedido` is called with `order_id: "PED-2891"`
- [ ] Response summarizes the status ("em separacao")
- [ ] Response does **not** invent tracking codes, dates, or details beyond what the tool returned

### Must NOT happen

- Agent invents a tracking code
- Agent fabricates delivery dates not present in the tool result
- Any tool other than `consultar_pedido` is called

### Validate with jq

```sh
# Confirm only consultar_pedido was called
... | jq '[.tool_calls_log[].tool]'

# Extract order status from result
... | jq '.tool_calls_log[0].result.status'
```

---

## Quick validation commands

```sh
BASE="http://localhost:3000/api/agent"
SID="test-scenarios"

# Count tool calls for last response
curl -s $BASE -H 'Content-Type: application/json' \
  -d "{\"message\":\"...\",\"session_id\":\"$SID\"}" | jq '.tool_calls_count'

# List tool names in order
... | jq '[.tool_calls_log[].tool]'

# Check a specific tool was NOT called
... | jq '[.tool_calls_log[].tool] | index("fechar_pedido") == null'

# Extract tool args
... | jq '.tool_calls_log[] | {tool, args}'

# Extract tool results
... | jq '.tool_calls_log[] | {tool, result}'
```
