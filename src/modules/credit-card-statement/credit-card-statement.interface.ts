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
  cardNumber?: string;
}

export interface CardTransactions {
  cardNumber: string;
  transactions: Transaction[];
  cardTotal: number;
}

export interface ParsedStatement {
  transactionsByCard: CardTransactions[];
  allTransactions: Transaction[];
  totalOperations: number;
  totalPayments: number;
  totalPAT: number;
  totalInstallments: number;
  totalCharges: number;
}

export interface RegionBounds {
  bottom: number;
  top: number;
}
