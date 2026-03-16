import UnifiedNavbar from "../../UnifiedNavbar";

export default function CLNavbar({ searchQuery, onSearch, resultCount }) {
  return (
    <UnifiedNavbar
      mode="courses"
      searchQuery={searchQuery}
      onSearch={onSearch}
      resultCount={resultCount}
      showSearch={true}
    />
  );
}
