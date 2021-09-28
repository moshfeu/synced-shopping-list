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
import { useUIStore } from '../../../Hooks/useUIStore';
import { addListItem } from '../../../Services/db';
import { Item } from '../../../Types/entities';
import { Header } from '../../Header/Header';

type Option = string | Item;

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
  const { items, list } = useDB();
  const { dispatch } = useUIStore();
  const { displayName = '', photoURL = '' } = useAuth() || {};

  function getItemOrNew(option: Option): Parameters<typeof addListItem>[0] {
    if (typeof option === 'string') {
      const existingInHistory = items.find(({ name }) => name === option);
      if (existingInHistory) {
        return {
          itemId: existingInHistory.id,
        };
      }
      return {
        name: option,
      };
    }
    return {
      itemId: option.id,
    };
  }

  function isItemInList(option: Option): boolean {
    return (
      typeof option === 'string' &&
      list.some(({ item }) => item.name === option)
    );
  }

  function onAdd(option: Option) {
    if (isItemInList(option)) {
      dispatch({
        type: 'SNACK',
        payload: {
          message: 'Item already in list',
        },
      });
      return;
    }
    const item = getItemOrNew(option);
    const user = {
      displayName,
      photoURL,
    };
    addListItem(item, user);
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
