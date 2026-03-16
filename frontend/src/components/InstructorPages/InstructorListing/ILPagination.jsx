export default function ILPagination({ currentPage, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = Math.min(totalPages, 5);

  const go = (p) => {
    onPage(Math.max(1, Math.min(totalPages, p)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="il-pagination">
      <button className="il-pg-btn" onClick={() => go(currentPage - 1)}>←</button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={`il-pg-btn${currentPage === p ? " active" : ""}`}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}
      {totalPages > 5 && (
        <>
          <span className="il-pg-dots">…</span>
          <button className="il-pg-btn" onClick={() => go(totalPages)}>{totalPages}</button>
        </>
      )}
      <button className="il-pg-btn" onClick={() => go(currentPage + 1)}>→</button>
    </div>
  );
}
