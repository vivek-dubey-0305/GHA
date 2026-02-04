import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const Input = ({
  title,
  placeholder = '',
  type = 'text',
  value = '',
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  required = false,
  error = '',
  border2d = true,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));
  const inputRef = useRef(null);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setHasValue(Boolean(newValue));
    if (onChange) onChange(e);
  };

  const shouldFloatLabel = isFocused || hasValue || value;

  const baseClasses = `
    w-full px-4 py-3 bg-gray-50 text-gray-900
    border-2 rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-0
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder-transparent
  `;

  const borderClasses = border2d
    ? `
      border-black shadow-lg
      focus:border-gray-700 focus:shadow-xl
      hover:shadow-lg
    `
    : `
      border-gray-300
      focus:border-blue-500
    `;

  const errorClasses = error
    ? 'border-red-500 focus:border-red-500 bg-red-50'
    : '';

  const inputClasses = `
    ${baseClasses}
    ${borderClasses}
    ${errorClasses}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const labelClasses = `
    absolute left-4 transition-all duration-200 ease-in-out
    pointer-events-none font-medium
    ${shouldFloatLabel
      ? 'top-0 text-xs bg-gray-50 px-1 text-gray-700 z-10 -translate-y-2'
      : 'top-3 text-base text-gray-500'
    }
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className="relative mb-4">
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
          {...props}
        />
        {title && (
          <label
            className={labelClasses}
            onClick={() => inputRef.current?.focus()}
          >
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

Input.propTypes = {
  title: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  border2d: PropTypes.bool,
  className: PropTypes.string
};

export default Input;