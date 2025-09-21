import React from 'react';
import { clsx } from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  className
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00d4aa] focus:ring-offset-2 focus:ring-offset-[#1a1b23]',
        {
          'bg-[#00d4aa]': checked,
          'bg-gray-600': !checked,
          'opacity-50 cursor-not-allowed': disabled,
        },
        className
      )}
    >
      <span
        className={clsx(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          {
            'translate-x-6': checked,
            'translate-x-1': !checked,
          }
        )}
      />
    </button>
  );
};