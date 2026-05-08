import type { Product } from "../mocks/products.mock.js";
import { getCurrentIsoTimestamp } from "../utils/date.js";

export type SessionMessageRole = "user" | "assistant";

export type SessionMessage = {
  role: SessionMessageRole;
  content: string;
  createdAt: string;
};

export type CatalogResult = Pick<Product, "id" | "name" | "price" | "stock" | "shortDescription">;

export type Session = {
  sessionId: string;
  messages: SessionMessage[];
  lastCatalogResults: CatalogResult[];
  pendingCheckoutConfirmation: boolean;
  checkoutAllowed: boolean;
};

const sessionsById = new Map<string, Session>();

const createSession = (sessionId: string): Session => ({
  sessionId,
  messages: [],
  lastCatalogResults: [],
  pendingCheckoutConfirmation: false,
  checkoutAllowed: false,
});

export const getSession = (sessionId: string): Session => {
  const session = sessionsById.get(sessionId);

  if (session) {
    return session;
  }

  const newSession = createSession(sessionId);
  sessionsById.set(sessionId, newSession);

  return newSession;
};

export const updateLastCatalogResults = (
  sessionId: string,
  results: CatalogResult[],
): Session => {
  const session = getSession(sessionId);
  session.lastCatalogResults = results;

  return session;
};

export const setPendingCheckoutConfirmation = (
  sessionId: string,
  value: boolean,
): Session => {
  const session = getSession(sessionId);
  session.pendingCheckoutConfirmation = value;

  return session;
};

export const setCheckoutAllowed = (
  sessionId: string,
  value: boolean,
): Session => {
  const session = getSession(sessionId);
  session.checkoutAllowed = value;

  return session;
};

export const addSessionMessage = (
  sessionId: string,
  message: Omit<SessionMessage, "createdAt">,
): Session => {
  const session = getSession(sessionId);
  session.messages.push({
    ...message,
    createdAt: getCurrentIsoTimestamp(),
  });

  return session;
};
