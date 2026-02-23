import Decimal from 'decimal.js';

export interface TransactionsCoordinates {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface TransactionCoordinatesWithPadding {
  coordinates: TransactionsCoordinates[];
  text: string;
  startYPadding?: number;
  endYPadding?: number;
  startXPadding?: number;
  endXPadding?: number;
  stopOnFirstMatch?: boolean;
}

export interface CreditCardStatementCoordinates {
  billingPeriodStartEnd?: TransactionCoordinatesWithPadding;
  billingPeriodStart?: TransactionCoordinatesWithPadding;
  billingPeriodEnd?: TransactionCoordinatesWithPadding;
  transactionsTable: TransactionCoordinatesWithPadding;
  transactionsEnd: TransactionCoordinatesWithPadding;
  mainCreditCardText: TransactionCoordinatesWithPadding;
  dueDateCoordinates: TransactionCoordinatesWithPadding;
  dueAmountCoordinates: TransactionCoordinatesWithPadding;
  minimumPaymentCoordinates: TransactionCoordinatesWithPadding;
  previousStatementBilledAmountCoordinates?: TransactionCoordinatesWithPadding;
  previousStatementPaidAmountCoordinates?: TransactionCoordinatesWithPadding;
  previousStatementDebtCoordinates?: TransactionCoordinatesWithPadding;
  unbilledStatementsTableStartCoordinates: TransactionCoordinatesWithPadding;
}

export interface CutRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface Transaction {
  location: string;
  date: string;
  referenceCode: string;
  description: string;
  operationAmount: Decimal;
  totalAmount: Decimal;
  currentInstallment: number;
  totalInstallments: number;
  monthlyAmount: Decimal;
  reference: string;
  creditCard: string;
}

export interface TransactionCategory {
  parsedTotal: Decimal;
  calculatedTotal: Decimal;
  transactions: Transaction[];
  reference?: string;
}

export interface ParsedStatement {
  creditCardStatementId: string;
  mainCreditCard: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  dueAmount: number;
  minimumPayment: number;
  previousStatementDebt: number;
  transactions: Record<string, TransactionCategory>;
  totalOperations: number;
  totalPayments: number;
  totalPAT: number;
  totalTransactions: number;
  totalInstallments: number;
  totalCharges: number;
  totalUnbilledInstallments: number | null;
}

export interface RegionBounds {
  bottom: number;
  top: number;
}

export interface CreditCardsDebt {
  creditCards: {
    creditCard: string;
    billedStatements: {
      total: Decimal;
      billingPeriodStart: string;
      billingPeriodEnd: string;
      transactions: TransactionCategory[];
    } | null;
    unbilledStatements: {
      total: Decimal;
      unbilledPeriodStart: string | null;
      transactions: TransactionCategory[];
    } | null;
  }[];
  totalDebt: Decimal;
  month: string;
}
