export interface TransactionsCoordinates {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
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
  operationAmount: number;
  totalAmount: number;
  installment: string;
  monthlyInstallment: number;
  reference: string;
}

export interface TransactionCategory {
  parsedTotal: number;
  calculatedTotal: number;
  transactions: Transaction[];
}

export interface ParsedStatement {
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
