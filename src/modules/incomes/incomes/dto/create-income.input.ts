import { Field, ID, InputType } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { GraphQLDate } from 'graphql-scalars';

@InputType()
export class CreateIncomeInput {
  @Field(() => String, { description: 'Nombre ingreso' })
  @IsNotEmpty()
  name: string;

  @Field(() => String, { description: 'Descripción', nullable: true })
  description: string | null;

  @Field(() => Number, { description: 'Monto' })
  @IsNumber()
  amount: number;

  @Field(() => GraphQLDate, { description: 'Fecha' })
  @IsDate()
  date: Date;

  @Field(() => ID, { description: 'Tipo de ingreso' })
  @IsUUID('4')
  incomeTypeId: string;

  @Field(() => ID, { description: 'Cuenta' })
  @IsUUID('4')
  bankAccountId: string;
}
