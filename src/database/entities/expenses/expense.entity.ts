import { Users } from '../users/users.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { ExpenseType } from './expense-type.entity';
import { CreditCardStatementReference } from '../credit-card-statement/credit-card-statement-reference.entity';
import { CreditCardStatement } from '../credit-card-statement/credit-card-statement.entity';

@Entity()
@ObjectType()
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column('varchar')
  @Field(() => String)
  description: string;

  @Column({ type: 'integer' })
  @Field(() => Int)
  operationAmount: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  totalAmount: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  monthlyAmount: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  currentInstallment: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  totalInstallments: number;

  @Column({ type: 'date' })
  @Field(() => GraphQLDate)
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

  @ManyToOne(() => CreditCardStatementReference, { nullable: true })
  @Field(() => CreditCardStatementReference, { nullable: true })
  creditCardStatementReference: CreditCardStatementReference | null;

  @ManyToOne(() => ExpenseType)
  @Field(() => ExpenseType)
  expenseType: ExpenseType;

  @CreateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  updatedAt: Date;

  @Column({ type: 'uuid' })
  paymentMethodId: string;

  @Column({ type: 'uuid', nullable: true })
  creditCardStatementId: string | null;

  @Column({ type: 'uuid', nullable: true })
  parentInstallmentId: string | null;

  @Column({ type: 'uuid' })
  expenseTypeId: string;

  @Column({ type: 'uuid', nullable: true })
  creditCardStatementReferenceId: string | null;

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
