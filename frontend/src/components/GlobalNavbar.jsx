import { useState } from "react";
import UnifiedNavbar from "./UnifiedNavbar";

export default function GlobalNavbar() {
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
