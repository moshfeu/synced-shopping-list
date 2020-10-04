import React, { FC, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem as MUIListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Button,
  makeStyles,
} from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import { Item } from '../../types';
import { deleteItem } from '../../Services/db';
import { useGlobalStyles } from '../../Styles/common';
import { EmptyState } from '../EmptyState/EmptyState';

type HistoryProps = {
  open: boolean;
  items: Array<Item>;
  onAdd(items: Array<Item>): void;
  onClose(): void;
};

const useStyles = makeStyles(() => ({
  content: {
    padding: 0,
  },
}));

export const History: FC<HistoryProps> = ({ open, items, onClose, onAdd }) => {
  const classes = useStyles();
  const globalClasses = useGlobalStyles();
  const [checkedItems, setCheckedItems] = useState(new Set());

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
          <List>
            {items.map((item) => {
              const checked = checkedItems.has(item.id);
              return (
                <MUIListItem key={item.id}>
                  <ListItemIcon classes={{ root: globalClasses.listItemIcon }}>
                    <Checkbox
                      onChange={() => {
                        setCheckedItems(
                          (prevState) =>
                            new Set(
                              checked
                                ? (prevState.delete(item.id), prevState)
                                : prevState.add(item.id)
                            )
                        );
                      }}
                      edge='start'
                      tabIndex={-1}
                      disableRipple
                      checked={checked}
                    />
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge='end'
                      aria-label='delete'
                      onClick={() => deleteItem(item)}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </MUIListItem>
              );
            })}
          </List>
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
