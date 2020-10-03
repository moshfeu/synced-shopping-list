import React, { FC } from 'react';
import {
  CardContent,
  FormControl,
  FormLabel,
  makeStyles,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@material-ui/core';
import { useDB } from '../../Hooks/useDB';
import { updateItem, updateListItem } from '../../Services/db';
import { ListItemView } from '../../types';
import { UNCATEGORIZED } from '../../consts';

type ItemDetails = {
  itemList?: ListItemView;
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: 250,
    padding: '0 10px',
  },
  formControl: {
    width: '100%',
    marginBottom: theme.spacing(4),
  },
  label: {
    '& + $select': {
      margin: 0,
    },
  },
  select: {},
}));

export const ItemDetails: FC<ItemDetails> = ({ itemList }) => {
  const classes = useStyles();
  const { categories } = useDB();

  function onChange(e: React.ChangeEvent<{ name?: string; value: any }>) {
    let { value, name } = e.target;
    if (name === 'category') {
      value = value === UNCATEGORIZED ? null : value;
      updateItem(itemList!.item, {
        category: value,
      });
    } else {
      updateListItem(itemList!, {
        [name!]: value,
      });
    }
  }

  return (
    <div className={classes.root}>
      {!itemList ? null : (
        <CardContent>
          <Typography gutterBottom variant='h5' component='h2'>
            {itemList?.item.name}
          </Typography>
          <FormControl classes={{ root: classes.formControl }}>
            <FormLabel classes={{ filled: classes.label }} htmlFor='category'>
              Caetgory
            </FormLabel>
            <Select
              name='category'
              id='category'
              onChange={onChange}
              defaultValue={itemList.item.category || UNCATEGORIZED}
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
          <FormControl classes={{ root: classes.formControl }}>
            <FormLabel htmlFor='quantity'>Quantity</FormLabel>
            <TextField
              name='quantity'
              type='number'
              defaultValue={itemList.quantity || 1}
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
              defaultValue={itemList.note}
              onChange={onChange}
            />
          </FormControl>
        </CardContent>
      )}
    </div>
  );
};
