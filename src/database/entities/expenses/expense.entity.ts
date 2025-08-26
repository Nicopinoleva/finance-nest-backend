import { Users } from '../users/users.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { ExpenseType } from './expense-type.entity';

@Entity()
@ObjectType()
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column('varchar')
  @Field(() => String)
  name: string;

  @ManyToOne(() => PaymentMethod)
  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

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

  @Column({ type: 'uuid' })
  expenseTypeId: string;

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
