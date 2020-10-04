import { makeStyles } from '@material-ui/core';

export const useGlobalStyles = makeStyles(() => ({
  centerContent: {
    display: 'grid',
    placeItems: 'center',
  },
  listItemIcon: {
    minWidth: 'auto',
  },
}));
