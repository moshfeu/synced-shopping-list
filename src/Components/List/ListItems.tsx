import React, { FC, ReactElement, useMemo } from 'react';
import { MoreVert } from '@material-ui/icons';
import { ListItemView } from '../../Types/entities';
import { groupItemsBy } from '../../Services/converters';
import { GroupedList, GroupedListItem } from '../GroupedList/GroupedList';

type ItemProps = {
  items: Array<ListItemView>;
  header?: ReactElement;
  className: string;
  groupByCategory?: boolean;
  onCheckItem(listItem: ListItemView): void;
  onClickMoreItem?(listItem: ListItemView): void;
};

export const ListItems: FC<ItemProps> = ({
  items,
  header,
  className,
  onCheckItem,
  onClickMoreItem,
}) => {
  const groupByCategories = useMemo(() => {
    return groupItemsBy(items, ['item', 'category', 'name'], (item) => ({
      key: item.id,
      checked: item.checked,
      primary: (
        <ListItemTextComposition
          name={item.item.name}
          quantity={item.quantity}
        />
      ),
      secondary: item.note,
    }));
  }, [items]);

  function handleItemAction(
    callback?: (groupedListItem: ListItemView) => void
  ) {
    if (!callback) return;
    return (groupedListItem: GroupedListItem) => {
      callback(items.find((item) => item.id === groupedListItem.key)!);
    };
  }

  if (!items.length) {
    return <></>;
  }

  return (
    <div className={className}>
      {header}
      <GroupedList
        categories={groupByCategories}
        actionIcon={<MoreVert />}
        onCheckItem={handleItemAction(onCheckItem)!}
        onAction={handleItemAction(onClickMoreItem)}
      />
    </div>
  );
};

type ListItemTextCompositionProps = {
  name: string;
  quantity: number;
};

const ListItemTextComposition: FC<ListItemTextCompositionProps> = ({
  name,
  quantity,
}) => (
  <>
    {name}
    {quantity > 1 ? <> ({quantity})</> : null}
  </>
);
