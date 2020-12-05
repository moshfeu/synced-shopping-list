import React, { FC } from 'react';
import {
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  makeStyles,
  TextField,
  InputProps,
} from '@material-ui/core';
import { Add, Delete } from '@material-ui/icons';
import { useDB } from '../../Hooks/useDB';
import { addCategory, deleteCategory, updateCategory } from '../../Services/db';
import { Header } from '../Header/Header';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  input: {
    '& .MuiInput-underline:before': {
      borderBottomColor: 'transparent',
    },
  },
}));

export const CategoriesList: FC = () => {
  const classes = useStyles();
  const { categories } = useDB();

  function onSubmit(name: string) {
    addCategory({
      name,
      color: 'fff',
    });
  }

  function onChange(id: string): InputProps['onChange'] {
    return (e) => {
      updateCategory(id, e.target.value);
    };
  }

  return (
    <>
      <Header
        input={{ placeholder: 'Category Name' }}
        submit={{ icon: Add, label: 'Add' }}
        onSubmit={onSubmit}
      />
      <List className={classes.root}>
        {categories.map(({ id, name }) => (
          <ListItem dense button key={id}>
            <ListItemText>
              <TextField
                classes={{ root: classes.input }}
                defaultValue={name}
                size='medium'
                onChange={onChange(id)}
              />
            </ListItemText>
            <ListItemSecondaryAction>
              <IconButton onClick={() => deleteCategory(id)}>
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </>
  );
};
