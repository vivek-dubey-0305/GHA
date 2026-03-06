import React from 'react';

/**
 * SectionTitle - Reusable component for section headers
 */
export function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-1">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
    </div>
  );
}
