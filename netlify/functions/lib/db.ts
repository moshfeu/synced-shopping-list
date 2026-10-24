import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { config } from './config';

export type Urgency = '1' | '2' | '3';

type Category = { id: string; name: string; color?: string };
type Item = {
  id: string;
  name: string;
  categoryId?: string | null;
  image?: string | null;
  requiredQuantity?: number;
};
type ListItem = {
  id: string;
  itemId: string;
  quantity: number;
  note: string;
  checked: boolean;
  urgency: Urgency;
  addedBy: { displayName: string | null; photoURL: string | null } | null;
  addedAt: number;
};

export type User = { email: string; name?: string };

/**
 * Admin SDK apps bypass security rules unless `databaseAuthVariableOverride` is set.
 * Impersonating the signed-in user makes the existing rules
 * (`auth.token.email == ...`) apply to the MCP exactly as they do to the web app.
 */
function getUserDb(user: User) {
  const name = `user:${user.email}`;
  const app: App =
    getApps().find((a) => a.name === name) ||
    initializeApp(
      {
        credential: cert(config.serviceAccount),
        databaseURL: config.databaseURL,
        databaseAuthVariableOverride: {
          uid: user.email,
          token: { email: user.email, email_verified: true },
        },
      },
      name
    );
  return getDatabase(app);
}

function toArray<T>(record: Record<string, Omit<T, 'id'>> | null | undefined) {
  return Object.entries(record || {}).map(
    ([id, value]) => ({ id, ...value } as T)
  );
}

export function createRepository(user: User) {
  const db = getUserDb(user);

  async function read<T>(path: string) {
    return toArray<T>((await db.ref(path).get()).val());
  }

  async function findCategory(nameOrId: string) {
    const categories = await read<Category>('categories');
    const lower = nameOrId.trim().toLowerCase();
    return categories.find(
      (c) => c.id === nameOrId || c.name.trim().toLowerCase() === lower
    );
  }

  async function getListItem(id: string) {
    const snapshot = await db.ref(`list/${id}`).get();
    if (!snapshot.exists()) {
      throw new Error(`List item ${id} was not found`);
    }
    return { id, ...snapshot.val() } as ListItem;
  }

  return {
    async getList(filter?: { checked?: boolean }) {
      const [list, items, categories] = await Promise.all([
        read<ListItem>('list'),
        read<Item>('items'),
        read<Category>('categories'),
      ]);
      return list
        .filter((l) => filter?.checked === undefined || l.checked === filter.checked)
        .map((l) => {
          const item = items.find((i) => i.id === l.itemId);
          const category = categories.find((c) => c.id === item?.categoryId);
          return {
            id: l.id,
            name: item?.name ?? '(unknown item)',
            category: category?.name ?? null,
            quantity: l.quantity,
            note: l.note,
            checked: l.checked,
            urgency: l.urgency,
            addedBy: l.addedBy?.displayName ?? null,
            addedAt: l.addedAt,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    async addToList(input: {
      name: string;
      quantity?: number;
      note?: string;
      urgency?: Urgency;
      category?: string;
    }) {
      const name = input.name.trim();
      const [list, items] = await Promise.all([
        read<ListItem>('list'),
        read<Item>('items'),
      ]);
      let item = items.find((i) => i.name.trim().toLowerCase() === name.toLowerCase());

      if (item && list.some((l) => l.itemId === item!.id)) {
        throw new Error(`"${item.name}" is already on the list; update it instead`);
      }

      const category = input.category ? await findCategory(input.category) : undefined;
      if (input.category && !category) {
        throw new Error(`Category "${input.category}" was not found`);
      }

      if (!item) {
        const newItem: Omit<Item, 'id'> = { name, categoryId: category?.id ?? null };
        const ref = await db.ref('items').push(newItem);
        item = { id: ref.key!, ...newItem };
      } else if (category && item.categoryId !== category.id) {
        await db.ref(`items/${item.id}`).update({ categoryId: category.id });
      }

      const listItem: Omit<ListItem, 'id'> = {
        itemId: item.id,
        checked: false,
        note: input.note ?? '',
        quantity: input.quantity ?? 1,
        urgency: input.urgency ?? '1',
        addedBy: { displayName: user.name ?? user.email, photoURL: null },
        addedAt: Date.now(),
      };
      const ref = await db.ref('list').push(listItem);
      return { id: ref.key!, name: item.name, ...listItem };
    },

    async updateListItem(
      id: string,
      changes: {
        name?: string;
        quantity?: number;
        note?: string;
        urgency?: Urgency;
        checked?: boolean;
        category?: string | null;
      }
    ) {
      const listItem = await getListItem(id);
      const { name, category, ...listChanges } = changes;
      const updates: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(listChanges)) {
        if (value !== undefined) {
          updates[`list/${id}/${key}`] = value;
        }
      }
      if (name !== undefined) {
        updates[`items/${listItem.itemId}/name`] = name.trim();
      }
      if (category !== undefined) {
        const found = category === null ? null : await findCategory(category);
        if (category !== null && !found) {
          throw new Error(`Category "${category}" was not found`);
        }
        updates[`items/${listItem.itemId}/categoryId`] = found?.id ?? null;
      }
      if (!Object.keys(updates).length) {
        throw new Error('Nothing to update');
      }
      await db.ref().update(updates);
      return (await this.getList()).find((l) => l.id === id);
    },

    async removeFromList(ids: string[]) {
      const updates = Object.fromEntries(ids.map((id) => [`list/${id}`, null]));
      await db.ref().update(updates);
      return { removed: ids.length };
    },

    async clearChecked() {
      const checked = await this.getList({ checked: true });
      return this.removeFromList(checked.map((l) => l.id));
    },

    async getCategories() {
      return read<Category>('categories');
    },

    async addCategory(name: string, color?: string) {
      const category: Omit<Category, 'id'> = color ? { name, color } : { name };
      const ref = await db.ref('categories').push(category);
      return { id: ref.key!, ...category };
    },

    async updateCategory(id: string, changes: { name?: string; color?: string }) {
      const snapshot = await db.ref(`categories/${id}`).get();
      if (!snapshot.exists()) {
        throw new Error(`Category ${id} was not found`);
      }
      await db.ref(`categories/${id}`).update(
        Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== undefined))
      );
      return { id, ...(await db.ref(`categories/${id}`).get()).val() };
    },

    async deleteCategory(id: string) {
      await db.ref(`categories/${id}`).remove();
      return { deleted: id };
    },

    /** Known items that are not currently on the list (the app's suggestions). */
    async getCatalog() {
      const [list, items] = await Promise.all([read<ListItem>('list'), read<Item>('items')]);
      const onList = new Set(list.map((l) => l.itemId));
      return items
        .filter((i) => !onList.has(i.id))
        .map(({ id, name, categoryId }) => ({ id, name, categoryId: categoryId ?? null }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    async deleteCatalogItem(id: string) {
      const list = await read<ListItem>('list');
      if (list.some((l) => l.itemId === id)) {
        throw new Error('Item is on the list; remove it from the list first');
      }
      await db.ref(`items/${id}`).remove();
      return { deleted: id };
    },
  };
}

export type Repository = ReturnType<typeof createRepository>;
