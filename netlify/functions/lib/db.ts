import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import { MAX_UPLOAD_BYTES } from './image';
import type { ImageData } from './image';
import { config } from './config';
import { IMAGE_EXTENSIONS, buildItemImagePath } from '../../../src/shared/images';
import { createListRepository } from '../../../src/shared/list-repository';
import type {
  DatabaseAdapter,
  StorageAdapter,
} from '../../../src/shared/list-repository';

export type { Urgency } from '../../../src/shared/entities';

export type User = { email: string; name?: string };

/**
 * Admin SDK apps bypass security rules unless `databaseAuthVariableOverride` is set.
 * Impersonating the signed-in user makes the existing rules
 * (`auth.token.email == ...`) apply to the MCP exactly as they do to the web app.
 */
function getUserApp(user: User): App {
  const name = `user:${user.email}`;
  return (
    getApps().find((a) => a.name === name) ||
    initializeApp(
      {
        credential: cert(config.serviceAccount),
        databaseURL: config.databaseURL,
        storageBucket: config.storageBucket,
        databaseAuthVariableOverride: {
          uid: user.email,
          token: { email: user.email, email_verified: true },
        },
      },
      name
    )
  );
}

function createAdminDatabaseAdapter(app: App): DatabaseAdapter {
  const db = getDatabase(app);
  return {
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
}

function createAdminStorageAdapter(app: App): StorageAdapter {
  const file = (path: string) => getStorage(app).bucket().file(path);
  return {
    async uploadImage(path, data, contentType) {
      await file(path).save(Buffer.from(data), { contentType, resumable: false });
    },
    async deleteImage(path) {
      await file(path).delete({ ignoreNotFound: true });
    },
  };
}

const mcpImagePath = (itemId: string, extension: string) =>
  buildItemImagePath(itemId, `mcp-${Date.now()}.${extension}`);

export function createRepository(user: User) {
  const app = getUserApp(user);
  const repo = createListRepository(
    createAdminDatabaseAdapter(app),
    createAdminStorageAdapter(app)
  );

  async function getList(filter?: { checked?: boolean }) {
    const [list, items, categories] = await Promise.all([
      repo.getList(),
      repo.getItems(),
      repo.getCategories(),
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
          hasImage: !!item?.image,
          addedBy: l.addedBy?.displayName ?? null,
          addedAt: l.addedAt,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async function getItemOf(listItemId: string) {
    const { itemId } = await repo.getListItem(listItemId);
    return itemId;
  }

  return {
    getList,

    addToList(input: Parameters<typeof repo.addToList>[0]) {
      return repo.addToList(input, {
        displayName: user.name ?? user.email,
        photoURL: null,
      });
    },

    async updateListItem(
      id: string,
      changes: Parameters<typeof repo.applyListItemChanges>[1]
    ) {
      await repo.applyListItemChanges(id, changes);
      return (await getList()).find((l) => l.id === id);
    },

    /** Stores an image the same way the web app does: `items/<itemId>#<name>`, path kept in `item.image`. */
    async setItemImage(id: string, image: ImageData) {
      const itemId = await getItemOf(id);
      const path = mcpImagePath(itemId, image.extension);
      await repo.uploadImage(path, image.buffer, image.contentType);
      await repo.setItemImage(itemId, path);
      return { id, image: path, bytes: image.buffer.length };
    },

    /** Step 1 of a direct upload: a short-lived signed PUT link so the bytes never pass through the agent's context. */
    async createImageUpload(id: string, contentType: string) {
      const extension = IMAGE_EXTENSIONS[contentType];
      if (!extension) {
        throw new Error(`Unsupported image type "${contentType}" (use ${Object.keys(IMAGE_EXTENSIONS).join(', ')})`);
      }
      const path = mcpImagePath(await getItemOf(id), extension);
      const sizeRange = `0,${MAX_UPLOAD_BYTES}`;
      const [uploadUrl] = await getStorage(app)
        .bucket()
        .file(path)
        .getSignedUrl({
          version: 'v4',
          action: 'write',
          expires: Date.now() + 10 * 60 * 1000,
          contentType,
          extensionHeaders: { 'x-goog-content-length-range': sizeRange },
        });
      return {
        uploadUrl,
        method: 'PUT',
        headers: { 'Content-Type': contentType, 'x-goog-content-length-range': sizeRange },
        path,
        expiresInSeconds: 600,
        next: `PUT the raw image bytes to uploadUrl with exactly these headers, then call finalize_shopping_list_item_image with id and path`,
      };
    },

    /** Step 2: verifies the uploaded file, then points the item at it (and drops the previous image). */
    async finalizeItemImage(id: string, path: string) {
      const itemId = await getItemOf(id);
      if (!path.startsWith(buildItemImagePath(itemId, 'mcp-'))) {
        throw new Error('path does not belong to this item');
      }
      const file = getStorage(app).bucket().file(path);
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error('No uploaded file found at that path (did the PUT succeed?)');
      }
      const [{ size, contentType }] = await file.getMetadata();
      if (!IMAGE_EXTENSIONS[String(contentType)]) {
        await file.delete({ ignoreNotFound: true });
        throw new Error(`Uploaded file has unsupported type "${contentType}"`);
      }
      await repo.setItemImage(itemId, path);
      return { id, image: path, bytes: Number(size), contentType };
    },

    async removeItemImage(id: string) {
      const { removed } = await repo.removeItemImage(await getItemOf(id));
      return { id, removed };
    },

    async removeFromList(ids: string[]) {
      await repo.deleteListItems(ids);
      return { removed: ids.length };
    },

    clearChecked: () => repo.clearChecked(),

    getCategories: () => repo.getCategories(),

    async addCategory(name: string, color?: string) {
      const category = color ? { name, color } : { name };
      return { id: await repo.addCategory(category), ...category };
    },

    async updateCategory(id: string, changes: { name?: string; color?: string }) {
      const existing = (await repo.getCategories()).find((c) => c.id === id);
      if (!existing) {
        throw new Error(`Category ${id} was not found`);
      }
      await repo.updateCategory(id, changes);
      return (await repo.getCategories()).find((c) => c.id === id);
    },

    async deleteCategory(id: string) {
      await repo.deleteCategory(id);
      return { deleted: id };
    },

    /** Known items that are not currently on the list (the app's suggestions). */
    async getCatalog() {
      return (await repo.getSuggestions())
        .map(({ id, name, categoryId }) => ({ id, name, categoryId: categoryId ?? null }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    async deleteCatalogItem(id: string) {
      await repo.deleteSuggestion(id);
      return { deleted: id };
    },
  };
}

export type Repository = ReturnType<typeof createRepository>;
