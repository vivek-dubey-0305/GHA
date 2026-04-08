const isDev = String(import.meta.env.VITE_DEV || '').toLowerCase() === 'true';

export const devLog = (...args) => {
  if (isDev) console.log("[instructor]", ...args);
};

export const devWarn = (...args) => {
  if (isDev) console.warn("[instructor]", ...args);
};

export const devError = (...args) => {
  if (isDev) console.error("[instructor]", ...args);
};
