// ============================================================================
// FORM COMPONENTS - Input, Select, Checkbox, etc.
// ============================================================================

'use client';

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Eye, EyeOff, Search, X, Calendar } from 'lucide-react';

// ============================================================================
// INPUT
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, onRightIconClick, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="input-label">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'input-field',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500/10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600 transition-colors"
            >
              {rightIcon}
            </button>
          )}
        </div>
        {(error || hint) && (
          <p className={cn('text-sm mt-1.5', error ? 'text-error-500' : 'text-earth-400')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// PASSWORD INPUT
// ============================================================================

interface PasswordInputProps extends Omit<InputProps, 'type'> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        onRightIconClick={() => setShowPassword(!showPassword)}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

// ============================================================================
// SEARCH INPUT
// ============================================================================

interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        value={value}
        leftIcon={<Search className="w-5 h-5" />}
        rightIcon={value ? <X className="w-4 h-4" /> : undefined}
        onRightIconClick={onClear}
        className={className}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ============================================================================
// SELECT
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="input-label">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'input-field appearance-none pr-10 cursor-pointer',
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500/10',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400 pointer-events-none" />
        </div>
        {(error || hint) && (
          <p className={cn('text-sm mt-1.5', error ? 'text-error-500' : 'text-earth-400')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ============================================================================
// TEXTAREA
// ============================================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="input-label">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'input-field min-h-[120px] resize-y',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500/10',
            className
          )}
          {...props}
        />
        {(error || hint) && (
          <p className={cn('text-sm mt-1.5', error ? 'text-error-500' : 'text-earth-400')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================================================
// CHECKBOX
// ============================================================================

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <label className={cn('flex items-start gap-3 cursor-pointer', className)}>
        <div className="relative mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <div className="w-5 h-5 border-2 border-earth-300 rounded-md bg-white transition-all peer-checked:border-primary-500 peer-checked:bg-primary-500 peer-focus:ring-4 peer-focus:ring-primary-500/20" />
          <svg
            className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {(label || description) && (
          <div>
            {label && <span className="text-sm font-medium text-earth-900">{label}</span>}
            {description && <p className="text-sm text-earth-500">{description}</p>}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// ============================================================================
// RADIO
// ============================================================================

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <label className={cn('flex items-start gap-3 cursor-pointer', className)}>
        <div className="relative mt-0.5">
          <input
            ref={ref}
            type="radio"
            className="peer sr-only"
            {...props}
          />
          <div className="w-5 h-5 border-2 border-earth-300 rounded-full bg-white transition-all peer-checked:border-primary-500 peer-focus:ring-4 peer-focus:ring-primary-500/20" />
          <div className="absolute top-1 left-1 w-3 h-3 rounded-full bg-primary-500 opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
        {(label || description) && (
          <div>
            {label && <span className="text-sm font-medium text-earth-900">{label}</span>}
            {description && <p className="text-sm text-earth-500">{description}</p>}
          </div>
        )}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

// ============================================================================
// SWITCH / TOGGLE
// ============================================================================

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className={cn('flex items-center gap-3 cursor-pointer', className)}>
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <div className="w-11 h-6 bg-earth-200 rounded-full transition-colors peer-checked:bg-primary-500 peer-focus:ring-4 peer-focus:ring-primary-500/20" />
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
        </div>
        {label && <span className="text-sm font-medium text-earth-900">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

// ============================================================================
// DATE INPUT
// ============================================================================

interface DateInputProps extends Omit<InputProps, 'type'> {}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        leftIcon={<Calendar className="w-5 h-5" />}
        className={cn('[&::-webkit-calendar-picker-indicator]:opacity-0', className)}
        {...props}
      />
    );
  }
);

DateInput.displayName = 'DateInput';

// ============================================================================
// FORM GROUP
// ============================================================================

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ children, className }: FormGroupProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}

// ============================================================================
// FORM ROW
// ============================================================================

interface FormRowProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FormRow({ children, columns = 2, className }: FormRowProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
