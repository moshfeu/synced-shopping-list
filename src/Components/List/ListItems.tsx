import { FC, ReactElement, useMemo } from 'react';
import { MoreVert } from '@mui/icons-material';
import { Badge, Grid } from '@mui/material';
import { groupItemsBy } from '../../Services/converters';
import { ListItemView } from '../../Types/entities';
import { GroupedList, GroupedListItem } from '../GroupedList/GroupedList';

type ItemProps = {
  items: Array<ListItemView>;
  header?: ReactElement;
  className: string;
  groupByCategory?: boolean;
  onCheckItem(listItem: ListItemView): void;
  onDeleteItem(listItem: ListItemView): void;
  onClickMoreItem?(listItem: ListItemView): void;
};

const MoreIcon = ({ image }: Pick<GroupedListItem, 'image'>) => {
  if (image) {
    return (
      <Badge color='secondary' badgeContent=' ' variant='dot'>
        <MoreVert />
      </Badge>
    );
  }
  return <MoreVert />;
};

export const ListItems: FC<ItemProps> = ({
  items,
  header,
  className,
  onCheckItem,
  onDeleteItem,
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
      level: item.urgency,
      image: item.item.image,
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
        actionIcon={(item) => <MoreIcon image={item.image} />}
        onCheckItem={handleItemAction(onCheckItem)!}
        onDeleteItem={handleItemAction(onDeleteItem)!}
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
  <Grid container spacing={1}>
    <Grid item>{name}</Grid>
    <Grid item>{quantity > 1 ? `(${quantity})` : ''}</Grid>
  </Grid>
);
