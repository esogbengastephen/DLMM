import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'bg-[#00d4aa] text-white hover:bg-[#00b899] focus:ring-[#00d4aa]': variant === 'primary',
          'bg-[#2a2b33] text-white hover:bg-[#3a3b43] focus:ring-gray-500': variant === 'secondary',
          'border border-[#00d4aa] text-[#00d4aa] hover:bg-[#00d4aa] hover:text-white focus:ring-[#00d4aa]': variant === 'outline',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};