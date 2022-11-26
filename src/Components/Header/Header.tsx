import React, { FC } from 'react';
import { Menu as MenuIcon, SvgIconComponent } from '@mui/icons-material';
import { Alert, Button, IconButton, Paper } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useAuth } from '../../Hooks/useAuth';
import { useToggleMainNav } from '../../Hooks/useToggleMainNav';
import { login } from '../../Services/auth';
import { Item } from '../../Types/entities';
import { Autocomplete } from '../Autocomplete/Autocomplete';

type HeaderProps = {
  onSubmit?(item: string | object): void;
  input?: {
    placeholder: string;
    options?: Array<Item>;
  };
  submit?: {
    label: string;
    icon: SvgIconComponent;
  };
};

const useStyles = makeStyles((theme) => ({
  root: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
  },
  divider: {
    height: 28,
    margin: 4,
  },
}));

export const Header: FC<HeaderProps> = ({
  children,
  onSubmit,
  input,
  submit,
}) => {
  const classes = useStyles();
  const toggleMainNav = useToggleMainNav();
  const { currentUser, isLoading } = useAuth();
  const shouldShowUserWarning = !currentUser && !isLoading;

  function onFormSubmit(item: Item | string) {
    if (onSubmit) {
      onSubmit(item);
    }
  }

  return (
    <>
      <Paper className={classes.root}>
        <IconButton
          className={classes.iconButton}
          aria-label='menu'
          onClick={toggleMainNav}
          size='large'
        >
          <MenuIcon />
        </IconButton>
        {input && submit && (
          <div className={classes.input}>
            <Autocomplete
              options={input.options || []}
              onSelect={onFormSubmit}
              placeholder='Product Name'
              maxResult={5}
            />
            <IconButton
              type='submit'
              className={classes.iconButton}
              aria-label={submit.label}
              size='large'
            >
              <submit.icon />
            </IconButton>
          </div>
        )}
        {children}
      </Paper>
      {shouldShowUserWarning && (
        <Alert
          severity='warning'
          action={
            <Button color='inherit' size='small' onClick={login}>
              Login
            </Button>
          }
        >
          Don't be stranger
        </Alert>
      )}
    </>
  );
};
