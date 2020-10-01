type DBItem = {
  readonly id: string;
};

export type Item = DBItem & {
  name: string;
  category?: string | null;
};

export type Category = DBItem & {
  name: string;
  color: string;
};

export type ListItem = DBItem & {
  itemId: string;
  quantity: number;
  note: string;
  checked: boolean;
};

export type ListItemView = Omit<ListItem, 'itemId'> & {
  item: Item;
};

export type Items = Array<Item>;
export type ListItems = Array<ListItemView>;
export type Categories = Array<Category>;
