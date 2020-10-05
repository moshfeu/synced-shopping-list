import React, { FC, useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  makeStyles,
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
  onAdd(items: Array<ItemView>): void;
  onClose(): void;
};

const useStyles = makeStyles(() => ({
  content: {
    padding: 0,
  },
}));

export const History: FC<HistoryProps> = ({ open, items, onClose, onAdd }) => {
  const classes = useStyles();
  const [checkedItems, setCheckedItems] = useState(new Set());

  const groupByCategories = useMemo(() => {
    return groupItemsBy(items, ['category', 'name'], (item) => ({
      key: item.id,
      checked: checkedItems.has(item.id),
      primary: item.name,
    }));
  }, [checkedItems, items]);

  function handleAdd() {
    onAdd(items.filter((item) => checkedItems.has(item.id)));
    onClose();
  }

  useEffect(() => {
    setCheckedItems(new Set());
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
                  new Set(
                    item.checked
                      ? (prevState.delete(item.key), prevState)
                      : prevState.add(item.key)
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
