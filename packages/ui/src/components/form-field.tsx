/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import { cn } from '../lib/utils';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Label text for the form field
   */
  label?: string;
  /**
   * ID of the input element this label is for
   */
  htmlFor?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text to display
   */
  helperText?: string;
  /**
   * Mark field as required
   */
  required?: boolean;
  /**
   * Full width form field
   */
  fullWidth?: boolean;
}

/**
 * FormField - Wrapper component for form inputs with label and error handling
 *
 * Use this component to wrap inputs, selects, textareas, etc. for consistent
 * form field styling and error display.
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   htmlFor="email"
 *   error={errors.email?.message}
 *   required
 * >
 *   <input id="email" type="email" {...register('email')} />
 * </FormField>
 * ```
 */
const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      htmlFor,
      error,
      helperText,
      required = false,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const fieldId = htmlFor || React.useId();

    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-2', fullWidth && 'w-full', className)}
        {...props}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={fieldId}
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
            {required && (
              <span className="ml-1 text-error" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input/Children */}
        <div className="relative">
          {children}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={`${fieldId}-helper`}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };
