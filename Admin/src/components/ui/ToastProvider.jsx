import React, { createContext, useContext, useState, useCallback } from 'react';
import SuccessToast from './toast/SuccessToast';
import ErrorToast from './toast/ErrorToast';
import WarningToast from './toast/WarningToast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title, options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      type,
      message,
      title,
      ...options,
      isVisible: true,
      onDismiss: () => removeToast(id)
    };

    setToasts(prev => [...prev, toast]);

    // Auto dismiss after duration
    if (options.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, options.duration || 4000);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(toast =>
      toast.id === id ? { ...toast, isVisible: false } : toast
    ));

    // Remove from state after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 200);
  }, []);

  const success = useCallback((message, options = {}) => {
    return addToast('success', message, 'Success', options);
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast('error', message, 'Error', options);
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast('warning', message, 'Warning', options);
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast('info', message, 'Info', options);
  }, [addToast]);

  const value = {
    success,
    error,
    warning,
    info,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {toasts.map(toast => {
          const ToastComponent = {
            success: SuccessToast,
            error: ErrorToast,
            warning: WarningToast,
            info: SuccessToast // Using success for info, can customize later
          }[toast.type];

          return (
            <ToastComponent
              key={toast.id}
              isVisible={toast.isVisible}
              onDismiss={toast.onDismiss}
              message={toast.message}
              title={toast.title}
              position={toast.position || 'top-right'}
              duration={toast.duration}
              showCloseButton={toast.showCloseButton}
            />
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};