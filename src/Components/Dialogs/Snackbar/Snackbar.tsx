import React, { FC, useState } from 'react';
import { Button, IconButton, Snackbar as MuiSnackbar } from '@material-ui/core';
import { Close } from '@material-ui/icons';

type SnackbarProps = {
  open: boolean;
  actionText: string;
  onAction(): void;
};

export const Snackbar: FC<SnackbarProps> = ({ open, actionText, onAction }) => {
  const [isOpen, setIsOpen] = useState(open);

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <MuiSnackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      open={isOpen}
      autoHideDuration={6000}
      onClose={handleClose}
      message='Note archived'
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
