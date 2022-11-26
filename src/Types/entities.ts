export type DBItem = {
  readonly id: string;
};

export type List = DBItem & {
  name: string;
};

export type Item = DBItem & {
  name: string;
  categoryId?: string | null;
  image?: string | null;
};

export type Category = DBItem & {
  name: string;
  color?: string;
};

export type ListItem = DBItem & {
  itemId: string;
  quantity: number;
  note: string;
  checked: boolean;
  urgency: '1' | '2' | '3';
  addedBy: Pick<firebase.User, 'displayName' | 'photoURL'> | null;
};

export type ItemView = Omit<Item, 'categoryId'> & {
  category?: Category;
};

export type ListItemView = Omit<ListItem, 'itemId'> & {
  item: ItemView;
};

export type Items = Array<Item>;
export type ListItems = Array<ListItemView>;
export type Categories = Array<Category>;
export type Lists = Array<List>;
