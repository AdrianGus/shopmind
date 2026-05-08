export type ServiceErrorCode =
  | "CART_EMPTY"
  | "CHECKOUT_BLOCKED"
  | "CHECKOUT_CONFIRMATION_REQUIRED"
  | "INSUFFICIENT_STOCK"
  | "INVALID_QUANTITY"
  | "ORDER_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "SERVICE_ERROR"
  | "OUT_OF_STOCK";

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: ServiceErrorCode = "SERVICE_ERROR",
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export const isServiceError = (error: unknown): error is ServiceError =>
  error instanceof ServiceError;
