import { BankAccountType } from './banks/bank-account-type.entity';
import { BankAccount } from './banks/bank-account.entity';
import { Banks } from './banks/banks.entity';
import { CreditCardStatementReference } from './credit-card-statement/credit-card-statement-reference.entity';
import { ExpenseType } from './expenses/expense-type.entity';
import { Expense } from './expenses/expense.entity';
import { IncomeType } from './incomes/income-type.entity';
import { Income } from './incomes/income.entity';
import { PaymentMethodTypes } from './payment-methods/payment-method-types.entity';
import { PaymentMethod } from './payment-methods/payment-method.entity';
import { Users } from './users/users.entity';

export const entities = [
  BankAccount,
  BankAccountType,
  Banks,
  Expense,
  ExpenseType,
  Income,
  IncomeType,
  PaymentMethod,
  PaymentMethodTypes,
  Users,
  CreditCardStatementReference,
];

export {
  BankAccount,
  BankAccountType,
  Banks,
  Expense,
  ExpenseType,
  Income,
  IncomeType,
  PaymentMethod,
  PaymentMethodTypes,
  Users,
  CreditCardStatementReference,
};
