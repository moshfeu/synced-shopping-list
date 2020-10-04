import React, { FC, ReactElement } from 'react';
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
  header?: ReactElement;
  className: string;
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
  if (!items.length) {
    return <></>;
  }
  return (
    <div className={className}>
      {header}
      <List>
        {items.map((item) => (
          <ListItem key={item.id} dense button>
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
    </div>
  );
};
