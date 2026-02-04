import React from 'react';
import PropTypes from 'prop-types';
import BaseToast from './BaseToast';

const WarningToast = ({
  isVisible,
  onDismiss,
  title = 'Warning',
  message,
  ...props
}) => {
  return (
    <BaseToast
      isVisible={isVisible}
      onDismiss={onDismiss}
      className="border-yellow-500"
      {...props}
    >
      <div className="flex items-start space-x-3">
        {/* Warning Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            {title}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </BaseToast>
  );
};

WarningToast.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired
};

export default WarningToast;