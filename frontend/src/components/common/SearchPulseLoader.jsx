import "./search-pulse-loader.css";

export default function SearchPulseLoader({
  label = "Searching",
  sublabel = "Finding the best results for you",
  compact = false,
  className = "",
}) {
  return (
    <div className={`gha-search-loader ${compact ? "compact" : ""} ${className}`.trim()} role="status" aria-live="polite" aria-busy="true">
      <div className="gha-search-loader__stage" aria-hidden="true">
        <div className="gha-search-loader__halo" />
        <div className="gha-search-loader__ring gha-search-loader__ring--one" />
        <div className="gha-search-loader__ring gha-search-loader__ring--two" />
        <div className="gha-search-loader__core" />
        <span className="gha-search-loader__spark gha-search-loader__spark--a" />
        <span className="gha-search-loader__spark gha-search-loader__spark--b" />
        <span className="gha-search-loader__spark gha-search-loader__spark--c" />
      </div>

      <div className="gha-search-loader__content">
        <p className="gha-search-loader__label">{label}</p>
        {!compact && <p className="gha-search-loader__sublabel">{sublabel}</p>}
      </div>
    </div>
  );
}
