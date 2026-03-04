import React from 'react';
import PropTypes from 'prop-types';
import BaseModal from './base-modal';

const ErrorModal = ({
  isOpen,
  onClose,
  title = 'Error',
  message,
  confirmText = 'OK',
  onConfirm,
  ...props
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="border-red-500"
      {...props}
    >
      <div className="flex items-start space-x-4">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
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
        <div className="flex-1 pt-1">
          <p className="text-gray-800 text-sm leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="
            px-4 py-2 text-sm font-medium text-gray-700
            bg-gray-100 border border-gray-300 rounded-md
            hover:bg-gray-200 focus:outline-none focus:ring-2
            focus:ring-gray-500 focus:ring-offset-2
            transition-colors duration-150
          "
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="
            px-4 py-2 text-sm font-medium text-white
            bg-red-600 border border-transparent rounded-md
            hover:bg-red-700 focus:outline-none focus:ring-2
            focus:ring-red-500 focus:ring-offset-2
            transition-colors duration-150
          "
        >
          {confirmText}
        </button>
      </div>
    </BaseModal>
  );
};

ErrorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  onConfirm: PropTypes.func
};

export default ErrorModal;