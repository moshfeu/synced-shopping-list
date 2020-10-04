import React, { FC, ReactChild } from 'react';
import clsx from 'clsx';
import { makeStyles, Typography } from '@material-ui/core';
import { ReactComponent as EmptyStateIllustration } from '../../Assets/emptyState.svg';
import { useGlobalStyles } from '../../Styles/common';

type EmptyStateProps = {
  text: ReactChild;
};

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4),
  },
  content: {
    textAlign: 'center',
  },
  illustration: {
    width: '100%',
    height: 'auto',
    marginBottom: theme.spacing(2),
  },
}));

export const EmptyState: FC<EmptyStateProps> = ({ text }) => {
  const classes = useStyles();
  const globalClasses = useGlobalStyles();

  return (
    <div className={clsx([classes.root, globalClasses.centerContent])}>
      <div className={classes.content}>
        <EmptyStateIllustration className={classes.illustration} />
        <Typography component='div'>{text}</Typography>
      </div>
    </div>
  );
};
