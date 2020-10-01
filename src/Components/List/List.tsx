import React, { useState, useEffect, FC } from 'react';
import {
  List as MUIList,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Drawer,
  IconButton,
  makeStyles,
} from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { useHistory, useParams } from 'react-router-dom';
import { useDB } from '../../Hooks/useDB';
import { Search } from './Search/Search';
import { ItemDetails } from './ItemDetails';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
}));

export const List: FC = () => {
  const classes = useStyles();
  const { listItems } = useDB();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [isDrawOpen, setIsDrawOpen] = useState(false);
  const focusedItem = listItems.find((listItem) => listItem.id === id);

  useEffect(() => {
    setIsDrawOpen(!!id);
  }, [id]);

  function showItemDetailes(itemId: string) {
    history.push(`/item/${itemId}`);
  }

  function hideItemDetailes() {
    history.push('/');
  }

  return (
    <>
      <Search />
      <Drawer anchor='right' open={isDrawOpen} onClose={hideItemDetailes}>
        <ItemDetails itemList={focusedItem} />
      </Drawer>
      <MUIList className={classes.root}>
        {listItems.map(({ id, item: { name } }) => (
          <ListItem dense button key={id}>
            <ListItemText id={id} primary={name} />
            <ListItemSecondaryAction>
              <IconButton onClick={() => showItemDetailes(id)}>
                <MoreVert />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </MUIList>
    </>
  );
};
