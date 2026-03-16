/**
 * hooks/useDashboard.js
 * Reusable hooks shared across all dashboard pages.
 */
import { useState, useMemo, useCallback } from "react";

// ─── Tab switcher ────────────────────────────────────────────────────────────
export const useTab = (tabs, defaultIndex = 0) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const activeTab = tabs[activeIndex];
  return { activeTab, activeIndex, setActiveIndex };
};

// ─── Search / Filter ─────────────────────────────────────────────────────────
export const useSearch = (items = [], keys = ["title"]) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) =>
      keys.some((key) => {
        const val = key.split(".").reduce((o, k) => o?.[k], item);
        return String(val ?? "").toLowerCase().includes(q);
      })
    );
  }, [items, query, keys]);

  return { query, setQuery, filtered };
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const usePagination = (items = [], perPage = 10) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / perPage);

  const paginated = useMemo(
    () => items.slice((page - 1) * perPage, page * perPage),
    [items, page, perPage]
  );

  const goTo = useCallback(
    (n) => setPage(Math.max(1, Math.min(n, totalPages))),
    [totalPages]
  );

  return { paginated, page, totalPages, goTo };
};

// ─── Toggle ──────────────────────────────────────────────────────────────────
export const useToggle = (initial = false) => {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const set = useCallback((v) => setValue(v), []);
  return [value, toggle, set];
};
