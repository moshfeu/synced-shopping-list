import React, { FC } from 'react';
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Checkbox,
  ListItemIcon,
} from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { ListItemView } from '../../types';

type ItemProps = {
  items: Array<ListItemView>;
  onCheckItem(listItem: ListItemView): void;
  onClickMoreItem?(listItem: ListItemView): void;
  className: string;
};

export const ListItems: FC<ItemProps> = ({
  items,
  onCheckItem,
  onClickMoreItem,
  className,
}) => {
  return (
    <>
      {items.length ? (
        <List className={className}>
          {items.map((item) => (
            <ListItem dense button>
              <ListItemIcon>
                <Checkbox
                  onChange={() => onCheckItem(item)}
                  edge='start'
                  tabIndex={-1}
                  disableRipple
                  checked={item.checked}
                />
              </ListItemIcon>
              <ListItemText id={item.id} primary={item.item.name} />
              <ListItemSecondaryAction>
                {onClickMoreItem && (
                  <IconButton onClick={() => onClickMoreItem(item)}>
                    <MoreVert />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : null}
    </>
  );
};
