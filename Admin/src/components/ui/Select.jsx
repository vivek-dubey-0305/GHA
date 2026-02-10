import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function Select({ children, value, onValueChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { isOpen, setIsOpen, value, onValueChange })
      )}
    </div>
  );
}

export function SelectTrigger({ children, className = '', isOpen, setIsOpen, ...props }) {
  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={`flex items-center justify-between w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className="w-4 h-4 ml-2" />
    </button>
  );
}

export function SelectValue({ placeholder }) {
  return <span className="text-gray-400">{placeholder}</span>;
}

export function SelectContent({ children, isOpen, setIsOpen, onValueChange }) {
  if (!isOpen) return null;

  return (
    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
      <div className="py-1">
        {React.Children.map(children, (child) =>
          React.cloneElement(child, { onValueChange, setIsOpen })
        )}
      </div>
    </div>
  );
}

export function SelectItem({ children, value, onValueChange, setIsOpen }) {
  return (
    <button
      type="button"
      onClick={() => {
        onValueChange(value);
        setIsOpen(false);
      }}
      className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700"
    >
      {children}
    </button>
  );
}