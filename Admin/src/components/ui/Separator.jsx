import React from 'react';

export function Separator({ className = '', ...props }) {
  return (
    <hr
      className={`border-gray-700 ${className}`}
      {...props}
    />
  );
}

export default Separator;