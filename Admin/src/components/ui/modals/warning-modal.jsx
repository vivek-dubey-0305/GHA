import React from 'react';
import PropTypes from 'prop-types';
import BaseModal from './base-modal';

const WarningModal = ({
  isOpen,
  onClose,
  title = 'Warning',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  ...props
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="border-yellow-500"
      {...props}
    >
      <div className="flex items-start space-x-4">
        {/* Warning Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-yellow-600"
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
        <div className="flex-1 pt-1">
          <p className="text-gray-800 text-sm leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={handleCancel}
          className="
            px-4 py-2 text-sm font-medium text-gray-700
            bg-gray-100 border border-gray-300 rounded-md
            hover:bg-gray-200 focus:outline-none focus:ring-2
            focus:ring-gray-500 focus:ring-offset-2
            transition-colors duration-150
          "
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className="
            px-4 py-2 text-sm font-medium text-white
            bg-yellow-600 border border-transparent rounded-md
            hover:bg-yellow-700 focus:outline-none focus:ring-2
            focus:ring-yellow-500 focus:ring-offset-2
            transition-colors duration-150
          "
        >
          {confirmText}
        </button>
      </div>
    </BaseModal>
  );
};

WarningModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func
};

export default WarningModal;