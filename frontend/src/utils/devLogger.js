const isDev = String(import.meta.env.VITE_DEV || '').toLowerCase() === 'true';

export const devLog = (...args) => {
  if (isDev) console.log("[frontend]", ...args);
};

export const devWarn = (...args) => {
  if (isDev) console.warn("[frontend]", ...args);
};

export const devError = (...args) => {
  if (isDev) console.error("[frontend]", ...args);
};
