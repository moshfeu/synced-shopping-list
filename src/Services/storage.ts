import firebase from 'firebase';
import * as cache from './cache';

const storageRef = firebase.storage().ref();
const isFirebaseFile = (urlOrPath: string) => !urlOrPath.startsWith('https');

export const ITEMS_PATH = 'items';

function getPath(fileName: string) {
  return `${ITEMS_PATH}/${fileName}`;
}

export async function upload(
  fileName: string,
  file: ArrayBuffer,
  contentType?: string
) {
  const productImageRef = storageRef.child(getPath(fileName));
  const uploaded = await productImageRef.put(
    file,
    contentType ? { contentType } : undefined
  );
  const { fullPath } = uploaded.metadata;
  cache.add(getImageUrl(fullPath), file, contentType);
  return fullPath;
}

export async function remove(filePath: string) {
  cache.remove(getImageUrl(filePath));
  if (isFirebaseFile(filePath)) {
    const productImageRef = storageRef.child(filePath);
    return productImageRef.delete();
  }
}

export function getImageUrl(image: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_STORAGE_BUCKET}/o/${encodeURIComponent(
    image
  )}?alt=media`;
}
