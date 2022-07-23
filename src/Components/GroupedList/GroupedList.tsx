import React, { FC, ReactChild } from 'react';
import {
  List,
  ListSubheader,
  ListItem as MuiListItem,
  Checkbox,
  IconButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useGlobalStyles } from '../../Styles/common';
import { ListItem } from '../../Types/entities';
import { Swipable } from '../Swipeable/Swipeable';

export type GroupedListItem = {
  key: string;
  checked: boolean;
  primary: ReactChild;
  secondary?: ReactChild;
  level?: ListItem['urgency'];
};

type GroupedListProps = {
  categories: Array<[string, Array<GroupedListItem>]>;
  actionIcon: ReactChild;
  onCheckItem(item: GroupedListItem): void;
  onDeleteItem(item: GroupedListItem): void;
  onAction?(item: GroupedListItem): void;
};

const useStyles = makeStyles((theme) => ({
  ul: {
    padding: 0,
    listStyle: 'none',
  },
  listSubheader: {
    backgroundColor: theme.palette.background.default,
  },

  level1: {},
  level2: {
    boxShadow: 'inset 8px 0px 0 -4px #edce5e',
  },
  level3: {
    boxShadow: 'inset 8px 0px 0 -4px #be302d',
  },
}));

export const GroupedList: FC<GroupedListProps> = ({
  categories,
  onAction,
  actionIcon,
  onCheckItem,
  onDeleteItem,
}) => {
  const classes = useStyles();
  const globalClasses = useGlobalStyles();

  const getLevelClass = (level: GroupedListItem['level']) => {
    return level
      ? {
          '1': '',
          '2': classes.level2,
          '3': classes.level3,
        }[level]
      : '';
  };

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
              <Swipable
                key={item.key}
                onSwipeRight={() => onCheckItem(item)}
                onSwipeLeft={() => onDeleteItem(item)}
                icons={{
                  before: <span style={{ color: '#fff' }}>✓</span>,
                  after: <span style={{ color: '#fff' }}>✗</span>,
                }}
              >
                <MuiListItem
                  component='div'
                  classes={{
                    root: getLevelClass(item.level),
                  }}
                  key={item.key}
                  dense
                >
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
                  <ListItemSecondaryAction>
                    {onAction && (
                      <IconButton onClick={() => onAction(item)} size='large'>
                        {actionIcon}
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </MuiListItem>
              </Swipable>
            ))}
          </ul>
        </li>
      ))}
    </List>
  );
};