import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import Decimal from 'decimal.js';

@ObjectType()
export class TransactionCategoryDto {
  @Field()
  reference?: string;

  @Field(() => Float)
  calculatedTotal: Decimal;

  @Field(() => Float)
  parsedTotal: Decimal;

  @Field(() => [TransactionDto])
  transactions: TransactionDto[];
}

@ObjectType()
export class TransactionDto {
  @Field()
  date: string;

  @Field()
  referenceCode: string;

  @Field()
  description: string;

  @Field(() => Float)
  operationAmount: Decimal;

  @Field(() => Float)
  totalAmount: Decimal;

  @Field(() => Int)
  currentInstallment: number;

  @Field(() => Int)
  totalInstallments: number;

  @Field(() => Float)
  monthlyAmount: Decimal;

  @Field()
  reference: string;

  @Field()
  creditCard: string;

  @Field()
  location: string;
}

@ObjectType()
export class BilledStatementsDto {
  @Field(() => Float)
  total: Decimal;

  @Field()
  billingPeriodStart: string;

  @Field()
  billingPeriodEnd: string;

  @Field(() => [TransactionCategoryDto])
  transactions: TransactionCategoryDto[];
}

@ObjectType()
export class UnbilledStatementsDto {
  @Field(() => Float)
  total: Decimal;

  @Field(() => String, { nullable: true })
  unbilledPeriodStart: string | null;

  @Field(() => [TransactionCategoryDto])
  transactions: TransactionCategoryDto[];
}

@ObjectType()
export class CreditCardDebtDto {
  @Field()
  creditCard: string;

  @Field(() => BilledStatementsDto, { nullable: true })
  billedStatements: BilledStatementsDto | null;

  @Field(() => UnbilledStatementsDto, { nullable: true })
  unbilledStatements: UnbilledStatementsDto | null;
}

@ObjectType()
export class CreditCardsDebtDto {
  @Field(() => [CreditCardDebtDto])
  creditCards: CreditCardDebtDto[];

  @Field(() => Float)
  totalDebt: Decimal;

  @Field()
  month: string;
}
