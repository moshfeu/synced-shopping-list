import React, { FC, ReactNode, ReactElement } from 'react';
import {
  FormControl,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
} from '@material-ui/core';
import { useDB } from '../../Hooks/useDB';
import { updateItem } from '../../Services/db';
import { Item } from '../../types';
import { UNCATEGORIZED } from '../../consts';

type ItemDetails = {
  item?: Item;
};

const useStyles = makeStyles(() => ({
  root: {
    width: 250,
    padding: '0 10px',
  },
  formControl: {
    width: '100%',
  },
}));

export const ItemDetails: FC<ItemDetails> = ({ item }) => {
  const classes = useStyles();
  const { categories } = useDB();

  function onChange(_e: unknown, value: ReactNode) {
    const { value: category } = (value as ReactElement).props;
    updateItem(item!, {
      category: category === UNCATEGORIZED ? null : category,
    });
  }

  return (
    <div className={classes.root}>
      {!item ? null : (
        <FormControl classes={{ root: classes.formControl }}>
          <InputLabel>Caetgory</InputLabel>
          <Select
            onChange={onChange}
            defaultValue={item.category || UNCATEGORIZED}
          >
            <MenuItem key={UNCATEGORIZED} value={UNCATEGORIZED}>
              uncategorized
            </MenuItem>
            {categories.map(({ id, name }) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </div>
  );
};
