import { PaginateConfig } from 'nestjs-paginate';
import { Category } from '../../libs';

export const CATEGORY_PAGINATION_CONFIG: PaginateConfig<Category> = {
  sortableColumns: ['id', 'name', 'description', 'image', 'parent_id'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['name', 'description'],
  filterableColumns: {
    id: true,
    name: true,
    description: true,
    parent_id: true,
  },
  maxLimit: 100,
  defaultLimit: 10,
};
