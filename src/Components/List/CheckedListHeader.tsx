import React, { FC } from 'react';
import { Box, Button } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { Delete } from '@mui/icons-material';

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
