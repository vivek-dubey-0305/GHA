import React from 'react';
import PropTypes from 'prop-types';

const Form = ({
  children,
  title,
  subtitle,
  onSubmit,
  loading = false,
  className = '',
  titleClassName = '',
  contentClassName = '',
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading && onSubmit) {
      onSubmit(e);
    }
  };

  const formClasses = `
    w-full max-w-md mx-auto
    bg-white rounded-lg shadow-lg
    border-4 border-gray-200
    overflow-hidden
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const headerClasses = `
    px-8 py-6 bg-gradient-to-r from-gray-900 to-black
    border-b-4 border-gray-300
  `;

  const titleClasses = `
    text-2xl font-bold text-white text-center
    ${titleClassName}
  `.replace(/\s+/g, ' ').trim();

  const subtitleClasses = `
    text-gray-300 text-center mt-2
  `;

  const contentClasses = `
    px-8 py-6 space-y-4
    ${contentClassName}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className={formClasses}
        {...props}
      >
        {title && (
          <div className={headerClasses}>
            <h2 className={titleClasses}>
              {title}
            </h2>
            {subtitle && (
              <p className={subtitleClasses}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className={contentClasses}>
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
              <div className="flex items-center space-x-2">
                <svg
                  className="animate-spin h-6 w-6 text-gray-900"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-gray-900 font-medium">Loading...</span>
              </div>
            </div>
          )}
          {children}
        </div>
      </form>
    </div>
  );
};

Form.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  onSubmit: PropTypes.func,
  loading: PropTypes.bool,
  className: PropTypes.string,
  titleClassName: PropTypes.string,
  contentClassName: PropTypes.string
};

export default Form;