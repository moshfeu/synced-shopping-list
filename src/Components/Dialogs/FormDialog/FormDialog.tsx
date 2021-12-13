import React, { FC, ReactChild } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';

type FormDialogProps = {
  title: ReactChild;
  content: ReactChild;
  actionText: string;
  closeDialog(): void;
  onAction(formData: FormData): void;
};

export const FormDialog: FC<FormDialogProps> = ({
  title,
  content,
  actionText,
  closeDialog,
  onAction,
}) => {
  return (
    <Dialog
      open={true}
      onClose={closeDialog}
      aria-labelledby='form-dialog-title'
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          closeDialog();
          onAction(new FormData(e.target as HTMLFormElement));
        }}
      >
        <DialogTitle id='form-dialog-title'>{title}</DialogTitle>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color='primary'>
            Cancel
          </Button>
          <Button type='submit' color='primary'>
            {actionText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
