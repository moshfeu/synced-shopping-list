import React from 'react';
import { Button, IconButton, Snackbar as MuiSnackbar, Theme } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { Close } from '@mui/icons-material';
import { useUIStore } from '../../../Hooks/useUIStore';

type SnackbarProps = {
  open: boolean;
  onAction?(): void;
  actionText?: string;
  message: string;
};

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '& .MuiSnackbarContent-root': {
      backgroundColor: theme.palette.info.main,
    },
  },
}));

export const Snackbar = ({
  open,
  actionText,
  message,
  onAction,
}: SnackbarProps) => {
  const { root } = useStyles();
  const { dispatch } = useUIStore();

  function handleClose() {
    dispatch({
      type: 'SNACK',
      payload: null,
    });
  }

  return (
    <MuiSnackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      classes={{ root }}
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      message={message}
      action={
        <>
          {onAction ? (
            <Button
              color='secondary'
              size='small'
              onClick={() => {
                handleClose();
                onAction();
              }}
            >
              {actionText}
            </Button>
          ) : null}
          <IconButton
            size='small'
            aria-label='close'
            color='inherit'
            onClick={handleClose}
          >
            <Close fontSize='small' />
          </IconButton>
        </>
      }
    />
  );
};
