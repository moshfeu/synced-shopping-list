import {
  List,
  makeStyles,
  ListSubheader,
  ListItem,
  Checkbox,
  IconButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from '@material-ui/core';
import React, { FC, ReactChild } from 'react';
import { useGlobalStyles } from '../../Styles/common';

export type GroupedListItem = {
  key: string;
  checked: boolean;
  primary: ReactChild;
  secondary?: ReactChild;
};

type GroupedListProps = {
  categories: Array<[string, Array<GroupedListItem>]>;
  actionIcon: ReactChild;
  onCheckItem(item: GroupedListItem): void;
  onAction(item: GroupedListItem): void;
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

export const GroupedList: FC<GroupedListProps> = ({
  categories,
  onAction,
  actionIcon,
  onCheckItem,
}) => {
  const classes = useStyles();
  const globalClasses = useGlobalStyles();

  return (
    <List subheader={<li />}>
      {categories.map(([category, categoryItems]) => (
        <li key={`section-${category}`}>
          <ul className={classes.ul}>
            <ListSubheader
              color='primary'
              classes={{ root: classes.listSubheader }}
            >
              {category}
            </ListSubheader>
            {categoryItems.map((item) => (
              <ListItem key={item.key} dense button>
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
                  id={item.key}
                  primary={item.primary}
                  secondary={item.secondary}
                />
                <ListItemSecondaryAction
                  classes={{ root: classes.listItemAction }}
                >
                  {onAction && (
                    <IconButton onClick={() => onAction(item)}>
                      {actionIcon}
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </ul>
        </li>
      ))}
    </List>
  );
};
