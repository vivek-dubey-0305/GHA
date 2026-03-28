import UnifiedNavbar from "../../UnifiedNavbar";

export default function CLNavbar({ searchQuery, onSearch, onSearchSubmit, resultCount }) {
  return (
    <UnifiedNavbar
      mode="courses"
      searchQuery={searchQuery}
      onSearch={onSearch}
      onSearchSubmit={onSearchSubmit}
      liveSearch={false}
      resultCount={resultCount}
      showSearch={true}
    />
  );
}
