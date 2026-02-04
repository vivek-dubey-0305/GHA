import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  children,
  title,
  subtitle,
  size = 'md',
  borders = { top: true, right: true, bottom: true, left: true },
  shadow = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  ...props
}) => {
  const baseClasses = `
    bg-white rounded-lg overflow-hidden
    transition-all duration-200 ease-in-out
    hover:transform hover:scale-[1.02]
  `;

  const shadowClasses = shadow ? 'shadow-lg hover:shadow-xl' : '';

  const sizes = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'w-full',
    auto: ''
  };

  const borderClasses = {
    top: borders.top ? 'border-t-4 border-t-black' : '',
    right: borders.right ? 'border-r-4 border-r-gray-600' : '',
    bottom: borders.bottom ? 'border-b-4 border-b-gray-800' : '',
    left: borders.left ? 'border-l-4 border-l-gray-400' : ''
  };

  const cardClasses = `
    ${baseClasses}
    ${shadowClasses}
    ${sizes[size]}
    ${Object.values(borderClasses).join(' ')}
    border-2 border-gray-200
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const headerClasses = `
    px-6 py-4 border-b border-gray-200
    bg-gradient-to-r from-gray-50 to-white
    ${headerClassName}
  `.replace(/\s+/g, ' ').trim();

  const bodyClasses = `
    px-6 py-4
    ${bodyClassName}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={cardClasses} {...props}>
      {(title || subtitle) && (
        <div className={headerClasses}>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className={bodyClasses}>
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full', 'auto']),
  borders: PropTypes.shape({
    top: PropTypes.bool,
    right: PropTypes.bool,
    bottom: PropTypes.bool,
    left: PropTypes.bool
  }),
  shadow: PropTypes.bool,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string
};

export default Card;