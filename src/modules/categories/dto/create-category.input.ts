import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID, IsOptional } from 'class-validator';

@InputType()
export class CreateCategoryInput {
  @Field(() => String, { description: 'Nombre categoría' })
  name: string;

  @Field(() => String, { description: 'Descripción categoría', nullable: true })
  description: string | null;

  @Field(() => ID, { description: 'ID categoría padre', nullable: true })
  @IsUUID('4')
  @IsOptional()
  parentCategoryId?: string | null;
}
