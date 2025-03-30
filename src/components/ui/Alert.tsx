import React, { useState } from 'react';
import { X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const variantClasses = {
    info: 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    success: 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    error: 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const iconContainerClasses = {
    info: 'text-blue-400 dark:text-blue-300',
    success: 'text-green-400 dark:text-green-300',
    warning: 'text-yellow-400 dark:text-yellow-300',
    error: 'text-red-400 dark:text-red-300',
  };

  return (
    <div className={`rounded-md p-4 ${variantClasses[variant]} ${className}`}>
      <div className="flex">
        {icon && (
          <div className={`flex-shrink-0 ${iconContainerClasses[variant]}`}>
            {icon}
          </div>
        )}
        <div className={`${icon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          <div className={`${title ? 'mt-2' : ''} text-sm`}>
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`
                  inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${variant === 'info' ? 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600 dark:hover:bg-blue-900/50' : ''}
                  ${variant === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600 dark:hover:bg-green-900/50' : ''}
                  ${variant === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 dark:hover:bg-yellow-900/50' : ''}
                  ${variant === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600 dark:hover:bg-red-900/50' : ''}
                `}
                onClick={handleClose}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
