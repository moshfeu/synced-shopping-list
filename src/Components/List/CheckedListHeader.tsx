import React, { FC } from 'react';
import { Box, Button, makeStyles } from '@material-ui/core';
import { Delete } from '@material-ui/icons';

type CheckedListHeaderProps = {
  onDelete(): void;
};

const useStyles = makeStyles((theme) => ({
  checkedListHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: theme.palette.info.main,
    padding: theme.spacing(1),
  },
}));

export const CheckedListHeader: FC<CheckedListHeaderProps> = ({ onDelete }) => {
  const classes = useStyles();

  return (
    <Box className={classes.checkedListHeader}>
      <Button
        variant='contained'
        color='secondary'
        startIcon={<Delete />}
        onClick={onDelete}
      >
        Delete All
      </Button>
    </Box>
  );
};
