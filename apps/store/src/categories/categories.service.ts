import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesRepository } from './categories.repository';
import { GetCategoryDto } from './dto/get-category.dto';
import { Category } from '../libs';
import { CATEGORY_PAGINATION_CONFIG } from './pagination-config';
import { paginate, PaginateQuery } from 'nestjs-paginate';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async create(createCategoryDto: CreateCategoryDto) {
    await this.validateParentId(createCategoryDto.parent_id);

    const category = new Category({
      ...createCategoryDto,
    });

    return this.categoriesRepository.create(category);
  }

  async findAll(query: PaginateQuery) {
    return paginate(
      query,
      this.categoriesRepository.entityRepository,
      CATEGORY_PAGINATION_CONFIG,
    );
  }

  async findTree() {
    const categories = await this.categoriesRepository.entityRepository.find({
      order: {
        id: 'ASC',
      },
    });

    return this.buildTree(categories);
  }

  async findOne(categoryDto: GetCategoryDto) {
    return this.categoriesRepository.findOne(categoryDto);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.validateParentId(updateCategoryDto.parent_id, id);

    return this.categoriesRepository.findOneAndUpdate(
      { id },
      { ...updateCategoryDto },
    );
  }

  async remove(id: number) {
    return this.categoriesRepository.findOneAndDelete({ id });
  }

  private async validateParentId(parentId?: number | null, categoryId?: number) {
    if (parentId === undefined) {
      return;
    }

    if (parentId === null) {
      return;
    }

    if (parentId === categoryId) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    await this.categoriesRepository.findOne({ id: parentId });

    if (!categoryId) {
      return;
    }

    const categories = await this.categoriesRepository.entityRepository.find({
      select: ['id', 'parent_id'],
    });

    const parentById = new Map(
      categories.map((category) => [category.id, category.parent_id]),
    );

    let currentParentId = parentId;

    while (currentParentId) {
      if (currentParentId === categoryId) {
        throw new BadRequestException(
          'Category tree cannot contain circular relationships',
        );
      }

      currentParentId = parentById.get(currentParentId);
    }
  }

  private buildTree(categories: Category[]) {
    const categoryMap = new Map<number, Category>();

    for (const category of categories) {
      categoryMap.set(category.id, {
        ...category,
        children: [],
      });
    }

    const roots: Category[] = [];

    for (const category of categories) {
      const node = categoryMap.get(category.id);

      if (category.parent_id && categoryMap.has(category.parent_id)) {
        categoryMap.get(category.parent_id).children.push(node);
        continue;
      }

      roots.push(node);
    }

    return roots;
  }
}
