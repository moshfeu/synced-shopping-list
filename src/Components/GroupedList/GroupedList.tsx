import React, { FC, ReactChild, useState } from 'react';
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
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import makeStyles from '@mui/styles/makeStyles';
import { useGlobalStyles } from '../../Styles/common';
import { Item, ListItem } from '../../Types/entities';
import { Swipable } from '../Swipeable/Swipeable';

export type GroupedListItem = {
  key: string;
  checked: boolean;
  primary: ReactChild;
  secondary?: ReactChild;
  level?: ListItem['urgency'];
  image?: Item['image'];
};

type GroupedListProps = {
  categories: Array<[string, Array<GroupedListItem>]>;
  actionIcon: ReactChild | ((item: GroupedListItem) => ReactChild);
  onCheckItem(item: GroupedListItem): void;
  onDeleteItem?(item: GroupedListItem): void;
  onAction?(item: GroupedListItem): void;
  collapsible?: boolean;
};

const useStyles = makeStyles((theme) => ({
  ul: {
    padding: 0,
    listStyle: 'none',
  },
  listSubheader: {
    backgroundColor: theme.palette.background.default,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
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
  collapsible = false,
}) => {
  const classes = useStyles();
  const globalClasses = useGlobalStyles();

  // Initialize expanded state - only first category expanded if collapsible
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    if (!collapsible || categories.length === 0) {
      return new Set(categories.map(([category]) => category));
    }
    return new Set([categories[0][0]]);
  });

  const toggleCategory = (categoryName: string) => {
    if (!collapsible) return;
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

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
      {categories.map(([category, categoryItems]) => {
        const isExpanded = expandedCategories.has(category);
        
        return (
          <li key={`section-${category}`}>
            <ul className={classes.ul}>
              <ListSubheader
                color='primary'
                classes={{ root: classes.listSubheader }}
                onClick={() => toggleCategory(category)}
              >
                <span>{category}</span>
                {collapsible && (
                  isExpanded ? <ExpandLess /> : <ExpandMore />
                )}
              </ListSubheader>
              {isExpanded && categoryItems.map((item) => (
                <Swipable
                  key={item.key}
                  onSwipeRight={() => onCheckItem(item)}
                  onSwipeLeft={
                    onDeleteItem ? () => onDeleteItem?.(item) : undefined
                  }
                  icons={{
                    before: <span style={{ color: '#fff' }}>✓</span>,
                    after: <span style={{ color: '#fff' }}>✗</span>,
                  }}
                >
                  <MuiListItem
                    ContainerComponent='div'
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
                        checked={item.checked || false}
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
                          {typeof actionIcon === 'function'
                            ? actionIcon(item)
                            : actionIcon}
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </MuiListItem>
                </Swipable>
              ))}
            </ul>
          </li>
        );
      })}
    </List>
  );
};
