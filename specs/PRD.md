# PRD — ShopMind: Shopping Agent com Function Calling

## 1. Visão geral

O ShopMind é um agente de e-commerce exposto via API que recebe mensagens em linguagem natural, decide quais ferramentas deve chamar, encadeia múltiplas chamadas quando necessário e retorna uma resposta coerente ao usuário.

O projeto será implementado em JavaScript ESM, Node.js >= 18, Express e Genkit SDK.

O foco principal do desafio não é criar uma lógica real de e-commerce, banco de dados ou checkout completo, mas demonstrar a capacidade do agente de orquestrar corretamente tools, tomar decisões com base nos resultados retornados, respeitar guardrails e documentar decisões técnicas.

---

## 2. Objetivos

### 2.1 Objetivo principal

Construir uma API `POST /api/agent` que recebe:

```json
{
  "message": "string",
  "session_id": "string"
}
```

E retorna:

```json
{
  "message": "string",
  "tool_calls_log": []
}
```

A resposta deve conter a mensagem final do agente e um log das ferramentas chamadas durante o fluxo.

---

### 2.2 Objetivos funcionais

O agente deve ser capaz de:

- Buscar produtos no catálogo.
- Mostrar detalhes completos de um produto.
- Verificar o carrinho atual do usuário.
- Adicionar produtos ao carrinho.
- Fechar pedido somente após confirmação explícita.
- Consultar o status de um pedido existente.
- Encadear múltiplas chamadas de tools em uma única interação quando necessário.
- Manter contexto mínimo por `session_id`, especialmente para referências como “primeiro item”, “segundo item” etc.
- Retornar um `tool_calls_log` contendo ferramentas chamadas, argumentos e resultados.
- Respeitar restrições definidas no system prompt e em validações de código.

---

### 2.3 Objetivos não funcionais

- Código organizado e fácil de entender.
- Separação clara entre rota, agente, tools, services e dados mockados.
- Tratamento de erros previsíveis.
- `.env.example` incluído.
- README documentando arquitetura, decisões, assunções e limitações conhecidas.
- Projeto executável localmente com instruções claras.

---

## 3. Fora de escopo

Os seguintes itens não fazem parte do escopo obrigatório:

- Banco de dados real.
- Autenticação.
- Checkout real.
- Integração com gateway de pagamento.
- Frontend obrigatório.
- Estoque real.
- Painel administrativo.
- Testes E2E complexos.
- RAG, embeddings ou vector database.
- Deploy em produção.

Uma interface de chat simples pode ser criada, mas é opcional.

---

## 4. Stack técnica

### 4.1 Obrigatória

- Node.js >= 18
- JavaScript ESM
- Express
- Genkit SDK

### 4.2 Recomendada

- Zod para schemas das tools
- Dotenv para variáveis de ambiente
- Nodemon ou Node watch para desenvolvimento local

---

## 5. Estrutura sugerida

```txt
src/
  server.js

  routes/
    agent.routes.js

  controllers/
    agent.controller.js

  agent/
    shopmind.agent.js
    system-prompt.js

  ai/
    genkit.js
    tools/
      buscar-catalogo.tool.js
      ver-produto.tool.js
      verificar-carrinho.tool.js
      adicionar-ao-carrinho.tool.js
      fechar-pedido.tool.js
      consultar-pedido.tool.js
      index.js

  services/
    catalog.service.js
    cart.service.js
    order.service.js

  stores/
    session.store.js
    cart.store.js

  mocks/
    products.mock.js
    orders.mock.js

  utils/
    confirmation.js
    errors.js
```

---

## 6. Entidades principais

### 6.1 Product

Representa um produto do catálogo.

```js
{
  id: "tenis-001",
  nome: "Tênis Runner Pro",
  categoria: "calçados",
  preco: 349.9,
  estoque: 8,
  descricao_curta: "Tênis leve para corrida diária.",
  especificacoes: {
    material: "Mesh respirável",
    peso: "280g",
    uso: "Corrida"
  },
  avaliacoes: {
    media: 4.7,
    total: 128
  },
  estoque_por_sku: [
    {
      sku: "tenis-001-40",
      tamanho: "40",
      estoque: 3
    }
  ],
  prazo_entrega_estimado: "3 a 5 dias úteis"
}
```

---

### 6.2 Cart

Representa o carrinho vinculado a uma sessão.

```js
{
  session_id: "user-123",
  itens: [
    {
      produto_id: "tenis-001",
      nome: "Tênis Runner Pro",
      quantidade: 1,
      preco_unitario: 349.9,
      subtotal: 349.9
    }
  ],
  total: 349.9
}
```

---

### 6.3 Order

Representa um pedido mockado ou gerado após checkout.

```js
{
  pedido_id: "PED-2891",
  status: "em separação",
  historico: [
    {
      data: "2026-05-08",
      evento: "Pedido confirmado"
    },
    {
      data: "2026-05-08",
      evento: "Pedido em separação"
    }
  ],
  prazo_entrega: "3 a 5 dias úteis"
}
```

---

### 6.4 Session

Representa o estado mínimo de conversa por usuário.

```js
{
  session_id: "user-123",
  messages: [],
  lastCatalogResults: [],
  pendingCheckoutConfirmation: false
}
```

---

## 7. API

## 7.1 Health check

### `GET /health`

Usada apenas para confirmar que a API está rodando.

#### Response

```json
{
  "status": "ok"
}
```

---

## 7.2 Agent endpoint

### `POST /api/agent`

Endpoint principal do desafio.

#### Request body

```json
{
  "message": "Quero comprar um tênis de corrida até R$ 400",
  "session_id": "user-123"
}
```

#### Validações

- `message` é obrigatório.
- `message` deve ser string.
- `session_id` é obrigatório.
- `session_id` deve ser string.

#### Response de sucesso

```json
{
  "message": "Encontrei algumas opções de tênis de corrida até R$ 400...",
  "tool_calls_log": [
    {
      "tool": "buscar_catalogo",
      "args": {
        "query": "tênis de corrida",
        "preco_max": 400
      },
      "result": [
        {
          "id": "tenis-001",
          "nome": "Tênis Runner Pro",
          "preco": 349.9,
          "estoque": 8,
          "descricao_curta": "Tênis leve para corrida diária."
        }
      ]
    }
  ]
}
```

#### Response de erro — payload inválido

```json
{
  "error": "message and session_id are required"
}
```

---

## 8. Tools obrigatórias

O desafio exige seis ferramentas principais.

---

## 8.1 `buscar_catalogo`

### Objetivo

Buscar produtos por termo de pesquisa, categoria opcional e preço máximo opcional.

### Input

```js
{
  query: "string",
  categoria: "string?",
  preco_max: "number?"
}
```

### Output

```js
[
  {
    id: "string",
    nome: "string",
    preco: "number",
    estoque: "number",
    descricao_curta: "string",
  },
];
```

### Regras

- Deve filtrar por `query`.
- Deve filtrar por `categoria` se informada.
- Deve filtrar por `preco_max` se informado.
- Deve retornar lista vazia se nada for encontrado.
- Após uma busca bem-sucedida, os resultados devem ser salvos em `session.lastCatalogResults`.

### Critérios de aceite

- Quando o usuário pedir “tênis de corrida até R$ 400”, o agente deve chamar somente `buscar_catalogo`.
- Não deve chamar `ver_produto`, `verificar_carrinho` ou qualquer outra ferramenta em uma busca simples.
- A resposta final deve apresentar opções com nome e preço.

---

## 8.2 `ver_produto`

### Objetivo

Retornar detalhes completos de um produto específico.

### Input

```js
{
  produto_id: "string";
}
```

### Output

```js
{
  id: "string",
  nome: "string",
  preco: "number",
  especificacoes: {},
  avaliacoes: {},
  estoque_por_sku: [],
  prazo_entrega_estimado: "string"
}
```

### Regras

- Deve retornar detalhes completos do produto.
- Deve retornar erro controlado se o produto não existir.
- Deve incluir estoque por SKU.
- Deve incluir prazo de entrega estimado.

### Critérios de aceite

- Quando o usuário pedir detalhes de um item específico, o agente deve chamar `ver_produto`.
- Quando o usuário disser “segundo item”, o sistema deve resolver a referência com base em `lastCatalogResults`.

---

## 8.3 `verificar_carrinho`

### Objetivo

Retornar os itens atuais do carrinho de uma sessão.

### Input

```js
{
  session_id: "string";
}
```

### Output

```js
{
  itens: [],
  total: "number"
}
```

### Regras

- Deve usar `session_id` para identificar o carrinho.
- Deve retornar lista vazia e total zero se não houver itens.
- Deve retornar subtotais por item e total geral.

### Critérios de aceite

- Quando o usuário pedir para fechar o pedido, o agente deve primeiro chamar `verificar_carrinho`.
- A resposta deve apresentar resumo do carrinho e pedir confirmação explícita antes de fechar.

---

## 8.4 `adicionar_ao_carrinho`

### Objetivo

Adicionar produto ao carrinho da sessão.

### Input

```js
{
  produto_id: "string",
  quantidade: "number",
  session_id: "string"
}
```

### Output

```js
{
  success: true,
  message: "Produto adicionado ao carrinho.",
  item: {
    produto_id: "string",
    nome: "string",
    quantidade: "number"
  }
}
```

### Regras

- Deve verificar se o produto existe.
- Deve verificar disponibilidade em estoque antes de confirmar.
- Não deve adicionar produto sem estoque.
- Não deve aceitar quantidade menor ou igual a zero.
- Deve atualizar o carrinho da sessão.

### Critérios de aceite

- No fluxo encadeado, após `ver_produto`, se houver estoque, o agente deve chamar `adicionar_ao_carrinho`.
- A resposta deve explicar que o item foi adicionado.
- Se não houver estoque, a resposta deve informar que o item não foi adicionado.

---

## 8.5 `fechar_pedido`

### Objetivo

Finalizar a compra a partir do carrinho ativo.

### Input

```js
{
  session_id: "string",
  confirmado: "boolean"
}
```

### Output

```js
{
  success: true,
  pedido_id: "PED-0001",
  prazo_entrega: "3 a 5 dias úteis"
}
```

### Regras

- Deve exigir `confirmado: true`.
- Deve rejeitar fechamento se `confirmado` for `false`.
- Deve rejeitar fechamento se o carrinho estiver vazio.
- Deve gerar número de pedido.
- Deve retornar prazo de entrega.
- Deve limpar ou marcar o carrinho como finalizado.
- Deve ser protegido por guardrail no código, não apenas no prompt.

### Critérios de aceite

- Ao receber “Fecha o pedido pra mim”, o agente não deve chamar `fechar_pedido` imediatamente.
- Primeiro deve chamar `verificar_carrinho`.
- Deve mostrar resumo e pedir confirmação explícita.
- Somente após confirmação explícita do usuário deve chamar `fechar_pedido`.

---

## 8.6 `consultar_pedido`

### Objetivo

Consultar status e histórico de um pedido existente.

### Input

```js
{
  pedido_id: "string";
}
```

### Output

```js
{
  pedido_id: "string",
  status: "confirmado | em separação | enviado | entregue",
  historico: []
}
```

### Regras

- Deve retornar status do pedido.
- Deve retornar histórico.
- Deve retornar erro controlado se o pedido não existir.
- O agente não deve inventar informações ausentes.

### Critérios de aceite

- Ao receber “Cadê meu pedido #PED-2891?”, o agente deve chamar `consultar_pedido`.
- A resposta deve resumir o status de forma amigável.
- A resposta não deve inventar dados além do retorno da tool.

---

## 9. System prompt

O agente deve ter um system prompt declarando persona e restrições.

### Prompt base sugerido

```txt
Você é ShopMind, um assistente de compras de e-commerce.

Seu papel é ajudar o usuário a buscar produtos, ver detalhes, adicionar itens ao carrinho, consultar carrinho, fechar pedidos e consultar status de pedidos.

Regras obrigatórias:
- Use ferramentas sempre que precisar de dados de catálogo, produto, carrinho ou pedido.
- Não invente produtos, preços, estoque, prazos de entrega ou status de pedidos.
- Não chame ferramentas desnecessárias.
- Para busca simples, chame apenas buscar_catalogo.
- Para adicionar produto ao carrinho, verifique disponibilidade antes.
- Nunca finalize um pedido sem confirmação explícita do usuário.
- Se o usuário pedir para fechar o pedido, consulte o carrinho, mostre o resumo e peça confirmação.
- Só chame fechar_pedido quando o usuário confirmar claramente.
- Responda de forma clara, objetiva e amigável.
```

---

## 10. Guardrails

## 10.1 Confirmação explícita de checkout

### Problema

Fechar um pedido é uma ação sensível. O agente não pode executar essa ação apenas porque o usuário disse “fecha o pedido”.

### Regra

O agente deve:

1. Chamar `verificar_carrinho`.
2. Apresentar resumo do carrinho.
3. Pedir confirmação explícita.
4. Marcar `pendingCheckoutConfirmation = true`.
5. Aguardar nova mensagem do usuário.
6. Se a confirmação for clara, chamar `fechar_pedido`.

### Confirmações aceitas

```txt
sim, confirmo
confirmo
pode fechar
pode finalizar
sim, pode finalizar
confirmo a compra
```

### Confirmações não aceitas

```txt
ok
beleza
vai
acho que sim
talvez
```

### Critério de aceite

Mesmo que o modelo tente chamar `fechar_pedido` antes da confirmação, a aplicação deve bloquear a execução.

---

## 10.2 Não inventar dados

O agente não pode inventar:

- Produtos.
- Preços.
- Estoque.
- Prazos de entrega.
- Status de pedido.
- Histórico de pedido.
- Códigos de rastreio.

Sempre que uma informação não estiver no retorno da tool, o agente deve dizer que a informação não está disponível.

---

## 10.3 Limite de tool calls

Para evitar loops infinitos, cada request deve ter um limite máximo de chamadas de tools.

### Regra recomendada

```txt
Máximo de 5 tool calls por request.
```

Se o limite for excedido, retornar resposta amigável pedindo para o usuário reformular ou tentar novamente.

---

## 11. Estado de sessão

O sistema deve manter contexto mínimo por `session_id`.

### Dados armazenados

```js
{
  session_id: "user-123",
  messages: [],
  lastCatalogResults: [],
  pendingCheckoutConfirmation: false
}
```

### Usos

- Resolver referências como “primeiro item”, “segundo item”.
- Manter estado de confirmação de checkout.
- Opcionalmente passar histórico curto ao LLM.

### Regras

- Se a sessão não existir, criar nova sessão.
- Após `buscar_catalogo`, salvar resultados em `lastCatalogResults`.
- Após pedido de fechamento de compra, marcar `pendingCheckoutConfirmation = true`.
- Após fechamento bem-sucedido, limpar `pendingCheckoutConfirmation`.

---

## 12. Tool calls log

A resposta da API deve incluir um campo `tool_calls_log`.

### Formato

```js
[
  {
    tool: "buscar_catalogo",
    args: {
      query: "tênis de corrida",
      preco_max: 400,
    },
    result: [],
  },
];
```

### Regras

- Deve registrar todas as tools chamadas.
- Deve registrar argumentos.
- Deve registrar resultados.
- Deve registrar erros controlados quando ocorrerem.
- Não deve expor chain of thought ou raciocínio interno do modelo.
- Deve ser retornado em todas as respostas de `/api/agent`.

---

## 13. Cenários obrigatórios

## 13.1 Cenário 1 — Busca simples

### Input

```txt
Quero comprar um tênis de corrida até R$ 400
```

### Comportamento esperado

- Chamar `buscar_catalogo`.
- Usar `query = "tênis de corrida"`.
- Usar `preco_max = 400`.
- Apresentar opções com preços.
- Não chamar nenhuma ferramenta desnecessariamente.

### Tool calls esperadas

```txt
buscar_catalogo
```

### Critérios de aceite

```txt
[ ] A resposta apresenta produtos compatíveis.
[ ] O tool_calls_log contém apenas buscar_catalogo.
[ ] O agente não chama ver_produto.
[ ] O agente não chama verificar_carrinho.
[ ] O agente não chama adicionar_ao_carrinho.
```

---

## 13.2 Cenário 2 — Fluxo encadeado

### Pré-condição

O usuário já executou uma busca e `lastCatalogResults` contém pelo menos dois produtos.

### Input

```txt
Me mostra mais detalhes do segundo item e, se estiver disponível, já coloca no meu carrinho
```

### Comportamento esperado

- Resolver “segundo item” com base em `lastCatalogResults`.
- Chamar `ver_produto`.
- Verificar estoque no resultado.
- Se houver estoque, chamar `adicionar_ao_carrinho`.
- Responder explicando detalhes do produto e se ele foi adicionado.

### Tool calls esperadas

```txt
ver_produto → adicionar_ao_carrinho
```

### Critérios de aceite

```txt
[ ] O produto correto é identificado como segundo item.
[ ] O agente chama ver_produto primeiro.
[ ] O agente usa o resultado de ver_produto para decidir se adiciona ao carrinho.
[ ] Se houver estoque, chama adicionar_ao_carrinho.
[ ] O tool_calls_log contém as duas chamadas na ordem correta.
```

---

## 13.3 Cenário 3 — Confirmação antes de fechar

### Input 1

```txt
Fecha o pedido pra mim
```

### Comportamento esperado

- Não chamar `fechar_pedido`.
- Chamar `verificar_carrinho`.
- Apresentar resumo do carrinho.
- Pedir confirmação explícita.

### Tool calls esperadas no input 1

```txt
verificar_carrinho
```

### Input 2

```txt
Sim, confirmo
```

### Comportamento esperado

- Verificar que existe confirmação pendente.
- Reconhecer confirmação explícita.
- Chamar `fechar_pedido`.
- Retornar número do pedido e prazo de entrega.

### Tool calls esperadas no input 2

```txt
fechar_pedido
```

### Critérios de aceite

```txt
[ ] O pedido não é fechado na primeira mensagem.
[ ] O carrinho é verificado antes.
[ ] O resumo é exibido.
[ ] O agente pede confirmação.
[ ] O pedido só é fechado após confirmação explícita.
```

---

## 13.4 Cenário 4 — Consulta de status

### Input

```txt
Cadê meu pedido #PED-2891?
```

### Comportamento esperado

- Extrair `pedido_id = "PED-2891"`.
- Chamar `consultar_pedido`.
- Resumir status de forma amigável.
- Não inventar informações além do retorno da tool.

### Tool calls esperadas

```txt
consultar_pedido
```

### Critérios de aceite

```txt
[ ] O agente chama consultar_pedido.
[ ] O pedido correto é consultado.
[ ] O status é apresentado claramente.
[ ] O histórico é resumido quando disponível.
[ ] Nenhum dado inexistente é inventado.
```

---

## 14. Tratamento de erros

### 14.1 Payload inválido

Quando `message` ou `session_id` estiver ausente:

```json
{
  "error": "message and session_id are required"
}
```

---

### 14.2 Produto não encontrado

```txt
Não encontrei esse produto no catálogo.
```

---

### 14.3 Produto sem estoque

```txt
Esse produto está indisponível no momento, então não adicionei ao carrinho.
```

---

### 14.4 Carrinho vazio

```txt
Seu carrinho está vazio no momento. Quer que eu te ajude a encontrar algum produto?
```

---

### 14.5 Pedido não encontrado

```txt
Não encontrei esse pedido. Confira se o número está correto e tente novamente.
```

---

### 14.6 Limite de tools excedido

```txt
Não consegui concluir essa solicitação com segurança. Pode reformular seu pedido?
```

---

## 15. README

O README deve conter:

```txt
[ ] Nome do projeto
[ ] Descrição do ShopMind
[ ] Stack utilizada
[ ] Como instalar
[ ] Como configurar .env
[ ] Como rodar
[ ] Como testar a API
[ ] Exemplo de request
[ ] Exemplo de response
[ ] Lista das tools disponíveis
[ ] Explicação do loop de function calling
[ ] Explicação do tool_calls_log
[ ] Explicação do estado por session_id
[ ] Explicação do guardrail de checkout
[ ] Decisões técnicas
[ ] Assunções feitas
[ ] Limitações conhecidas
[ ] Cenários oficiais testados
```

---

## 16. Decisões técnicas previstas

### 16.1 Uso de dados em memória

Os dados de produtos, pedidos, carrinhos e sessões serão mantidos em memória, pois o desafio permite mocks e o foco da avaliação é a orquestração das tools.

### 16.2 Separação entre tools e services

As tools serão wrappers de IA. A lógica de e-commerce ficará em services. Isso melhora testabilidade e separação de responsabilidades.

### 16.3 Estado por session_id

O `session_id` será usado para:

- Identificar carrinho.
- Manter últimos resultados de busca.
- Controlar confirmação pendente de checkout.
- Opcionalmente manter histórico curto de conversa.

### 16.4 Guardrail duplicado

O bloqueio de checkout sem confirmação será feito em dois níveis:

- No system prompt.
- No código da aplicação.

Essa decisão reduz o risco de o modelo executar uma ação sensível por erro.

### 16.5 Tool calls log operacional

O `tool_calls_log` registrará apenas ferramentas chamadas, argumentos e resultados. Ele não deve conter raciocínio privado do modelo.

---

## 17. Plano de implementação por commits

### Commit 1 — Estrutura base da API

```txt
chore: setup express server structure
```

Checklist:

```txt
[ ] Confirmar package.json com "type": "module"
[ ] Criar src/server.js
[ ] Configurar express.json()
[ ] Criar GET /health
[ ] Configurar PORT via env
[ ] Criar .gitignore
[ ] Criar .env.example
```

---

### Commit 2 — Contrato do endpoint do agente

```txt
feat: add agent API endpoint contract
```

Checklist:

```txt
[ ] Criar POST /api/agent
[ ] Validar message
[ ] Validar session_id
[ ] Retornar response mockado
[ ] Incluir tool_calls_log vazio
```

---

### Commit 3 — Mocks e stores

```txt
feat: add mock ecommerce data and in-memory stores
```

Checklist:

```txt
[ ] Criar products.mock.js
[ ] Criar orders.mock.js
[ ] Criar cart.store.js
[ ] Criar session.store.js
[ ] Incluir pedido PED-2891
[ ] Incluir produtos com e sem estoque
```

---

### Commit 4 — Services de e-commerce

```txt
feat: implement ecommerce services for agent tools
```

Checklist:

```txt
[ ] Implementar searchCatalog
[ ] Implementar getProductDetails
[ ] Implementar getCart
[ ] Implementar addToCart
[ ] Implementar checkout
[ ] Implementar getOrderStatus
```

---

### Commit 5 — Tools Genkit

```txt
feat: define Genkit tools for shopping agent
```

Checklist:

```txt
[ ] Configurar Genkit
[ ] Criar buscar_catalogo
[ ] Criar ver_produto
[ ] Criar verificar_carrinho
[ ] Criar adicionar_ao_carrinho
[ ] Criar fechar_pedido
[ ] Criar consultar_pedido
[ ] Definir schemas com Zod
```

---

### Commit 6 — System prompt

```txt
feat: add ShopMind system prompt and behavior rules
```

Checklist:

```txt
[ ] Criar system-prompt.js
[ ] Definir persona
[ ] Definir restrições
[ ] Proibir invenção de dados
[ ] Definir regra de checkout
```

---

### Commit 7 — Agent runner

```txt
feat: connect agent endpoint to Genkit execution
```

Checklist:

```txt
[ ] Criar runShopMindAgent
[ ] Conectar rota ao agente
[ ] Passar tools ao modelo
[ ] Retornar message final
[ ] Retornar tool_calls_log
```

---

### Commit 8 — Contexto de sessão

```txt
feat: add session context for catalog references
```

Checklist:

```txt
[ ] Salvar lastCatalogResults
[ ] Resolver primeiro item
[ ] Resolver segundo item
[ ] Resolver terceiro item
[ ] Controlar pendingCheckoutConfirmation
```

---

### Commit 9 — Guardrail de checkout

```txt
feat: add checkout confirmation guardrail
```

Checklist:

```txt
[ ] Criar isExplicitConfirmation
[ ] Bloquear fechar_pedido sem confirmação
[ ] Chamar verificar_carrinho antes de fechar
[ ] Pedir confirmação explícita
[ ] Fechar apenas após confirmação
```

---

### Commit 10 — Multi-step tool calling

```txt
feat: support multi-step tool calling flow
```

Checklist:

```txt
[ ] Permitir múltiplas tool calls por request
[ ] Garantir ver_produto → adicionar_ao_carrinho
[ ] Registrar todas as calls no log
[ ] Limitar número máximo de tool calls
```

---

### Commit 11 — Cenários oficiais

```txt
test: validate required shopping agent scenarios
```

Checklist:

```txt
[ ] Testar cenário 1
[ ] Testar cenário 2
[ ] Testar cenário 3
[ ] Testar cenário 4
[ ] Documentar exemplos no README ou docs/manual-tests.md
```

---

### Commit 12 — Erros e bordas

```txt
fix: handle agent and tool edge cases
```

Checklist:

```txt
[ ] Produto inexistente
[ ] Pedido inexistente
[ ] Carrinho vazio
[ ] Produto sem estoque
[ ] Quantidade inválida
[ ] Payload inválido
[ ] Erro inesperado do modelo
```

---

### Commit 13 — Documentação

```txt
docs: document agent architecture and decisions
```

Checklist:

```txt
[ ] Completar README
[ ] Explicar arquitetura
[ ] Explicar tools
[ ] Explicar guardrails
[ ] Explicar decisões
[ ] Explicar limitações
[ ] Adicionar exemplos de requests
```

---

### Commit 14 — Limpeza final

```txt
chore: final cleanup before submission
```

Checklist:

```txt
[ ] Remover logs desnecessários
[ ] Revisar .env.example
[ ] Garantir que .env não foi commitado
[ ] Garantir que node_modules não foi commitado
[ ] Rodar projeto do zero
[ ] Testar endpoint final
```

---

## 18. Critérios finais de aceite

A entrega será considerada completa quando:

```txt
[ ] O projeto roda localmente.
[ ] GET /health retorna status ok.
[ ] POST /api/agent recebe message e session_id.
[ ] O agente usa Genkit SDK.
[ ] As seis tools obrigatórias existem.
[ ] Busca simples chama apenas buscar_catalogo.
[ ] Fluxo encadeado chama ver_produto e adicionar_ao_carrinho na ordem correta.
[ ] Fechamento de pedido exige confirmação explícita.
[ ] Consulta de pedido chama consultar_pedido.
[ ] A resposta sempre inclui tool_calls_log.
[ ] O agente não inventa dados ausentes.
[ ] O código possui separação clara de responsabilidades.
[ ] Existe .env.example.
[ ] README documenta decisões, assunções e limitações.
```

---

## 19. Riscos e mitigação

### Risco 1 — Modelo chamar tool errada

Mitigação:

- Descrições claras nas tools.
- System prompt objetivo.
- Testes manuais dos cenários oficiais.

### Risco 2 — Modelo fechar pedido sem confirmação

Mitigação:

- Guardrail no prompt.
- Guardrail no código.
- Estado `pendingCheckoutConfirmation`.

### Risco 3 — Referência “segundo item” falhar

Mitigação:

- Salvar `lastCatalogResults` na sessão.
- Resolver referências posicionais via código quando possível.

### Risco 4 — Loop infinito de tools

Mitigação:

- Limitar número máximo de tool calls por request.

### Risco 5 — README fraco

Mitigação:

- Documentar decisões enquanto implementa.
- Adicionar seção de cenários testados.

---

## 20. Métrica de sucesso

O projeto será bem-sucedido se um avaliador conseguir rodar a API, testar os quatro cenários oficiais e observar que:

- As tools corretas são chamadas.
- A ordem das chamadas está correta.
- O agente usa resultado de uma tool para decidir a próxima ação.
- O checkout não acontece sem confirmação.
- O agente não inventa dados.
- O README explica bem as decisões técnicas.
