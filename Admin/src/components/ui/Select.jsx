import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDropdown } from './dropdown-context';

export function Select({ children, value, onValueChange, id, ...props }) {
  // Try to use the context, but fall back to local state if not available
  let context;
  try {
    context = useDropdown();
  } catch (error) {
    context = null;
  }

  const [localIsOpen, setLocalIsOpen] = useState(false);

  const isOpen = context ? context.openDropdownId === id : localIsOpen;
  const setIsOpen = context ? 
    (() => {
      if (isOpen) {
        context.closeDropdown();
      } else {
        context.openDropdown(id);
      }
    }) : 
    setLocalIsOpen;

  // Close dropdown when clicking outside (only for context-managed dropdowns)
  useEffect(() => {
    if (!context) return;

    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(`[data-dropdown-id="${id}"]`)) {
        context.closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, id, context]);

  return (
    <div className="relative" data-dropdown-id={id} {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { isOpen, setIsOpen, value, onValueChange })
      )}
    </div>
  );
}

export function SelectTrigger({ children, className = '', isOpen, setIsOpen, ...props }) {
  // Remove internal props that shouldn't be passed to button
  const { value, onValueChange, ...buttonProps } = props;

  return (
    <button
      type="button"
      onClick={setIsOpen}
      className={`flex items-center justify-between w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...buttonProps}
    >
      {children}
      <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
}

export function SelectValue({ placeholder, value, children }) {
  return <span className="text-white">{value || children || placeholder}</span>;
}

export function SelectContent({ children, isOpen, setIsOpen, onValueChange, maxHeight = '200px' }) {
  if (!isOpen) return null;

  const childrenArray = React.Children.toArray(children);
  const shouldScroll = childrenArray.length > 5;

  return (
    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
      <div
        className={`py-1 ${shouldScroll ? 'max-h-48 overflow-y-auto' : ''}`}
        style={shouldScroll ? { maxHeight } : {}}
      >
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