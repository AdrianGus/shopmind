import { ServiceError, type ServiceErrorCode } from "./errors.js";

export const MESSAGES = {
  PRODUCT_NOT_FOUND: "Não encontrei esse produto no catálogo.",
  INVALID_QUANTITY: "Informe uma quantidade válida para adicionar ao carrinho.",
  OUT_OF_STOCK: "Esse produto está sem estoque, então não adicionei ao carrinho.",
  INSUFFICIENT_STOCK:
    "Não há estoque suficiente para essa quantidade, então não adicionei ao carrinho.",
  CART_EMPTY: "Seu carrinho está vazio. Quer que eu te ajude a encontrar algum produto?",
  CHECKOUT_BLOCKED:
    "Para fechar o pedido, confirme explicitamente depois de revisar o carrinho.",
  CHECKOUT_CONFIRMATION_REQUIRED:
    "Confirme o fechamento do pedido antes de concluir a compra.",
  ORDER_NOT_FOUND: "Não encontrei o pedido informado. Confira se o código está correto.",
  TOOL_CALL_LIMIT:
    "Não consegui concluir essa solicitação com segurança. Pode reformular seu pedido?",
  TOOL_FAILURE: "Não consegui executar uma operação necessária agora. Pode tentar novamente?",
  MODEL_FAILURE: "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?",
  EMPTY_RESPONSE:
    "Desculpe, não consegui completar todas as etapas. Pode reformular seu pedido?",
} as const;

type ServiceMessageCode = Extract<ServiceErrorCode, keyof typeof MESSAGES>;

export const serviceError = (code: ServiceMessageCode, statusCode: number): ServiceError =>
  new ServiceError(MESSAGES[code], statusCode, code);
