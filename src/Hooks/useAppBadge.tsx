import { useEffect } from 'react';
import { ListItems } from '../Types/entities';

/**
 * Custom hook to manage the app badge count based on urgent items
 * Updates the badge to show the number of unchecked urgent items (urgency level 3)
 */
export const useAppBadge = (list: ListItems) => {
  useEffect(() => {
    // Calculate the number of urgent items that are not checked
    const urgentItemsCount = list.filter(
      (item) => item.urgency === '3' && !item.checked
    ).length;

    // Check if the Badging API is supported
    if ('setAppBadge' in navigator) {
      if (urgentItemsCount > 0) {
        // Set the badge with the count
        navigator.setAppBadge(urgentItemsCount).catch(() => {
          // Silently fail - badge API is not critical functionality
        });
      } else {
        // Clear the badge when there are no urgent items
        navigator.clearAppBadge().catch(() => {
          // Silently fail - badge API is not critical functionality
        });
      }
    }
  }, [list]);
};

