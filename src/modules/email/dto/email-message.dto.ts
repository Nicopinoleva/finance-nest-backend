import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { GraphQLDateTime } from 'graphql-scalars';

@ObjectType()
export class EmailAttachment {
  @Field()
  filename: string;

  @Field()
  contentType: string;

  @Field(() => Int)
  size: number;
}

@ObjectType()
export class EmailMessage {
  @Field(() => ID)
  id: string;

  @Field()
  from: string;

  @Field()
  to: string;

  @Field()
  subject: string;

  @Field(() => GraphQLDateTime)
  date: Date;

  @Field()
  text: string;

  @Field()
  html: string;

  @Field(() => [EmailAttachment])
  attachments: EmailAttachment[];
}
