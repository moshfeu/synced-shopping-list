import React, { FC } from 'react';
import { Link } from 'react-router-dom';
import { IconButton, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Search as SearchIcon,
  History as HistoryIcon,
} from '@material-ui/icons';
import { useAuth } from '../../../Hooks/useAuth';
import { useDB } from '../../../Hooks/useDB';
import { addListItem } from '../../../Services/db';
import { Item } from '../../../Types/entities';
import { Header } from '../../Header/Header';

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
  const { displayName = '', photoURL = '' } = useAuth() || {};
  const { items } = useDB();

  function onAdd(option: string | Item) {
    addListItem(
      typeof option === 'string'
        ? {
            name: option,
          }
        : {
            itemId: option.id,
          },
      {
        displayName,
        photoURL,
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
