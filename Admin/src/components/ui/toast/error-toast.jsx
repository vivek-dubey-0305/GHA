import React from 'react';
import PropTypes from 'prop-types';
import BaseToast from './base-toast';

const ErrorToast = ({
  isVisible,
  onDismiss,
  title = 'Error',
  message,
  ...props
}) => {
  return (
    <BaseToast
      isVisible={isVisible}
      onDismiss={onDismiss}
      className="border-red-500"
      {...props}
    >
      <div className="flex items-start space-x-3">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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

ErrorToast.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired
};

export default ErrorToast;