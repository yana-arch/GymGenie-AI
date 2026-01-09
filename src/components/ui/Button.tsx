import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variantClasses = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg hover:shadow-brand-500/20',
    secondary: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md hover:shadow-brand-500/10',
    icon: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full border-0 shadow-sm hover:shadow-md hover:shadow-brand-500/10',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg hover:shadow-red-500/20',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg min-h-[44px] min-w-[44px]', // At least 44px for accessibility
    md: 'px-4 py-3 text-base rounded-xl min-h-[44px] min-w-[44px]', // At least 44px
    lg: 'px-6 py-4 text-lg rounded-xl min-h-[56px] min-w-[56px]',
    xl: 'px-8 py-5 text-xl rounded-2xl min-h-[68px] min-w-[68px]',
  };

  const iconSizeClasses = {
    sm: 'w-11 h-11', // At least 44px
    md: 'w-11 h-11', // At least 44px
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  };

  const classes = variant === 'icon'
    ? `${baseClasses} ${variantClasses[variant]} ${iconSizeClasses[size]} ${className}`
    : `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 14 : size === 'md' ? 16 : size === 'lg' ? 18 : 20} className="animate-spin mr-2" />}
      {children}
    </button>
  );
};

export default Button;
