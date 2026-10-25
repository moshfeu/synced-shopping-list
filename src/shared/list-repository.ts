import { isStoredImage } from './images';
import type {
  AddedBy,
  Category,
  Item,
  ListItem,
  NewRecord,
  Urgency,
} from './entities';

/** Database access the repository needs. Paths are relative to the database root. */
export interface DatabaseAdapter {
  get<T>(path: string): Promise<T | null>;
  /** Multi-path update from the root; a `null` value removes the path. */
  update(updates: Record<string, unknown>): Promise<void>;
  /** Pushes a value under `path` and resolves with the generated key. */
  push(path: string, value: unknown): Promise<string>;
  remove(path: string): Promise<void>;
}

export interface StorageAdapter {
  uploadImage(path: string, data: Uint8Array, contentType: string): Promise<void>;
  deleteImage(path: string): Promise<void>;
}

export const DB_REF = {
  ITEMS: 'items',
  CATEGORIES: 'categories',
  LIST: 'list',
} as const;

export type NewListItemInput = {
  name: string;
  quantity?: number;
  note?: string;
  urgency?: Urgency;
  category?: string;
};

export type ListItemChanges = {
  name?: string;
  quantity?: number;
  note?: string;
  urgency?: Urgency;
  checked?: boolean;
  category?: string | null;
};

function toArray<T>(record: Record<string, Omit<T, 'id'>> | null) {
  return Object.entries(record || {}).map(
    ([id, value]) => ({ id, ...value } as T)
  );
}

const sameName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

export function createListRepository(
  db: DatabaseAdapter,
  storage?: StorageAdapter
) {
  const read = async <T>(ref: string) => toArray<T>(await db.get(ref));

  const requireStorage = () => {
    if (!storage) {
      throw new Error('No storage adapter was provided');
    }
    return storage;
  };

  function setFields(ref: string, id: string, data: Record<string, unknown>) {
    if (!id) {
      throw new Error('item must has id');
    }
    return db.update(
      Object.fromEntries(
        Object.entries(data).map(([prop, value]) => [`${ref}/${id}/${prop}`, value])
      )
    );
  }

  async function findCategory(nameOrId: string) {
    const categories = await read<Category>(DB_REF.CATEGORIES);
    return categories.find((c) => c.id === nameOrId || sameName(c.name, nameOrId));
  }

  async function requireListItem(id: string) {
    const value = await db.get<NewRecord<ListItem>>(`${DB_REF.LIST}/${id}`);
    if (!value) {
      throw new Error(`List item ${id} was not found`);
    }
    return { id, ...value } as ListItem;
  }

  const repository = {
    getList: () => read<ListItem>(DB_REF.LIST),
    getItems: () => read<Item>(DB_REF.ITEMS),
    getCategories: () => read<Category>(DB_REF.CATEGORIES),

    // Items
    addItem: (item: NewRecord<Item>) => db.push(DB_REF.ITEMS, item),
    updateItem: (id: string, data: Partial<Item>) =>
      setFields(DB_REF.ITEMS, id, data),
    deleteItem: (id: string) => db.remove(`${DB_REF.ITEMS}/${id}`),

    // List items
    pushListItem: (listItem: NewRecord<ListItem>) =>
      db.push(DB_REF.LIST, listItem),
    updateListItem: (id: string, data: Partial<ListItem>) =>
      setFields(DB_REF.LIST, id, data),

    async addListItem(
      item: Pick<ListItem, 'itemId'> | NewRecord<Item>,
      addedBy: AddedBy | null
    ): Promise<ListItem> {
      const itemId = 'itemId' in item ? item.itemId : await repository.addItem(item);
      const newListItem: NewRecord<ListItem> = {
        checked: false,
        note: '',
        quantity: 1,
        urgency: '1',
        addedBy,
        addedAt: Date.now(),
        itemId,
      };
      return { ...newListItem, id: await repository.pushListItem(newListItem) };
    },

    addListItems: (items: Array<NewRecord<ListItem>>) =>
      Promise.all(items.map((item) => repository.pushListItem(item))),

    deleteListItems: (ids: string[]) =>
      db.update(Object.fromEntries(ids.map((id) => [`${DB_REF.LIST}/${id}`, null]))),

    /** Adds by name, reusing a known item (and its category) when one exists. */
    async addToList(input: NewListItemInput, addedBy: AddedBy) {
      const name = input.name.trim();
      const [list, items] = await Promise.all([
        repository.getList(),
        repository.getItems(),
      ]);
      let item = items.find((i) => sameName(i.name, name));

      if (item && list.some((l) => l.itemId === item!.id)) {
        throw new Error(`"${item.name}" is already on the list; update it instead`);
      }

      const category = input.category ? await findCategory(input.category) : undefined;
      if (input.category && !category) {
        throw new Error(`Category "${input.category}" was not found`);
      }

      if (!item) {
        const newItem: NewRecord<Item> = { name, categoryId: category?.id ?? null };
        item = { id: await repository.addItem(newItem), ...newItem };
      } else if (category && item.categoryId !== category.id) {
        await repository.updateItem(item.id, { categoryId: category.id });
      }

      const listItem: NewRecord<ListItem> = {
        itemId: item.id,
        checked: false,
        note: input.note ?? '',
        quantity: input.quantity ?? 1,
        urgency: input.urgency ?? '1',
        addedBy,
        addedAt: Date.now(),
      };
      const id = await repository.pushListItem(listItem);
      return { id, name: item.name, ...listItem };
    },

    /** Applies list-item fields and, by name, the underlying item's name and category. */
    async applyListItemChanges(id: string, changes: ListItemChanges) {
      const listItem = await requireListItem(id);
      const { name, category, ...listChanges } = changes;
      const updates: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(listChanges)) {
        if (value !== undefined) {
          updates[`${DB_REF.LIST}/${id}/${key}`] = value;
        }
      }
      if (name !== undefined) {
        updates[`${DB_REF.ITEMS}/${listItem.itemId}/name`] = name.trim();
      }
      if (category !== undefined) {
        const found = category === null ? null : await findCategory(category);
        if (category !== null && !found) {
          throw new Error(`Category "${category}" was not found`);
        }
        updates[`${DB_REF.ITEMS}/${listItem.itemId}/categoryId`] = found?.id ?? null;
      }
      if (!Object.keys(updates).length) {
        throw new Error('Nothing to update');
      }
      await db.update(updates);
    },

    async clearChecked() {
      const checked = (await repository.getList()).filter((l) => l.checked);
      await repository.deleteListItems(checked.map((l) => l.id));
      return { removed: checked.length };
    },

    // Categories
    addCategory: (category: NewRecord<Category>) =>
      db.push(DB_REF.CATEGORIES, category),

    updateCategory: (id: string, changes: Partial<NewRecord<Category>>) =>
      setFields(
        DB_REF.CATEGORIES,
        id,
        Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== undefined))
      ),

    deleteCategory: (id: string) => db.remove(`${DB_REF.CATEGORIES}/${id}`),

    // Suggestions: known items that are not currently on the list
    async getSuggestions() {
      const [list, items] = await Promise.all([
        repository.getList(),
        repository.getItems(),
      ]);
      const onList = new Set(list.map((l) => l.itemId));
      return items.filter((i) => !onList.has(i.id));
    },

    async deleteSuggestion(id: string) {
      const list = await repository.getList();
      if (list.some((l) => l.itemId === id)) {
        throw new Error('Item is on the list; remove it from the list first');
      }
      await repository.deleteItem(id);
    },

    // Images
    async setItemImage(itemId: string, path: string) {
      const previous = (await db.get<Item['image']>(`${DB_REF.ITEMS}/${itemId}/image`)) ?? null;
      await repository.updateItem(itemId, { image: path });
      if (previous && previous !== path && isStoredImage(previous)) {
        await requireStorage().deleteImage(previous);
      }
      return { previous };
    },

    async removeItemImage(itemId: string) {
      const previous = await db.get<string>(`${DB_REF.ITEMS}/${itemId}/image`);
      if (!previous) {
        return { removed: false };
      }
      await repository.updateItem(itemId, { image: null });
      if (isStoredImage(previous)) {
        await requireStorage().deleteImage(previous);
      }
      return { removed: true };
    },

    getListItem: requireListItem,
    findCategory,
    uploadImage: (path: string, data: Uint8Array, contentType: string) =>
      requireStorage().uploadImage(path, data, contentType),
  };

  return repository;
}

export type ListRepository = ReturnType<typeof createListRepository>;
