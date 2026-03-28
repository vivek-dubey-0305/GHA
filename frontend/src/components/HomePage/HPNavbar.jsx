import { useState } from "react";
import UnifiedNavbar from "../UnifiedNavbar";

export default function HPNavbar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <UnifiedNavbar
      mode="home"
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      showSearch
    />
  );
}
