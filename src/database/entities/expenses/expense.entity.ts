import { Users } from '../users/users.entity';
import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { Category } from '../categories/category.entity';
import { CreditCardStatementReference } from '../credit-card-statement/credit-card-statement-reference.entity';
import { CreditCardStatement } from '../credit-card-statement/credit-card-statement.entity';
import { Currency } from '../banks/currency.entity';
import { Decimal } from 'decimal.js';
import { DecimalTransformer } from '@utils/utils/transformers.utils';

@Entity()
@ObjectType()
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column('varchar')
  @Field(() => String)
  description: string;

  @Column('varchar', { nullable: true })
  @Field(() => String, { nullable: true })
  location: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 4, transformer: DecimalTransformer })
  @Field(() => Float)
  operationAmount: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, transformer: DecimalTransformer })
  @Field(() => Float)
  totalAmount: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, transformer: DecimalTransformer })
  @Field(() => Float)
  monthlyAmount: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true, transformer: DecimalTransformer })
  @Field(() => Float, { nullable: true })
  sourceCurrencyAmount: Decimal | null;

  @Column({ type: 'integer' })
  @Field(() => Int)
  currentInstallment: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  totalInstallments: number;

  @Column({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  date: Date;

  @Column('varchar', { nullable: true })
  @Field(() => String, { nullable: true })
  referenceCode: string | null;

  @Column({ type: 'boolean', default: true })
  @Field(() => Boolean)
  installmentsFulfilled: boolean;

  @ManyToOne(() => PaymentMethod)
  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @ManyToOne(() => CreditCardStatement, { nullable: true })
  @Field(() => CreditCardStatement, { nullable: true })
  creditCardStatement: CreditCardStatement | null;

  @ManyToOne(() => Expense, { nullable: true })
  @Field(() => Expense, { nullable: true })
  parentInstallment: Expense | null;

  @ManyToOne(() => CreditCardStatementReference)
  @Field(() => CreditCardStatementReference)
  creditCardStatementReference: CreditCardStatementReference;

  @ManyToOne(() => Currency)
  @Field(() => Currency)
  currency: Currency;

  @ManyToOne(() => Category, { nullable: true })
  @Field(() => Category, { nullable: true })
  category: Category | null;

  @CreateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  updatedAt: Date;

  @Column({ type: 'uuid' })
  paymentMethodId: string;

  @Column({ type: 'uuid' })
  currencyId: string;

  @Column({ type: 'uuid', nullable: true })
  creditCardStatementId: string | null;

  @Column({ type: 'uuid', nullable: true })
  parentInstallmentId: string | null;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ type: 'uuid' })
  creditCardStatementReferenceId: string;

  @ManyToOne(() => Users)
  @Field(() => Users)
  createdBy: Users;

  @ManyToOne(() => Users, { nullable: true })
  @Field(() => Users, { nullable: true })
  updatedBy: Users;

  @Column({ type: 'uuid' })
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  updatedById: string;
}
