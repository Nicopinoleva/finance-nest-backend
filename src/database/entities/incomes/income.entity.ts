import { Users } from '../users/users.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IncomeType } from './income-type.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';

@Entity()
@ObjectType()
export class Income {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column('varchar')
  @Field(() => String)
  name: string;

  @ManyToOne(() => PaymentMethod)
  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @ManyToOne(() => IncomeType)
  @Field(() => IncomeType)
  incomeType: IncomeType;

  @CreateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  updatedAt: Date;

  @Column({ type: 'uuid' })
  paymentMethodId: string;

  @Column({ type: 'uuid' })
  incomeTypeId: string;

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
