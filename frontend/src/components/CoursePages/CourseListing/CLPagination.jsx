export default function CLPagination({ currentPage, totalPages, onPage }) {
  const pages = Math.min(totalPages, 7);

  const handleChange = (p) => {
    onPage(Math.max(1, Math.min(totalPages, p)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (totalPages <= 1) return null;

  return (
    <div className="cl-pagination">
      <button className="cl-pg-btn" onClick={() => handleChange(currentPage - 1)}>←</button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={`cl-pg-btn${currentPage === p ? " active" : ""}`}
          onClick={() => handleChange(p)}
        >
          {p}
        </button>
      ))}
      {totalPages > 7 && (
        <>
          <span className="cl-pg-dots">…</span>
          <button className="cl-pg-btn" onClick={() => handleChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}
      <button className="cl-pg-btn" onClick={() => handleChange(currentPage + 1)}>→</button>
    </div>
  );
}
