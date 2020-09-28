import firebase from 'firebase';
import { Item, Category } from '../types';

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

export const db = app.database();

export function addItem(item: NewRecord<Item>) {
  return db.ref('items').push(item);
}

export function updateItem(item: Item, itemData: Partial<Item>) {
  if (!item.id) {
    throw new Error('item must has id');
  }
  const updates = Object.entries(itemData).reduce(
    (prev, [prop, value]) => ({
      ...prev,
      [`items/${item.id}/${prop}`]: value,
    }),
    {}
  );
  return db.ref().update(updates);
}

export function addCategory(category: NewRecord<Category>) {
  return db.ref('categories').push(category);
}
