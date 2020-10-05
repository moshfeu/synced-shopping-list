import React, { FC, ReactElement, useMemo } from 'react';
import { groupBy, startCase } from 'lodash';
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Checkbox,
  ListItemIcon,
  ListSubheader,
  makeStyles,
} from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { ListItemView } from '../../types';
import { UNCATEGORIZED } from '../../consts';
import { useGlobalStyles } from '../../Styles/common';

type ItemProps = {
  items: Array<ListItemView>;
  header?: ReactElement;
  className: string;
  groupByCategory?: boolean;
  onCheckItem(listItem: ListItemView): void;
  onClickMoreItem?(listItem: ListItemView): void;
};

const useStyles = makeStyles((theme) => ({
  ul: {
    padding: 0,
    listStyle: 'none',
  },
  listSubheader: {
    backgroundColor: theme.palette.background.default,
  },
  listItemAction: {
    right: 0,
  },
}));

export const ListItems: FC<ItemProps> = ({
  items,
  header,
  className,
  onCheckItem,
  onClickMoreItem,
}) => {
  const classes = useStyles();
  const globalClasses = useGlobalStyles();

  const groupByCategories = useMemo(() => {
    return Object.entries(
      groupBy(
        items,
        (item) => item.item.category?.name || startCase(UNCATEGORIZED)
      )
    ).sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB));
  }, [items]);

  if (!items.length) {
    return <></>;
  }

  return (
    <div className={className}>
      {header}
      <List subheader={<li />}>
        {groupByCategories.map(([category, categoryItems]) => (
          <li key={`section-${category}`}>
            <ul className={classes.ul}>
              <ListSubheader
                color='primary'
                classes={{ root: classes.listSubheader }}
              >
                {category}
              </ListSubheader>
              {categoryItems.map((item) => (
                <ListItem key={item.id} dense button>
                  <ListItemIcon classes={{ root: globalClasses.listItemIcon }}>
                    <Checkbox
                      onChange={() => onCheckItem(item)}
                      edge='start'
                      tabIndex={-1}
                      disableRipple
                      checked={item.checked}
                    />
                  </ListItemIcon>
                  <ListItemText
                    id={item.id}
                    primary={
                      <ListItemTextComposition
                        name={item.item.name}
                        quantity={item.quantity}
                      />
                    }
                    secondary={item.note}
                  />
                  <ListItemSecondaryAction
                    classes={{ root: classes.listItemAction }}
                  >
                    {onClickMoreItem && (
                      <IconButton onClick={() => onClickMoreItem(item)}>
                        <MoreVert />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </ul>
          </li>
        ))}
      </List>
    </div>
  );
};

const ListItemTextComposition: FC<{
  name: string;
  quantity: number;
}> = ({ name, quantity }) => (
  <>
    {name}
    {quantity > 1 ? <> ({quantity})</> : null}
  </>
);
