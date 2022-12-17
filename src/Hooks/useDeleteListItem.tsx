import { deleteListItems, deleteItem, addListItemFull } from '../Services/db';
import { ListItemView } from '../Types/entities';
import { useUndo } from './useUndo';

export const useDeleteListItem = () => {
  const showUndo = useUndo();

  return async function deleteListItem(item: ListItemView) {
    await deleteListItems([item]);
    deleteItem(item.item.id);

    showUndo({
      message: 'Item deleted',
      onAction: () => {
        addListItemFull(item);
      },
    });
  };
};
