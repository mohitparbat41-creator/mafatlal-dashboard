'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';

/** Group an unsigned integer string with Indian commas: "2500000" → "25,00,000". */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/**
 * Strip display formatting down to the raw numeric string stored in the form / DB.
 * Rupee amounts are non-negative, so the sign is dropped. Leading zeros are removed
 * ("007" → "7") while a single leading zero before a decimal is kept ("0.5").
 */
export function sanitizeAmount(display: string): string {
  let raw = display.replace(/[^\d.]/g, '');
  const dot = raw.indexOf('.');
  if (dot !== -1) {
    // keep the first decimal point and at most 2 decimal digits
    raw =
      raw.slice(0, dot + 1) +
      raw
        .slice(dot + 1)
        .replace(/\./g, '')
        .slice(0, 2);
  }
  const [intPart = '', decPart] = raw.split('.');
  const normInt = intPart.replace(/^0+(?=\d)/, '');
  return decPart !== undefined ? `${normInt}.${decPart}` : normInt;
}

/** Format a raw numeric string with Indian commas — display only, value stays numeric. */
export function formatAmount(raw: string): string {
  if (!raw) return '';
  const [int = '', dec] = raw.split('.');
  return groupIndian(int) + (dec !== undefined ? `.${dec}` : '');
}

interface IndianNumberInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type'
> {
  /** Raw numeric string (what react-hook-form stores and Supabase receives). */
  value: string;
  onValueChange: (raw: string) => void;
}

/**
 * Rupee amount input with live Indian-comma grouping (2000000 → 20,00,000).
 * Formatting is purely visual: the bound form value stays a plain numeric
 * string. The caret is re-anchored after each keystroke by counting the
 * numeric characters to its left, so typing/deleting feels natural.
 */
export function IndianNumberInput({ value, onValueChange, ...props }: IndianNumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const typed = el.value;
    const cursor = el.selectionStart ?? typed.length;
    const numericBeforeCursor = typed.slice(0, cursor).replace(/[^\d.]/g, '').length;

    const raw = sanitizeAmount(typed);
    const formatted = formatAmount(raw);

    // Place the caret after the same count of numeric characters in the new text.
    let pos = 0;
    let seen = 0;
    while (pos < formatted.length && seen < numericBeforeCursor) {
      if (/[\d.]/.test(formatted[pos])) seen++;
      pos++;
    }

    // Write the DOM imperatively so rejected characters disappear even when the
    // raw value (and thus the controlled prop) did not change.
    el.value = formatted;
    el.setSelectionRange(pos, pos);
    onValueChange(raw);
  };

  return (
    <Input
      type='text'
      inputMode='decimal'
      autoComplete='off'
      value={formatAmount(value ?? '')}
      onChange={handleChange}
      {...props}
    />
  );
}
