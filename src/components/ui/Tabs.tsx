import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  fullWidth?: boolean;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  className = '',
}) => {
  const getTabClasses = (tab: Tab) => {
    const isActive = tab.id === activeTab;
    const isDisabled = tab.disabled;
    
    const baseClasses = 'inline-flex items-center px-4 py-2 text-sm font-medium focus:outline-none transition-colors';
    const disabledClasses = 'opacity-50 cursor-not-allowed';
    
    const variantClasses = {
      default: {
        base: 'rounded-md',
        active: 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white',
        inactive: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
      },
      pills: {
        base: 'rounded-full',
        active: 'bg-blue-600 text-white',
        inactive: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
      },
      underline: {
        base: 'border-b-2 border-transparent',
        active: 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500',
        inactive: 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600',
      },
    };
    
    return [
      baseClasses,
      variantClasses[variant].base,
      isActive ? variantClasses[variant].active : variantClasses[variant].inactive,
      isDisabled ? disabledClasses : '',
    ].join(' ');
  };

  return (
    <div className={`${className}`}>
      <div className={`flex ${variant === 'underline' ? 'border-b border-gray-200 dark:border-gray-700' : ''} ${fullWidth ? 'w-full' : ''}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${getTabClasses(tab)} ${fullWidth ? 'flex-1 justify-center' : ''}`}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
