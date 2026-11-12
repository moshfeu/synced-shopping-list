import { omit } from 'lodash';
import { db } from './firebase';
import { createListRepository, DB_REF } from '../shared/list-repository';
import type { DatabaseAdapter } from '../shared/list-repository';
import { ListItem, Item, Category, ListItemView, DBItem, ItemView } from '../Types/entities';

type NewRecord<T> = Omit<T, 'id'>;

export { DB_REF };

const clientAdapter: DatabaseAdapter = {
  async get<T>(path: string) {
    return (await db.ref(path).get()).val() as T | null;
  },
  async update(updates) {
    await db.ref().update(updates);
  },
  async push(path, value) {
    return (await db.ref(path).push(value)).key!;
  },
  async remove(path) {
    await db.ref(path).remove();
  },
};

const repository = createListRepository(clientAdapter);

function getAddedByFromUser(user?: ListItem['addedBy']) {
  if (!user) {
    return null;
  }
  return {
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

function requireId(item: DBItem) {
  if (!item.id) {
    throw new Error('item must has id');
  }
  return item.id;
}

export async function addItem(item: NewRecord<Item>) {
  return repository.addItem(item);
}

export function addListItem(
  item: Pick<ListItem, 'itemId'> | NewRecord<Item>,
  user?: ListItem['addedBy']
): Promise<ListItem> {
  return repository.addListItem(item, getAddedByFromUser(user));
}

export const addListItemFull = async (item: ListItemView) => {
  const itemToAdd: NewRecord<Item> = omit(item.item, ['id', 'category']);
  if (item.item.category) {
    itemToAdd.categoryId = item.item.category.id;
  }
  const itemId = await repository.addItem(itemToAdd);
  const listItem: NewRecord<ListItem> = {
    ...omit(item, ['id', 'item', 'category']) as ListItem,
    itemId,
  };
  const addedListItemId = await repository.pushListItem(listItem);
  return { itemId, addedListItemId };
};

export function addListItems(items: Array<NewRecord<ListItem>>) {
  return repository.addListItems(items);
}

export function updateListItem(
  item: ListItemView | ListItem,
  itemData: Partial<ListItemView>
) {
  return repository.updateListItem(requireId(item), itemData);
}

export function deleteItem(itemId: string) {
  return repository.deleteItem(itemId);
}

export function deleteListItems(items: Array<ListItemView>) {
  return repository.deleteListItems(items.map(({ id }) => id));
}

export function updateItem(item: ItemView, itemData: Partial<Item>) {
  return repository.updateItem(requireId(item), itemData);
}

export function addCategory(category: NewRecord<Category>) {
  return repository.addCategory(category);
}

export function updateCategory(id: string, name: string) {
  return repository.updateCategory(id, { name });
}

export function deleteCategory(categoryId: string) {
  return repository.deleteCategory(categoryId);
}
