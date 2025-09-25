import { Users } from '../users/users.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IncomeType } from './income-type.entity';
import { BankAccount } from '../banks/bank-account.entity';

@Entity()
@ObjectType()
export class Income {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column('varchar')
  @Field(() => String)
  name: string;

  @Column('varchar', { nullable: true })
  @Field(() => String, { nullable: true })
  description: string | null;

  @Column({ type: 'integer' })
  @Field(() => Int)
  amount: number;

  @CreateDateColumn({ type: 'date' })
  @Field(() => GraphQLDate)
  date: Date;

  @ManyToOne(() => BankAccount)
  @Field(() => BankAccount)
  bankAccount: BankAccount;

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
  bankAccountId: string;

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
