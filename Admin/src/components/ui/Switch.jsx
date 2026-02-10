import React from 'react';

export function Switch({ checked, onCheckedChange, className = '', ...props }) {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="sr-only"
        {...props}
      />
      <div className={`w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-colors`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
    </label>
  );
}

export default Switch;