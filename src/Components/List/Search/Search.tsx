import React, { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search as SearchIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { IconButton, Divider, TextField } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useAuth } from '../../../Hooks/useAuth';
import { useDB } from '../../../Hooks/useDB';
import { useUIStore } from '../../../Hooks/useUIStore';
import { addListItem, updateListItem } from '../../../Services/db';
import { Item, ListItemView } from '../../../Types/entities';
import type { ListItem } from '../../../Types/entities';
import { Header } from '../../Header/Header';
import { FormDialog } from '../../Dialogs/FormDialog/FormDialog';

type Option = string | Item;

const useStyles = makeStyles(() => ({
  iconButton: {
    padding: 10,
  },
  divider: {
    height: 28,
    margin: 4,
  },
}));

export const Search: FC = () => {
  const classes = useStyles();
  const { items, list } = useDB();
  const { dispatch } = useUIStore();
  const { currentUser } = useAuth();
  const [pendingItem, setPendingItem] = useState<ListItem | null>(null);

  function getItemOrNew(option: Option): Parameters<typeof addListItem>[0] {
    if (typeof option === 'string') {
      const existingInHistory = items.find(({ name }) => name === option);
      if (existingInHistory) {
        return {
          itemId: existingInHistory.id,
          requiredQuantity: existingInHistory.requiredQuantity
        };
      }
      return {
        name: option,
      };
    }
    return {
      itemId: option.id,
      requiredQuantity: option.requiredQuantity
    };
  }

  function findItemInList(option: string): ListItemView | undefined {
    return list.find(({ item }) => item.name === option);
  }

  function handleItemAlreadyInList(item: ListItemView): void {
    if (!item.checked) {
      dispatch({
        type: 'SNACK',
        payload: {
          message: 'Item already in list',
        },
      });
    } else {
      updateListItem(item, { checked: false });
    }
  }

  async function onAdd(option: Option) {
    if (typeof option === 'string') {
      const itemInList = findItemInList(option);
      if (itemInList) {
        handleItemAlreadyInList(itemInList);
        return;
      }
    }
    const item = getItemOrNew(option);
    const listItem = await addListItem(item, currentUser);
    if ('requiredQuantity' in item && item.requiredQuantity) {
      setPendingItem(listItem);
    }
  }

  function handleClose() {
    setPendingItem(null);
  }

  function handleUpdateQuantity(formData: FormData) {
    if (pendingItem) {
      const quantity = Number(formData.get('quantity'));
      if (quantity && !isNaN(quantity) && quantity > 0) {
        updateListItem(pendingItem, {
          quantity,
        });
        handleClose();
      }
    }
  }

  return (
    <>
    <Header
      onSubmit={onAdd}
      input={{ placeholder: 'Product Name', options: items }}
      submit={{ icon: SearchIcon, label: 'Add' }}
    >
      <Divider className={classes.divider} orientation='vertical' />
      {/* @ts-ignore */}
      <Link to='/history' style={{ textDecoration: 'none' }}>
        <IconButton
          className={classes.iconButton}
          aria-label='Add from history'
          size='large'
        >
          <HistoryIcon />
        </IconButton>
      </Link>
    </Header>
    {
      pendingItem && (
        <FormDialog
          title="Quantity"
          content={
            <TextField
              autoFocus
              required
              margin="dense"
              id="name"
              name="quantity"
              label="Quantity"
              type="number"
              fullWidth
              variant="standard"
              InputProps={{
                inputProps: { min: 1 },
              }}
            />
          }
          actionText="Update"
          closeDialog={handleClose}
          onAction={handleUpdateQuantity}
        />
      )
    }
    </>
  );
};
