import React, { FC } from 'react';
import {
  makeStyles,
  createStyles,
  Divider,
  Link as MuiLink,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  SwipeableDrawer,
  Typography,
  Grid,
} from '@material-ui/core';
import { List as ListIcon, Category as CategoryIcon } from '@material-ui/icons';
import { Link } from 'react-router-dom';
import { ReactComponent as NavIllustration } from '../../Assets/nav.svg';

import { useUIStore } from '../../Hooks/useUIStore';
import { useAuth } from '../../Hooks/useAuth';
import { login, logout } from '../../Services/auth';

const drawerWidth = 240;

const useStyles = makeStyles((theme) =>
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
    illustration: {
      width: '100%',
      height: 'auto',
    },
    subHeader: {
      padding: theme.spacing(0, 0, 1, 0),
    },
    helloSection: {
      padding: theme.spacing(0, 1),
      lineHeight: 1,
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
  const classes = useStyles();
  const { state, dispatch } = useUIStore();
  const currentUser = useAuth();

  function toggleDrawer() {
    dispatch({ type: 'TOGGLE_DRAWER' });
  }

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
        <List
          subheader={
            <ListSubheader component='div' className={classes.subHeader}>
              <NavIllustration className={classes.illustration} />
              {currentUser ? (
                <HelloSection
                  text={`Hi ${currentUser.displayName} `}
                  actionText='Logout'
                  action={logout}
                />
              ) : (
                <HelloSection
                  text={`Hi stranger `}
                  actionText='Login'
                  action={login}
                />
              )}
            </ListSubheader>
          }
        >
          <Divider />
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

type HelloSectionProps = {
  text: string;
  actionText: string;
  action(): void;
};

const HelloSection: FC<HelloSectionProps> = ({ text, actionText, action }) => {
  const classes = useStyles();

  return (
    <Grid
      container
      spacing={1}
      alignItems='center'
      className={classes.helloSection}
    >
      <Grid item>
        <Typography>{text}</Typography>
      </Grid>
      <Grid item>
        <MuiLink component='button' variant='body2' onClick={action}>
          {actionText}
        </MuiLink>
      </Grid>
    </Grid>
  );
};
