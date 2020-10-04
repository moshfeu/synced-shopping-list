import React, { FC, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { IconButton, Divider } from '@material-ui/core';
import {
  Search as SearchIcon,
  History as HistoryIcon,
} from '@material-ui/icons';
import { addListItem } from '../../../Services/db';
import { Header } from '../../Header/Header';
import { useDB } from '../../../Hooks/useDB';
import { Item } from '../../../types';

const useStyles = makeStyles(() => ({
  iconButton: {
    padding: 10,
  },
  divider: {
    height: 28,
    margin: 4,
  },
}));

export const Search: FC = () => {
  const classes = useStyles();
  const { items, listItems } = useDB();
  const options = useMemo(() => {
    return items.filter(
      (item) => !listItems.some((listItem) => listItem.item.id === item.id)
    );
  }, [items, listItems]);

  function onAdd(option: string | Item) {
    addListItem(
      typeof option === 'string'
        ? {
            name: option,
          }
        : {
            itemId: option.id,
          }
    );
  }

  return (
    <Header
      onSubmit={onAdd}
      input={{ placeholder: 'Product Name', options }}
      submit={{ icon: SearchIcon, label: 'Add' }}
    >
      <Divider className={classes.divider} orientation='vertical' />
      <IconButton className={classes.iconButton} aria-label='add from history'>
        <HistoryIcon />
      </IconButton>
    </Header>
  );
};
