export const getCurrentIsoTimestamp = (): string => new Date().toISOString();

export const getCurrentDateString = (): string => getCurrentIsoTimestamp().slice(0, 10);
