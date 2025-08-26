import { Users } from '../users/users.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BankAccountType } from './bank-account-type.entity';
import { Banks } from './banks.entity';

@Entity()
@ObjectType()
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column('varchar')
  @Field(() => String)
  name: string;

  @ManyToOne(() => BankAccountType)
  @Field(() => BankAccountType)
  bankAccountType: BankAccountType;

  @ManyToOne(() => Banks)
  @Field(() => Banks)
  bank: Banks;

  @CreateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', precision: 3 })
  @Field(() => GraphQLDateTime)
  updatedAt: Date;

  @Column({ type: 'uuid' })
  bankAccountTypeId: string;

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
