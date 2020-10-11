import React, { FC } from 'react';
import {
  CardContent,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  makeStyles,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@material-ui/core';
import { useDB } from '../../Hooks/useDB';
import { addCategory, updateItem, updateListItem } from '../../Services/db';
import { ListItemView } from '../../Types/entities';
import { UNCATEGORIZED } from '../../consts';
import { Add } from '@material-ui/icons';
import { useGlobalStyles } from '../../Styles/common';
import { useUIStore } from '../../Hooks/useUIStore';

type ItemDetails = {
  listItem?: ListItemView;
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: 250,
    padding: theme.spacing(0, 2),
  },
  formControl: {
    display: 'flex',
    marginBottom: theme.spacing(4),
  },
  label: {
    '& + $select': {
      margin: 0,
    },
  },
  select: {},
}));

export const ItemDetails: FC<ItemDetails> = ({ listItem }) => {
  const classes = useStyles();
  const { flexGrow, flex } = useGlobalStyles();
  const { categories } = useDB();
  const { dispatch } = useUIStore();
  const category = categories.find(
    ({ id }) => id === listItem?.item.category?.id
  );

  function onChange(e: React.ChangeEvent<{ name?: string; value: any }>) {
    let { value, name } = e.target;
    if (name === 'category') {
      value = value === UNCATEGORIZED ? null : value;
      updateItem(listItem!.item, {
        categoryId: value,
      });
    } else {
      updateListItem(listItem!, {
        [name!]: value,
      });
    }
  }

  async function onAddCategory(formData: FormData) {
    const name = formData.get('category') as string;
    const category = await addCategory({
      name,
    });
    if (!category?.key) {
      return;
    }
    updateItem(listItem!.item, {
      categoryId: category.key,
    });
  }

  function showAddCategory() {
    dispatch({
      type: 'DIALOG',
      payload: {
        title: 'Add Category',
        actionText: 'Add',
        content: <TextField name='category' type='text' required />,
        onAction: onAddCategory,
      },
    });
  }

  return (
    <div className={classes.root}>
      {listItem ? (
        <CardContent>
          <Typography gutterBottom variant='h5' component='h2'>
            {listItem?.item.name}
          </Typography>
          <Grid container wrap='nowrap' classes={{ root: classes.formControl }}>
            <Grid item classes={{ root: flexGrow }}>
              <FormControl classes={{ root: flex }}>
                <FormLabel
                  classes={{ filled: classes.label }}
                  htmlFor='category'
                >
                  Caetgory
                </FormLabel>
                <Select
                  name='category'
                  id='category'
                  onChange={onChange}
                  value={category?.id || UNCATEGORIZED}
                  className={classes.select}
                >
                  <MenuItem key={UNCATEGORIZED} value={UNCATEGORIZED}>
                    Uncategorized
                  </MenuItem>
                  {categories.map(({ id, name }) => (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <IconButton onClick={showAddCategory}>
                <Add />
              </IconButton>
            </Grid>
          </Grid>
          <FormControl classes={{ root: classes.formControl }}>
            <FormLabel htmlFor='quantity'>Quantity</FormLabel>
            <TextField
              name='quantity'
              type='number'
              defaultValue={listItem.quantity || 1}
              onChange={onChange}
            />
          </FormControl>
          <FormControl classes={{ root: classes.formControl }}>
            <FormLabel htmlFor='notes'>Note</FormLabel>
            <TextField
              name='note'
              type='text'
              multiline
              rowsMax={4}
              placeholder='The blue one..'
              defaultValue={listItem.note}
              onChange={onChange}
            />
          </FormControl>
        </CardContent>
      ) : null}
    </div>
  );
};
