import { Categories, ItemView, ListItemView } from './entities';

export type DBContext = {
  list: Array<ListItemView>;
  items: Array<ItemView>;
  categories: Categories;
};

export type DBState = {
  [key in keyof DBContext]: DBContext[key];
};
