import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-2xl border transition-shadow';

  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md',
    elevated: 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl',
    outlined: 'bg-transparent border-gray-200 dark:border-gray-600 shadow-none hover:shadow-sm',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
