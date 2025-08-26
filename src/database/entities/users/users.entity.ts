import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
@ObjectType()
export class Users {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column('varchar', { nullable: true })
  @Field(() => String, { nullable: true })
  firstname: string | null;

  @Column('varchar', { nullable: true })
  @Field(() => String, { nullable: true })
  lastname: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  @Field(() => String, { nullable: true })
  dni: string | null;

  @Column({ type: 'varchar', unique: true })
  @Field(() => String)
  email: string;

  @Column({ type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true })
  phone: string | null;

  @Column('boolean', { nullable: true, default: true })
  @Field(() => Boolean, { nullable: true })
  isActive: boolean | null;

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
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  updatedById: string;
}
