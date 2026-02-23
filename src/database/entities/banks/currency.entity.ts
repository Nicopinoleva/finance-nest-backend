import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@ObjectType()
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'int' })
  @Field(() => Number)
  numericCode: number;

  @Column({ type: 'char', length: 3, unique: true })
  @Field(() => String)
  alphabeticCode: string;

  @Column({ type: 'varchar', length: 100 })
  @Field(() => String)
  name: string;

  @Column({ type: 'int', nullable: true })
  @Field(() => Number, { nullable: true })
  minorUnit: number | null;
}
