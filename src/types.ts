type DBItem = {
  id: string;
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
  itemId?: string;
  quantity: number;
  note: string;
};

export type Items = Array<Item>;
export type Categories = Array<Category>;
