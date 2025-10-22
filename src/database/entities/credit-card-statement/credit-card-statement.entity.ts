import { Users } from '../users/users.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { Expense } from '../expenses/expense.entity';

@Entity()
@ObjectType()
export class CreditCardStatement {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'date' })
  @Field(() => GraphQLDate)
  billingPeriodStart: Date;

  @Column({ type: 'date' })
  @Field(() => GraphQLDate)
  billingPeriodEnd: Date;

  @Column({ type: 'date' })
  @Field(() => GraphQLDate)
  dueDate: Date;

  @Column({ type: 'integer' })
  @Field(() => Int)
  dueAmount: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  minimumPayment: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  previousStatementDebt: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  totalOperations: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  totalPayments: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  totalPAT: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  totalTransactions: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  totalInstallments: number;

  @Column({ type: 'integer' })
  @Field(() => Int)
  totalCharges: number;

  // This is nullable because its the only one that might not be present in some statements
  @Column({ type: 'integer', nullable: true })
  @Field(() => Int, { nullable: true })
  totalUnbilledInstallments: number | null;

  @ManyToOne(() => PaymentMethod)
  @Field(() => PaymentMethod)
  creditCard: PaymentMethod;

  @OneToMany(() => Expense, (expense) => expense.creditCardStatement)
  @Field(() => [Expense])
  expenses: Expense[];

  @CreateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  updatedAt: Date;

  @Column({ type: 'uuid' })
  creditCardId: string;

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
