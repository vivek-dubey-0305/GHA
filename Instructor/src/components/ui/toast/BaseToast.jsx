import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const BaseToast = ({
  isVisible,
  onDismiss,
  children,
  position = 'top-center',
  duration = 4000,
  showCloseButton = true,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, duration]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onDismiss();
    }, 200);
  };

  if (!isVisible && !isAnimating) return null;

  const positions = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const baseClasses = `
    fixed z-50 max-w-sm w-full mx-auto
    bg-white border-2 border-gray-800 rounded-lg shadow-2xl
    transform transition-all duration-200 ease-in-out
    ${positions[position]}
  `;

  const animationClasses = isAnimating && isVisible
    ? 'translate-y-0 opacity-100 scale-100'
    : position.includes('top')
    ? '-translate-y-4 opacity-0 scale-95'
    : 'translate-y-4 opacity-0 scale-95';

  const toastClasses = `
    ${baseClasses}
    ${animationClasses}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={toastClasses}>
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          {children}
        </div>
        {showCloseButton && (
          <button
            onClick={handleDismiss}
            className="
              ml-3 p-1 text-gray-400 hover:text-gray-600
              transition-colors duration-150
              rounded-md hover:bg-gray-100
            "
            aria-label="Close notification"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

BaseToast.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf([
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
    'center'
  ]),
  duration: PropTypes.number,
  showCloseButton: PropTypes.bool,
  className: PropTypes.string
};

export default BaseToast;