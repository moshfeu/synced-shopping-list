export const ITEMS_IMAGE_DIR = 'items';

export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** Storage path of an item's image: `items/<itemId>#<fileName>`. */
export function buildItemImagePath(itemId: string, fileName: string) {
  return `${ITEMS_IMAGE_DIR}/${itemId}#${fileName}`;
}

/** Images that came from a URL (not our storage) have nothing to delete. */
export function isStoredImage(image: string) {
  return !image.startsWith('https');
}
