import React, { FC, useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  makeStyles,
  InputBase,
  Grid,
} from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import { ItemView } from '../../types';
import { deleteItem } from '../../Services/db';
import { EmptyState } from '../EmptyState/EmptyState';
import { GroupedList } from '../GroupedList/GroupedList';
import { groupItemsBy } from '../../Services/converters';

type HistoryProps = {
  open: boolean;
  items: Array<ItemView>;
  onAdd(items: Map<string, number>): void;
  onClose(): void;
};

const useStyles = makeStyles((theme) => ({
  content: {
    padding: 0,
  },
  quantity: {
    width: theme.spacing(4),
    border: `1px solid ${theme.palette.primary.light}`,
  },
  quantityInput: {
    textAlign: 'center',
    lineHeight: 1,
  },
}));

export const History: FC<HistoryProps> = ({ open, items, onClose, onAdd }) => {
  const classes = useStyles();
  const [checkedItems, setCheckedItems] = useState(new Map<string, number>());

  const groupByCategories = useMemo(() => {
    return groupItemsBy(items, ['category', 'name'], (item) => ({
      key: item.id,
      checked: checkedItems.has(item.id),
      primary: (
        <ItemTextComposition
          name={item.name}
          value={checkedItems.get(item.id)!}
          onChange={(value) =>
            setCheckedItems((prevState) => prevState.set(item.id, value))
          }
        />
      ),
    }));
  }, [checkedItems, items]);

  function handleAdd() {
    onAdd(checkedItems);
    onClose();
  }

  useEffect(() => {
    setCheckedItems((prevState) => {
      prevState.clear();
      return prevState;
    });
  }, [open]);

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby='dialog-title'
      open={open}
      fullWidth
      scroll='paper'
    >
      <DialogTitle id='dialog-title'>History</DialogTitle>
      <DialogContent classes={{ root: classes.content }} dividers>
        {items.length ? (
          <GroupedList
            categories={groupByCategories}
            actionIcon={<Delete />}
            onAction={(item) => deleteItem(item.key)}
            onCheckItem={(item) =>
              setCheckedItems(
                (prevState) =>
                  new Map(
                    item.checked
                      ? (prevState.delete(item.key), prevState)
                      : prevState.set(item.key, 1)
                  )
              )
            }
          />
        ) : (
          <EmptyState text='Have you added the whole history??' />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary'>
          Cancel
        </Button>
        <Button onClick={handleAdd} color='primary'>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

type ItemTextCompositionProps = {
  name: string;
  value: number;
  onChange(input: number): void;
};
const ItemTextComposition: FC<ItemTextCompositionProps> = ({
  name,
  value,
  onChange,
}) => {
  const classes = useStyles();
  return (
    <Grid container direction='row' justify='space-between' alignItems='center'>
      <Grid item>{name}</Grid>
      {value ? (
        <Grid item>
          <InputBase
            type='number'
            defaultValue={value}
            classes={{ root: classes.quantity, input: classes.quantityInput }}
            color='primary'
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </Grid>
      ) : null}
    </Grid>
  );
};
