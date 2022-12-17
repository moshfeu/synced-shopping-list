import { useState, useEffect, FC, useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { partition } from 'lodash';
import { LinearProgress, Drawer, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useAuth } from '../../Hooks/useAuth';
import { useDB } from '../../Hooks/useDB';
import { useUIStore } from '../../Hooks/useUIStore';
import { addListItems, deleteListItems, updateListItem } from '../../Services/db';
import { EmptyState } from '../EmptyState/EmptyState';
import { CheckedListHeader } from './CheckedListHeader';
import { History } from './History';
import { ItemDetails } from './ItemDetails';
import { ListItems } from './ListItems';
import { Search } from './Search/Search';
import { useDeleteListItem } from '../../Hooks/useDeleteListItem';
import { useNavigation } from '../../Hooks/useRoute';


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
  loader: {
    top: 0,
    width: '100%',
    position: 'absolute',
  }
}));

export const List: FC = () => {
  const classes = useStyles();
  const deleteListItem = useDeleteListItem();
  const {navigateToItem, navigateToHome} = useNavigation();
  const { list, items, isDBReady } = useDB();
  const { currentUser } = useAuth();
  const { state, dispatch } = useUIStore();
  const { id } = useParams<{ id: string }>();
  const { location } = useHistory();
  const [isDrawOpen, setIsDrawOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const focusedItem = list.find((listItem) => listItem.id === id);
  const [checkedItems, uncheckedItems] = useMemo(
    () => partition(list, (item) => item.checked),
    [list]
  );

  useEffect(() => {
    setIsDrawOpen(!!id);
  }, [id]);

  useEffect(() => {
    setIsHistoryOpen(location.pathname === '/history');
  }, [location.pathname]);

  function onDeleteChecked() {
    dispatch({
      type: 'CONFIRMATION',
      payload: {
        title: 'Confirm',
        text: 'Are you sure you want to delete all the items?',
        onConfirm: () => {
          deleteListItems(checkedItems);
        },
      },
    });
  }

  function handleAddFromHistory(items: Map<string, number>) {
    addListItems(
      Array.from(items.entries()).map(([itemId, quantity]) => ({
        itemId,
        quantity,
        note: '',
        checked: false,
        urgency: '1',
        addedBy: currentUser
          ? {
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            }
          : null,
      }))
    );
  }

  if (!isDBReady) {
    return null;
  }

  return (
    <div className={classes.root}>
      <Search />
      <Drawer anchor='right' open={isDrawOpen} onClose={navigateToHome}>
        {focusedItem && <ItemDetails listItem={focusedItem} />}
      </Drawer>
      <History
        open={isHistoryOpen}
        items={items}
        onAdd={handleAddFromHistory}
        onClose={navigateToHome}
      />
      {
        state.isAppLoading && <LinearProgress classes={{root: classes.loader}} />
      }
      {list.length ? (
        <div className={classes.lists}>
            <ListItems
              items={uncheckedItems}
              className={classes.uncheckedList}
              onCheckItem={(listItem) =>
                updateListItem(listItem, { checked: true })
              }
              onDeleteItem={deleteListItem}
              onClickMoreItem={(listItem) => navigateToItem(listItem.id)}
            />
            <ListItems
              header={<CheckedListHeader onDelete={onDeleteChecked} />}
              items={checkedItems}
              className={classes.checkedList}
              onDeleteItem={deleteListItem}
              onCheckItem={(listItem) =>
                updateListItem(listItem, { checked: false })
              }
            />
        </div>
      ) : (
        <EmptyState
          text={
            <>
              <div>Amm.. We can't go shopping that way,</div>
              <div>please add some products.</div>
            </>
          }
        />
      )}
      <div className={classes.summary}>
        <Typography>
          Total: {uncheckedItems.length + checkedItems.length}
        </Typography>
        <Typography>Left: {uncheckedItems.length}</Typography>
      </div>
    </div>
  );
};