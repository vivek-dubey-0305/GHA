export default function InstructorEmptyState({
  title = "No Data Available",
  description = "We could not find anything to show right now.",
  compact = false,
  actionLabel,
  onAction,
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(245, 197, 24, 0.25)",
        background: "linear-gradient(180deg, rgba(15,15,15,0.92), rgba(10,10,10,0.88))",
        borderRadius: "16px",
        padding: compact ? "18px" : "28px",
        textAlign: "center",
        color: "#f4f3ee",
        width: "100%",
      }}
    >
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "1px", fontSize: compact ? "1.2rem" : "1.8rem" }}>
        {title}
      </div>
      <p style={{ margin: "8px 0 0", opacity: 0.82, fontSize: compact ? "0.9rem" : "1rem" }}>{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: "14px",
            border: "1px solid #f5c518",
            background: "transparent",
            color: "#f5c518",
            padding: "8px 14px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
