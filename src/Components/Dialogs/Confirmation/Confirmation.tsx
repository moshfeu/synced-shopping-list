import React, { FC } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  text: string;
  onConfirm(): void;
  handleClose(): void;
};

export const ConfirmationDialog: FC<ConfirmationDialogProps> = ({
  open,
  title,
  text,
  onConfirm,
  handleClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle id='alert-dialog-title'>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description'>
          {text}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='primary'>
          Disagree
        </Button>
        <Button onClick={onConfirm} color='primary' autoFocus>
          Agree
        </Button>
      </DialogActions>
    </Dialog>
  );
};
