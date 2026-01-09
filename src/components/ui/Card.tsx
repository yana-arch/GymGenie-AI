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
  const baseClasses = 'rounded-2xl border transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275) hover:scale-[1.01] hover:-translateY-2';

  const variantClasses = {
    default: 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:shadow-brand-500/10',
    elevated: 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl hover:shadow-brand-500/20',
    outlined: 'bg-transparent border-gray-200 dark:border-gray-700 shadow-none hover:shadow-sm',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
