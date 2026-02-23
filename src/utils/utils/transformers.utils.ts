import { ValueTransformer } from 'typeorm';
import Decimal from 'decimal.js';

export const dateTransformer: ValueTransformer = {
  to: (value: Date | null): string | null => {
    return value ? value.toISOString().split('T')[0] : null;
  },
  from: (value: string | null): Date | null => {
    return value ? new Date(value) : null;
  },
};

export const DecimalTransformer: ValueTransformer = {
  to: (value: Decimal | number | null | undefined): string | null =>
    value == null ? null : new Decimal(value).toString(),
  from: (value: string | null): Decimal | null => (value === null ? null : new Decimal(value)),
};
