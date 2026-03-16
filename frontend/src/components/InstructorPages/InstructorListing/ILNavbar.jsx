import UnifiedNavbar from "../../UnifiedNavbar";

export default function ILNavbar({ searchQuery, onSearch, resultCount }) {
  return (
    <UnifiedNavbar
      mode="instructors"
      searchQuery={searchQuery}
      onSearch={onSearch}
      resultCount={resultCount}
      showSearch={true}
    />
  );
}
