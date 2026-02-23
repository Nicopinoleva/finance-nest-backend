import { Users } from '../users/users.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Banks } from './banks.entity';
import { PaymentMethodTypes } from '../payment-methods/payment-method-types.entity';
import { CreditCardStatementCoordinates } from '@modules/credit-card-statement/credit-card-statement.interface';

@Entity()
@ObjectType()
export class BankParseConfiguration {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @ManyToOne(() => PaymentMethodTypes)
  @Field(() => PaymentMethodTypes)
  paymentMethodType: PaymentMethodTypes;

  @ManyToOne(() => Banks)
  @Field(() => Banks)
  bank: Banks;

  @Column({ type: 'jsonb' })
  @Field(() => GraphQLJSON)
  configuration: CreditCardStatementCoordinates;

  @CreateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  updatedAt: Date;

  @Column({ type: 'uuid' })
  paymentMethodTypeId: string;

  @Column({ type: 'uuid' })
  bankId: string;

  @ManyToOne(() => Users)
  @Field(() => Users)
  createdBy: Users;

  @ManyToOne(() => Users, { nullable: true })
  @Field(() => Users, { nullable: true })
  updatedBy: Users;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  updatedById: string;
}
