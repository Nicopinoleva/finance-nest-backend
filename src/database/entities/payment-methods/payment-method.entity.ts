import { Users } from '../users/users.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethodTypes } from './payment-method-types.entity';
import { BankAccount } from '../banks/bank-account.entity';

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

  @ManyToOne(() => BankAccount)
  @Field(() => BankAccount)
  bankAccount: BankAccount;

  @ManyToOne(() => PaymentMethodTypes)
  @Field(() => PaymentMethodTypes)
  paymentMethodType: PaymentMethodTypes;

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

  @Column({ type: 'uuid' })
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  updatedById: string | null;
}
