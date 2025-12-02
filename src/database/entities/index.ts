import { BankAccountType } from './banks/bank-account-type.entity';
import { BankAccount } from './banks/bank-account.entity';
import { Banks } from './banks/banks.entity';
import { CreditCardAccount } from './credit-card-statement/credit-card-account.entity';
import { CreditCardStatementReference } from './credit-card-statement/credit-card-statement-reference.entity';
import { CreditCardStatement } from './credit-card-statement/credit-card-statement.entity';
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
  CreditCardStatement,
  CreditCardStatementReference,
  CreditCardAccount,
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
  CreditCardStatement,
  CreditCardStatementReference,
  CreditCardAccount,
};
