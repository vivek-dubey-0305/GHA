import UnifiedNavbar from "../../UnifiedNavbar";

export default function ILNavbar({ searchQuery, onSearch, onSearchSubmit, resultCount }) {
  return (
    <UnifiedNavbar
      mode="instructors"
      searchQuery={searchQuery}
      onSearch={onSearch}
      onSearchSubmit={onSearchSubmit}
      liveSearch={false}
      resultCount={resultCount}
      showSearch={true}
    />
  );
}
