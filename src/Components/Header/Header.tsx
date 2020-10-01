import React, { FC } from 'react';
import { IconButton, makeStyles, Paper } from '@material-ui/core';
import { Menu as MenuIcon, SvgIconComponent } from '@material-ui/icons';
import { useUIStore } from '../../Hooks/useUIStore';
import { Item } from '../../types';
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
  function toggleDrawer() {
    dispatch({
      type: 'TOGGLE_DRAWER',
    });
  }

  function onFormSubmit(item: Item | string) {
    if (onSubmit) {
      onSubmit(item);
    }
  }

  const classes = useStyles();
  const { dispatch } = useUIStore();

  return (
    <Paper className={classes.root}>
      <IconButton
        className={classes.iconButton}
        aria-label='menu'
        onClick={toggleDrawer}
      >
        <MenuIcon />
      </IconButton>
      {input && submit && (
        <div className={classes.input}>
          <Autocomplete
            options={input.options || []}
            onSelect={onFormSubmit}
            placeholder='Product Name'
          />
          <IconButton
            type='submit'
            className={classes.iconButton}
            aria-label={submit.label}
          >
            <submit.icon />
          </IconButton>
        </div>
      )}
      {children}
    </Paper>
  );
};
