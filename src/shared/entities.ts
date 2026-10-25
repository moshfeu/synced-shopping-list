export type DBItem = {
  readonly id: string;
};

export type NewRecord<T> = Omit<T, 'id'>;

export type Urgency = '1' | '2' | '3';

export type AddedBy = {
  displayName: string | null;
  photoURL: string | null;
};

export type Item = DBItem & {
  name: string;
  categoryId?: string | null;
  image?: string | null;
  requiredQuantity?: number;
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
  urgency: Urgency;
  addedBy: AddedBy | null;
  addedAt: number;
};
