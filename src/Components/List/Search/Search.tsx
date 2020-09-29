import React, { FC } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { IconButton, Divider } from '@material-ui/core';
import {
  Search as SearchIcon,
  History as HistoryIcon,
} from '@material-ui/icons';
import { addItem } from '../../../Services/db';
import { Header } from '../../Header/Header';
import { useDB } from '../../../Hooks/useDB';

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

  function onAdd(name: string) {
    addItem({ name });
  }

  return (
    <Header
      onSubmit={onAdd}
      input={{ placeholder: 'Product Name', options: items }}
      submit={{ icon: SearchIcon, label: 'Add' }}
    >
      <Divider className={classes.divider} orientation='vertical' />
      <IconButton className={classes.iconButton} aria-label='add from history'>
        <HistoryIcon />
      </IconButton>
    </Header>
  );
};
