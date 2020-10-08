import React, { FC } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { IconButton, Divider } from '@material-ui/core';
import {
  Search as SearchIcon,
  History as HistoryIcon,
} from '@material-ui/icons';
import { Link } from 'react-router-dom';
import { addListItem } from '../../../Services/db';
import { Header } from '../../Header/Header';
import { useDB } from '../../../Hooks/useDB';
import { Item } from '../../../Types/entities';

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
  const { items } = useDB();

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
      input={{ placeholder: 'Product Name', options: items }}
      submit={{ icon: SearchIcon, label: 'Add' }}
    >
      <Divider className={classes.divider} orientation='vertical' />
      <IconButton
        component={Link}
        to='/history'
        className={classes.iconButton}
        aria-label='Add from history'
      >
        <HistoryIcon />
      </IconButton>
    </Header>
  );
};
