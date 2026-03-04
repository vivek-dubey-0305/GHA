import React from 'react';
import { Search } from 'lucide-react';

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  context = "general" // e.g., "users", "instructors", "courses", etc.
}) {
  const handleChange = (e) => {
    console.log(`🔍 SEARCH BAR CHANGE (${context}):`, {
      oldValue: value,
      newValue: e.target.value,
      timestamp: new Date().toLocaleTimeString()
    });
    onChange(e.target.value);
  };

  return (
    <div className={`mb-6 relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        name={`search-${context}`}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-gray-600 transition-colors"
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
      />
    </div>
  );
}

export default SearchBar;