import React, { FC, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  List as ListIcon,
  Category as CategoryIcon,
  NetworkWifi as OnlineIcon,
  SignalCellularConnectedNoInternet0Bar as OfflineIcon,
} from '@mui/icons-material';
import {
  Divider,
  Link as MuiLink,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  Typography,
  Chip,
  Grid,
  ListItemButton,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { version } from '../../../package.json';
import NavIllustration from '../../Assets/nav.svg?react';
import { useAuth } from '../../Hooks/useAuth';
import { useOnline } from '../../Hooks/useOnline';
import { useToggleMainNav } from '../../Hooks/useToggleMainNav';
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
      display: 'grid',
      gridTemplateRows: 'auto auto 1fr auto',
    },
    navItemText: {
      '&:first-letter': {
        textTransform: 'uppercase',
      },
    },
    navItem: {
      cursor: 'pointer',
      textDecoration: 'none',
      color: 'inherit',
    },
    illustration: {
      width: '100%',
      height: 'auto',
    },
    subHeader: {
      padding: theme.spacing(0, 0, 1, 0),
    },
    helloSection: {
      padding: theme.spacing(1, 1, 0),
      lineHeight: 1,
      display: 'flex',
      gap: theme.spacing(1),
    },
    footer: {
      padding: theme.spacing(0, 0, 1),
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
    path: '/categories',
    icon: <CategoryIcon />,
  },
];

function shouldMainNavBeOpen(location: ReturnType<typeof useLocation>) {
  return new URLSearchParams(location.search).has('menu');
}

export const MainNav: FC = () => {
  const classes = useStyles();
  const { currentUser } = useAuth();
  const location = useLocation();
  const toggleMainNav = useToggleMainNav();
  const [isOpen, setIsOpen] = useState(shouldMainNavBeOpen(location));

  useEffect(() => {
    setIsOpen(shouldMainNavBeOpen(location));
  }, [location]);

  return (
    <>
      <SwipeableDrawer
        classes={{
          root: classes.drawer,
          paper: classes.drawerPaper,
        }}
        anchor='left'
        open={isOpen}
        onClose={toggleMainNav}
        onOpen={toggleMainNav}
        swipeAreaWidth={5}
      >
        <div className={classes.subHeader}>
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
        </div>
        <Divider />
        <List>
          {routes.map(({ icon, text, path }) => {
            console.log(11111, location, path);
            return (
            <ListItemButton
              key={text}
              component={Link as React.ElementType}
              to={path}
              onClick={toggleMainNav}
              className={classes.navItem}
              selected={location.pathname === path}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText
                classes={{ primary: classes.navItemText }}
                primary={text}
              />
            </ListItemButton>
            );
          })}
        </List>
        <Grid
          container
          className={classes.footer}
          alignItems='center'
          justifyContent='center'
          gap={1}
        >
          <OnlineIndication />
          <Typography variant='caption'>{version}</Typography>
        </Grid>
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
    <div className={classes.helloSection}>
      <Typography component='span'>{text}</Typography>
      <MuiLink component='button' variant='body2' onClick={action}>
        {actionText}
      </MuiLink>
    </div>
  );
};

const OnlineIndication = () => {
  const isOnline = useOnline();

  if (isOnline === undefined) {
    return null;
  }

  return (
    <Chip
      size='small'
      variant='outlined'
      color={isOnline ? 'success' : 'warning'}
      label={isOnline ? 'online' : 'offline'}
      icon={
        isOnline ? (
          <OnlineIcon />
        ) : (
          <OfflineIcon />
        )
      }
    />
  );
};
