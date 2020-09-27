import React, { FC } from 'react';
import {
  List as MUIList,
  ListItem,
  ListItemText,
  makeStyles,
} from '@material-ui/core';
import { useDB } from '../../Hooks/useDB';
import { Search } from './Search/Search';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
}));

export const List: FC = () => {
  const classes = useStyles();
  const { items } = useDB();

  return (
    <>
      <Search />
      <MUIList className={classes.root}>
        {Object.entries(items).map(([id, item]) => (
          <ListItem dense button key={id}>
            <ListItemText id={id} primary={item.name} />
          </ListItem>
        ))}
      </MUIList>
    </>
  );
};
