import type { Category, DBItem, Item, ListItem } from '../shared/entities';

export type { Category, DBItem, Item, ListItem };

export type ItemView = Omit<Item, 'categoryId'> & {
  category?: Category;
};

export type ListItemView = Omit<ListItem, 'itemId'> & {
  item: ItemView;
};

export type Items = Array<Item>;
export type ListItems = Array<ListItemView>;
export type Categories = Array<Category>;
