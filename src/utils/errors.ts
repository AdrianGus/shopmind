export type ServiceErrorCode =
  | "CART_EMPTY"
  | "CHECKOUT_BLOCKED"
  | "CHECKOUT_CONFIRMATION_REQUIRED"
  | "INSUFFICIENT_STOCK"
  | "INVALID_QUANTITY"
  | "INVALID_REFERENCE"
  | "ORDER_NOT_FOUND"
  | "OUT_OF_STOCK"
  | "PRODUCT_NOT_FOUND"
  | "REFERENCE_NOT_FOUND"
  | "SERVICE_ERROR";

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
