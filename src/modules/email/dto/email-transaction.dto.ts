import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class EmailTransactionDto {
  @Field()
  date: string;

  @Field()
  paymentMethodNumber: string;

  @Field()
  currency: string;

  @Field()
  amount: string;

  @Field()
  location: string;

  @Field()
  description: string;
}
