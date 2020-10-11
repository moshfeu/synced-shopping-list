import { db } from './firebase';
import {
  ListItem,
  Item,
  Category,
  ListItemView,
  DBItem,
  ItemView,
} from '../Types/entities';

type NewRecord<T> = Omit<T, 'id'>;

const DB_REF = {
  ITEMS: 'items',
  CATEGORIES: 'categories',
  LIST: 'list',
} as const;

type DBRef = typeof DB_REF[keyof typeof DB_REF];

function updateRef<T extends DBItem>(
  item: T,
  itemData: Partial<T>,
  ref: DBRef
) {
  if (!item.id) {
    throw new Error('item must has id');
  }
  const updates = Object.entries(itemData).reduce(
    (prev, [prop, value]) => ({
      ...prev,
      [`${ref}/${item.id}/${prop}`]: value,
    }),
    {}
  );
  return db.ref().update(updates);
}

export async function addItem(item: NewRecord<Item>) {
  return db.ref(DB_REF.ITEMS).push(item);
}

export async function addListItem(
  item: Pick<ListItem, 'itemId'> | NewRecord<Item>
) {
  const newListItem: Partial<ListItem> = {
    checked: false,
    note: '',
    quantity: 1,
  };

  if (!('itemId' in item)) {
    const newItem = await addItem(item);
    newListItem.itemId = newItem.key!;
  } else {
    newListItem.itemId = item.itemId;
  }
  return db.ref(DB_REF.LIST).push(newListItem);
}

export function addListItems(items: Array<NewRecord<ListItem>>) {
  const listItemsRef = db.ref(DB_REF.LIST);
  return Promise.all(items.map((item) => listItemsRef.push(item)));
}

export function updateListItem(
  item: ListItemView,
  itemData: Partial<ListItemView>
) {
  return updateRef(item, itemData, DB_REF.LIST);
}

export function deleteItem(itemId: string) {
  return db.ref(`${DB_REF.ITEMS}/${itemId}`).remove();
}

export function deleteListItems(items: Array<ListItemView>) {
  const updates = items.reduce(
    (prev, next) => ({
      ...prev,
      [`${DB_REF.LIST}/${next.id}`]: null,
    }),
    {}
  );

  return db.ref().update(updates);
}

export function updateItem(item: ItemView, itemData: Partial<Item>) {
  return updateRef(item, itemData, DB_REF.ITEMS);
}

export function addCategory(category: NewRecord<Category>) {
  return db.ref(DB_REF.CATEGORIES).push(category);
}

export function deleteCategory(categoryId: string) {
  return db.ref(`${DB_REF.CATEGORIES}/${categoryId}`).remove();
}
