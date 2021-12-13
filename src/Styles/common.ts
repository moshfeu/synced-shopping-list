import makeStyles from '@mui/styles/makeStyles';

export const useGlobalStyles = makeStyles(() => ({
  centerContent: {
    display: 'grid',
    placeItems: 'center',
  },
  listItemIcon: {
    minWidth: 'auto',
  },
  flexGrow: {
    flex: 1,
  },
  flex: {
    display: 'flex',
  },
}));
