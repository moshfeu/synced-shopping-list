import firebase from 'firebase';
import { ListItem, Item, Category, ListItemView, DBItem } from '../types';

type NewRecord<T> = Omit<T, 'id'>;

const app = firebase.initializeApp({
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
});

const DB_REF = {
  ITEMS: 'items',
  CATEGORIES: 'categories',
  LIST: 'list',
} as const;

export type DBRef = typeof DB_REF[keyof typeof DB_REF];

export const db = app.database();

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

export function updateListItem(
  item: ListItemView,
  itemData: Partial<ListItemView>
) {
  return updateRef(item, itemData, DB_REF.LIST);
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

export function updateItem(item: Item, itemData: Partial<Item>) {
  return updateRef(item, itemData, DB_REF.ITEMS);
}

export function addCategory(category: NewRecord<Category>) {
  return db.ref(DB_REF.CATEGORIES).push(category);
}
