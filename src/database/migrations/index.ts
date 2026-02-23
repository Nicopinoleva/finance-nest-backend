import { InitDatabase1756317501748 } from './1756317501748-init-database';
import { IncomeAddAmountDateNullableDescription1756352787448 } from './1756352787448-income-add-amount-date-nullable-description';
import { AddCreditCardCardStatementReference1760369181233 } from './1760369181233-add-creditCardCardStatementReference';
import { AddExpenseAttributes1760369481135 } from './1760369481135-add-expense-attributes';
import { AddCreditCardCardStatementExpenseForeignKeys1761155773312 } from './1761155773312-add-creditCardCardStatement-expense-foreign-keys';
import { AddExpenseCurrentInstallmentTotalInstallments1761927962393 } from './1761927962393-add-expense-currentInstallment-totalInstallments';
import { AddPaymentMethodParentId1764101097068 } from './1764101097068-add-payment-method-parentId';
import { AddCreditCardAccount1764173511609 } from './1764173511609-add-credit-card-account';
import { AddPaymentMethodIsAdditionalOrderIsActive1764185787720 } from './1764185787720-add-paymentMethod-isAdditional-order-isActive';
import { AddExpenseInstallmentsFulfilled1764197350556 } from './1764197350556-add-expense-installmentsFulfilled';
import { AddCategoryDeleteExpenseIncomeType1764875272978 } from './1764875272978-add-category-delete-expense-income-type';
import { ExpenseCategoryNullable1768192901560 } from './1768192901560-expense-category-nullable';
import { ExpenseDateTime1768222063620 } from './1768222063620-expense-date-time';
import { ExpenseCurrency1768223803625 } from './1768223803625-expense-currency';
import { ExpenseCurrencyDropDefault1768224045017 } from './1768224045017-expense-currency-drop-default';
import { ExpenseAmountsFloats1768225128101 } from './1768225128101-expense-amounts-floats';
import { AddBankParseConfig1768850710605 } from './1768850710605-add-bank-parse-config';
import { ExpenseAddLocation1768966461366 } from './1768966461366-expense-add-location';
import { AddCurrency1771802813989 } from './1771802813989-add-currency';

export const migrations = [
  InitDatabase1756317501748,
  IncomeAddAmountDateNullableDescription1756352787448,
  AddCreditCardCardStatementReference1760369181233,
  AddExpenseAttributes1760369481135,
  AddCreditCardCardStatementExpenseForeignKeys1761155773312,
  AddExpenseCurrentInstallmentTotalInstallments1761927962393,
  AddPaymentMethodParentId1764101097068,
  AddCreditCardAccount1764173511609,
  AddPaymentMethodIsAdditionalOrderIsActive1764185787720,
  AddExpenseInstallmentsFulfilled1764197350556,
  AddCategoryDeleteExpenseIncomeType1764875272978,
  ExpenseCategoryNullable1768192901560,
  ExpenseDateTime1768222063620,
  ExpenseCurrency1768223803625,
  ExpenseCurrencyDropDefault1768224045017,
  ExpenseAmountsFloats1768225128101,
  AddBankParseConfig1768850710605,
  ExpenseAddLocation1768966461366,
  AddCurrency1771802813989,
];
