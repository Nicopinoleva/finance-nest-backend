import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CategoryService } from './category.service';
import { Category } from '@entities';
import { CreateCategoryInput } from './dto/create-category.input';

@Resolver()
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Mutation(() => Category)
  createCategory(@Args('input') createCategoryInput: CreateCategoryInput) {
    return this.categoryService.createCategory(createCategoryInput);
  }
}
