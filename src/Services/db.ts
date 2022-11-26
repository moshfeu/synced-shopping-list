import { omit } from 'lodash';
import { db } from './firebase';
import { ListItem, Item, Category, ListItemView, DBItem, ItemView } from '../Types/entities';

type NewRecord<T> = Omit<T, 'id'>;

export const DB_REF = {
  ITEMS: 'items',
  CATEGORIES: 'categories',
  LIST: 'list',
} as const;

type DBRef = typeof DB_REF[keyof typeof DB_REF];

function getAddedByFromUser(user?: ListItem['addedBy']) {
  if (!user) {
    return null;
  }
  return {
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

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
  item: Pick<ListItem, 'itemId'> | NewRecord<Item>,
  user?: ListItem['addedBy']
) {
  const newListItem: Partial<ListItem> = {
    checked: false,
    note: '',
    quantity: 1,
    addedBy: getAddedByFromUser(user),
  };

  if (!('itemId' in item)) {
    const newItem = await addItem(item);
    newListItem.itemId = newItem.key!;
  } else {
    newListItem.itemId = item.itemId;
  }
  return db.ref(DB_REF.LIST).push(newListItem);
}

export const addListItemFull = async (item: ListItemView) => {
  const itemToAdd: NewRecord<Item> = omit(item.item, ['id', 'category']);
  if (item.item.category) {
    itemToAdd.categoryId = item.item.category.id;
  }
  const { key: itemId } = await addItem(itemToAdd);
  if (!itemId) {
    throw new Error('added item must have id');
  }
  const listItem: NewRecord<ListItem> = {
    ...omit(item, ['id', 'item', 'category']) as ListItem,
    itemId,
  };

  const { key: addedListItemId } = await db.ref(DB_REF.LIST).push({
    ...listItem,
    itemId,
  });
  return { itemId, addedListItemId };
};

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

export async function deleteListItems(items: Array<ListItemView>) {
  const updates = items.reduce(
    (prev, next) => ({
      ...prev,
      [`${DB_REF.LIST}/${next.id}`]: null,
    }),
    {}
  );
  console.log('deleteListItems', updates);
  await db.ref().update(updates);
}

export function updateItem(item: ItemView, itemData: Partial<Item>) {
  return updateRef(item, itemData, DB_REF.ITEMS);
}

export function addCategory(category: NewRecord<Category>) {
  return db.ref(DB_REF.CATEGORIES).push(category);
}

export function updateCategory(id: string, name: string) {
  return db.ref(`${DB_REF.CATEGORIES}/${id}`).update({
    name,
  });
}

export function deleteCategory(categoryId: string) {
  return db.ref(`${DB_REF.CATEGORIES}/${categoryId}`).remove();
}
