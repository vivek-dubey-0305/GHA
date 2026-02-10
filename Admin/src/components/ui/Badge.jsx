import React from 'react';

export function Badge({ variant = 'default', className = '', children, ...props }) {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-green-700 text-green-300',
    warning: 'bg-yellow-700 text-yellow-300',
    error: 'bg-red-700 text-red-300',
  };

  return (
    <span
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;