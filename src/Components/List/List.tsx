import React, { useState, useEffect, FC, useMemo } from 'react';
import { partition } from 'lodash';
import { Drawer, makeStyles, Typography } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import { useDB } from '../../Hooks/useDB';
import { Search } from './Search/Search';
import { ItemDetails } from './ItemDetails';
import {
  addListItems,
  deleteListItems,
  updateListItem,
} from '../../Services/db';
import { ListItems } from './ListItems';
import { History } from './History';
import { CheckedListHeader } from './CheckedListHeader';
import { useUIStore } from '../../Hooks/useUIStore';
import { Item } from '../../types';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    height: '100vh',
  },
  lists: {
    overflowY: 'auto',
  },
  uncheckedList: {
    backgroundColor: theme.palette.background.paper,
  },
  checkedList: {
    backgroundColor: theme.palette.background.default,
  },
  summary: {
    backgroundColor: theme.palette.info.dark,
    color: theme.palette.info.contrastText,
    padding: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-around',
  },
}));

export const List: FC = () => {
  const classes = useStyles();
  const { listItems, items } = useDB();
  const { showConfirmation } = useUIStore();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const { location } = useHistory();
  const [isDrawOpen, setIsDrawOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const focusedItem = listItems.find((listItem) => listItem.id === id);
  const [checkedItems, uncheckedItems] = useMemo(
    () => partition(listItems, (item) => item.checked),
    [listItems]
  );

  useEffect(() => {
    setIsDrawOpen(!!id);
  }, [id]);

  useEffect(() => {
    setIsHistoryOpen(location.pathname === '/history');
  }, [location.pathname]);

  function navigateToItem(itemId: string) {
    history.push(`/item/${itemId}`);
  }

  function navigateToRoot() {
    history.push('/');
  }

  function onDeleteChecked() {
    showConfirmation({
      title: 'Confirm',
      text: 'Are you sure you want to delete all the items?',
      onConfirm: () => {
        deleteListItems(checkedItems);
      },
    });
  }

  function handleAddFromHistory(items: Array<Item>) {
    addListItems(
      items.map((item) => ({
        checked: false,
        itemId: item.id,
        note: '',
        quantity: 1,
      }))
    );
  }

  return (
    <div className={classes.root}>
      <Search />
      <Drawer anchor='right' open={isDrawOpen} onClose={navigateToRoot}>
        <ItemDetails listItem={focusedItem} />
      </Drawer>
      <History
        open={isHistoryOpen}
        items={items}
        onAdd={handleAddFromHistory}
        onClose={() => {
          setIsHistoryOpen(false);
          navigateToRoot();
        }}
      />
      <div className={classes.lists}>
        <ListItems
          items={uncheckedItems}
          className={classes.uncheckedList}
          onCheckItem={(listItem) =>
            updateListItem(listItem, { checked: true })
          }
          onClickMoreItem={(listItem) => navigateToItem(listItem.id)}
        />
        <ListItems
          header={<CheckedListHeader onDelete={onDeleteChecked} />}
          items={checkedItems}
          className={classes.checkedList}
          onCheckItem={(listItem) =>
            updateListItem(listItem, { checked: false })
          }
        />
      </div>
      <div className={classes.summary}>
        <Typography>
          Total: {uncheckedItems.length + checkedItems.length}
        </Typography>
        <Typography>Left: {uncheckedItems.length}</Typography>
      </div>
    </div>
  );
};
