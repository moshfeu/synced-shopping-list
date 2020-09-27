import React, { FC } from 'react';
import {
  createStyles,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  SwipeableDrawer,
} from '@material-ui/core';
import { List as ListIcon, Category as CategoryIcon } from '@material-ui/icons';
import { Link } from 'react-router-dom';

import { useUIStore } from '../../Hooks/useUIStore';

const drawerWidth = 240;

const useStyles = makeStyles(() =>
  createStyles({
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      width: drawerWidth,
    },
    navItemText: {
      '&:first-letter': {
        textTransform: 'uppercase',
      },
    },
  })
);

const routes = [
  {
    text: 'List',
    path: '/',
    icon: <ListIcon />,
  },
  {
    text: 'Categories',
    path: 'categories',
    icon: <CategoryIcon />,
  },
];

export const Drawer: FC = () => {
  function toggleDrawer() {
    dispatch({ type: 'TOGGLE_DRAWER' });
  }

  const classes = useStyles();
  const { state, dispatch } = useUIStore();

  return (
    <>
      <SwipeableDrawer
        classes={{
          root: classes.drawer,
          paper: classes.drawerPaper,
        }}
        anchor='left'
        open={state.drawOpened}
        onClose={toggleDrawer}
        onOpen={toggleDrawer}
      >
        <List>
          {routes.map(({ icon, text, path }) => (
            <ListItem
              key={text}
              button
              component={Link}
              to={path}
              onClick={toggleDrawer}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText
                classes={{ primary: classes.navItemText }}
                primary={text}
              />
            </ListItem>
          ))}
        </List>
      </SwipeableDrawer>
    </>
  );
};
