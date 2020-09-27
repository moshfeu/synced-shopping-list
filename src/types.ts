type DBRefList<T> = {
  [key: string]: T;
}

export type Item = {
  name: string;
}

export type Category = {
  name: string;
  color: string;
}

export type Items = DBRefList<Item>;
export type Categories = DBRefList<Category>;