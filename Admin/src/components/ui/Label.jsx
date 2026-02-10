import React from 'react';

export function Label({ htmlFor, className = '', children, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium text-gray-300 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export default Label;