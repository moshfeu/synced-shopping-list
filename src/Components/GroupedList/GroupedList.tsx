import React, { FC, ReactChild, useRef } from 'react';
import {
  List,
  ListSubheader,
  ListItem as MuiListItem,
  Checkbox,
  IconButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Collapse,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useSessionStorageState } from '../../Hooks/useSessionStorageState';
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
  /** When set, sections are collapsible and their state is kept in sessionStorage under this key */
  collapsibleStorageKey?: string;
};

const useStyles = makeStyles((theme) => ({
  ul: {
    padding: 0,
    listStyle: 'none',
  },
  listSubheader: {
    backgroundColor: theme.palette.background.default,
  },
  checkedCounter: {
    marginInlineStart: theme.spacing(0.5),
    opacity: 0.7,
  },
  collapsibleSubheader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
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
  collapsibleStorageKey,
}) => {
  const classes = useStyles();
  const globalClasses = useGlobalStyles();
  const collapsible = Boolean(collapsibleStorageKey);
  const [collapsed, updateCollapsed] = useSessionStorageState<string[]>(
    collapsibleStorageKey ?? 'grouped-list-collapsed',
    []
  );

  const sectionRefs = useRef(new Map<string, HTMLLIElement>());

  const isCollapsed = (category: string) =>
    collapsible && collapsed.includes(category);

  // When a section folds, smoothly scroll to its header while the collapse
  // animation runs, so the view never lands in the middle of another section.
  const toggleCategory = (category: string) => {
    if (!isCollapsed(category)) {
      sectionRefs.current
        .get(category)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    updateCollapsed((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
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
      {categories.map(([category, categoryItems]) => (
        <li
          key={`section-${category}`}
          ref={(el) => {
            el
              ? sectionRefs.current.set(category, el)
              : sectionRefs.current.delete(category);
          }}
        >
          <ul className={classes.ul}>
            <ListSubheader
              color='primary'
              classes={{
                root: `${classes.listSubheader} ${
                  collapsible ? classes.collapsibleSubheader : ''
                }`,
              }}
              onClick={
                collapsible ? () => toggleCategory(category) : undefined
              }
              aria-expanded={collapsible ? !isCollapsed(category) : undefined}
            >
              <span>
                {category}
                {categoryItems.some((item) => item.checked) && (
                  <span className={classes.checkedCounter}>
                    ({categoryItems.filter((item) => item.checked).length})
                  </span>
                )}
              </span>
              {collapsible &&
                (isCollapsed(category) ? <ExpandMore /> : <ExpandLess />)}
            </ListSubheader>
            <Collapse
              in={!isCollapsed(category)}
              timeout='auto'
              unmountOnExit
            >
            {categoryItems.map((item) => (
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
            </Collapse>
          </ul>
        </li>
      ))}
    </List>
  );
};
