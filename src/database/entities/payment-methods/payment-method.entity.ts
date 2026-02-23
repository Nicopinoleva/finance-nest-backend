import { Users } from '../users/users.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethodTypes } from './payment-method-types.entity';
import { BankAccount } from '../banks/bank-account.entity';
import { CreditCardAccount } from '../credit-card-statement/credit-card-account.entity';

@Entity()
@ObjectType()
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column('varchar')
  @Field(() => String)
  name: string;

  @Column('varchar')
  @Field(() => String, { nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  @Field(() => Boolean)
  isAdditional: boolean;

  @Column({ type: 'integer' })
  @Field(() => Number)
  order: number;

  @Column({ type: 'boolean', default: true })
  @Field(() => Boolean)
  isActive: boolean;

  @ManyToOne(() => BankAccount, { nullable: true })
  @Field(() => BankAccount, { nullable: true })
  bankAccount: BankAccount | null;

  @ManyToOne(() => PaymentMethodTypes)
  @Field(() => PaymentMethodTypes)
  paymentMethodType: PaymentMethodTypes;

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @Field(() => PaymentMethod, { nullable: true })
  parentPaymentMethod: PaymentMethod | null;

  @ManyToOne(() => CreditCardAccount, { nullable: true })
  @Field(() => CreditCardAccount, { nullable: true })
  creditCardAccount: CreditCardAccount | null;

  @CreateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  updatedAt: Date;

  @ManyToOne(() => Users)
  @Field(() => Users)
  createdBy: Users;

  @ManyToOne(() => Users, { nullable: true })
  @Field(() => Users, { nullable: true })
  updatedBy: Users;

  @Column({ type: 'uuid', nullable: true })
  bankAccountId: string | null;

  @Column({ type: 'uuid', nullable: true })
  parentPaymentMethodId: string | null;

  @Column({ type: 'uuid', nullable: true })
  creditCardAccountId: string | null;

  @Column({ type: 'uuid' })
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  updatedById: string | null;
}
