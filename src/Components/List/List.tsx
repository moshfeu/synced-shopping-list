import React, { useState, useEffect, FC, useMemo } from 'react';
import { partition } from 'lodash';
import { Drawer, makeStyles, Typography } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import { useDB } from '../../Hooks/useDB';
import { Search } from './Search/Search';
import { ItemDetails } from './ItemDetails';
import { deleteListItems, updateListItem } from '../../Services/db';
import { ListItems } from './ListItems';
import { CheckedListHeader } from './CheckedListHeader';
import { useUIStore } from '../../Hooks/useUIStore';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  list: {
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    height: '100vh',
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
  const { listItems } = useDB();
  const { showConfirmation } = useUIStore();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [isDrawOpen, setIsDrawOpen] = useState(false);
  const focusedItem = listItems.find((listItem) => listItem.id === id);
  const [checkedItems, uncheckedItems] = useMemo(
    () => partition(listItems, (item) => item.checked),
    [listItems]
  );

  useEffect(() => {
    setIsDrawOpen(!!id);
  }, [id]);

  function showItemDetailes(itemId: string) {
    history.push(`/item/${itemId}`);
  }

  function hideItemDetailes() {
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

  return (
    <div className={classes.list}>
      <Search />
      <Drawer anchor='right' open={isDrawOpen} onClose={hideItemDetailes}>
        <ItemDetails listItem={focusedItem} />
      </Drawer>
      <div>
        <ListItems
          items={uncheckedItems}
          className={classes.root}
          onCheckItem={(listItem) =>
            updateListItem(listItem, { checked: true })
          }
          onClickMoreItem={(listItem) => showItemDetailes(listItem.id)}
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
