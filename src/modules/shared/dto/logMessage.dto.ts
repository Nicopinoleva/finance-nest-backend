import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LogMessage {
  @Field()
  level: string;

  @Field()
  message: string;

  @Field()
  context: string;

  @Field()
  timestamp: string;
}
