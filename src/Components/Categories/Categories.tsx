import React, { FC } from 'react';
import {
  List as MUIList,
  ListItem,
  ListItemText,
  makeStyles,
} from '@material-ui/core';
import { useDB } from '../../Hooks/useDB';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
}));

export const CategoriesList: FC = () => {
  const classes = useStyles();
  const { categories } = useDB();

  return (
    <MUIList className={classes.root}>
      Categories!
      {Object.entries(categories).map(([id, category]) => (
        <ListItem dense button key={id}>
          <ListItemText id={id} primary={category.name} />
        </ListItem>
      ))}
      !Categories!
    </MUIList>
  );
};
