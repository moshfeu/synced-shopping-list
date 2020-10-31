import firebase from 'firebase';
import * as cache from './cache';
const storageRef = firebase.storage().ref();

export const ITEMS_PATH = 'items';

function getPath(fileName: string) {
  return `${ITEMS_PATH}/${fileName}`;
}

export async function upload(fileName: string, file: ArrayBuffer) {
  const productImageRef = storageRef.child(getPath(fileName));
  const uploaded = await productImageRef.put(file);
  const { fullPath } = uploaded.metadata;
  cache.add(getImageUrl(fullPath), file);
  return fullPath;
}

export function remove(filePath: string) {
  cache.remove(getImageUrl(filePath));
  const productImageRef = storageRef.child(filePath);
  return productImageRef.delete();
}

export function getImageUrl(image: string) {
  return `https://firebasestorage.googleapis.com/v0/b/sync-shopping-list-5e6ea.appspot.com/o/${encodeURIComponent(
    image
  )}?alt=media`;
}
