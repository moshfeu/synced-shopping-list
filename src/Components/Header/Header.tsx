import React, { FC, FormEvent } from 'react';
import { IconButton, InputBase, makeStyles, Paper } from '@material-ui/core';
import { Menu as MenuIcon, SvgIconComponent } from '@material-ui/icons';
import { useUIStore } from '../../Hooks/useUIStore';

type HeaderProps = {
  onSubmit?: (text: string) => void;
  input?: {
    placeholder: string;
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

  function onFormSubmit(e: FormEvent<HTMLDivElement>) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const text = new FormData(form).get('name') as string;
    if (onSubmit) {
      onSubmit(text);
    }
    form.reset();
  }

  const { dispatch } = useUIStore();
  const classes = useStyles();

  return (
    <Paper component='form' className={classes.root} onSubmit={onFormSubmit}>
      <IconButton
        className={classes.iconButton}
        aria-label='menu'
        onClick={toggleDrawer}
      >
        <MenuIcon />
      </IconButton>
      {input && submit && (
        <>
          <InputBase
            className={classes.input}
            placeholder='Product Name'
            name='name'
          />
          <IconButton
            type='submit'
            className={classes.iconButton}
            aria-label={submit.label}
          >
            <submit.icon />
          </IconButton>
        </>
      )}
      {children}
    </Paper>
  );
};
